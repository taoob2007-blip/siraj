/**
 * GET /api/cron/email-retry
 *
 * Called by Vercel Cron every 5 minutes (configured in vercel.json).
 * Picks up emails from email_logs that failed and have a next_retry_at in the past,
 * re-sends them using the same emailService (with its own internal retry), and
 * updates the log record accordingly.
 *
 * Also marks emails as 'dead' after they have been retried 3+ times.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/supabase/server'
import { getResend, EMAIL_FROM, isEmailEnabled } from '@/lib/email/resend'

const CRON_SECRET   = process.env.CRON_SECRET
const MAX_DEAD_MARK = 3   // mark dead after this many total attempts
const BATCH_SIZE    = 20  // process at most 20 failed emails per invocation

export async function GET(req: NextRequest) {
  // Authorization: Vercel sends the CRON_SECRET as a Bearer token
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isEmailEnabled()) {
    return NextResponse.json({ skipped: true, reason: 'emails_disabled' })
  }

  const supabase = getServiceSupabaseClient()

  // Fetch retryable failed emails
  const { data: failedEmails, error: fetchError } = await supabase
    .from('email_logs')
    .select('id, email_type, to_email, subject, html_body, attempts')
    .eq('status', 'failed')
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchError) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'cron_email_retry_fetch_failed',
      error: fetchError.message,
      ts:    new Date().toISOString(),
    }))
    return NextResponse.json({ error: 'Failed to fetch retryable emails' }, { status: 500 })
  }

  if (!failedEmails || failedEmails.length === 0) {
    return NextResponse.json({ retried: 0, dead: 0 })
  }

  const resend = getResend()
  let retried = 0
  let dead    = 0

  await Promise.allSettled(
    failedEmails.map(async (log) => {
      // Mark as dead if max attempts reached
      if (log.attempts >= MAX_DEAD_MARK) {
        await supabase
          .from('email_logs')
          .update({ status: 'dead', next_retry_at: null })
          .eq('id', log.id)
        dead++
        console.warn(JSON.stringify({
          level:     'warn',
          event:     'email_marked_dead',
          logId:     log.id,
          emailType: log.email_type,
          to:        log.to_email,
          attempts:  log.attempts,
          ts:        new Date().toISOString(),
        }))
        return
      }

      // Attempt re-send (single attempt — service-level retry already exhausted)
      try {
        const { data, error } = await resend.emails.send({
          from:    EMAIL_FROM,
          to:      log.to_email,
          subject: `[Retry] ${log.subject}`,
          html:    log.html_body,
        })

        if (error || !data?.id) throw new Error(error?.message ?? 'No email ID returned')

        await supabase
          .from('email_logs')
          .update({
            status:          'sent',
            resend_email_id: data.id,
            sent_at:         new Date().toISOString(),
            attempts:        log.attempts + 1,
            next_retry_at:   null,
            last_error:      null,
          })
          .eq('id', log.id)

        console.log(JSON.stringify({
          level:     'info',
          event:     'email_retry_succeeded',
          logId:     log.id,
          emailType: log.email_type,
          to:        log.to_email,
          emailId:   data.id,
          ts:        new Date().toISOString(),
        }))

        retried++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const nextAttempts = log.attempts + 1
        const nextRetryAt  = nextAttempts >= MAX_DEAD_MARK
          ? null
          : new Date(Date.now() + 10 * 60 * 1000).toISOString()  // retry in 10 min

        await supabase
          .from('email_logs')
          .update({
            attempts:      nextAttempts,
            last_error:    message,
            next_retry_at: nextRetryAt,
            status:        nextAttempts >= MAX_DEAD_MARK ? 'dead' : 'failed',
          })
          .eq('id', log.id)

        console.error(JSON.stringify({
          level:     'error',
          event:     'email_retry_failed',
          logId:     log.id,
          emailType: log.email_type,
          to:        log.to_email,
          attempt:   nextAttempts,
          error:     message,
          ts:        new Date().toISOString(),
        }))
      }
    })
  )

  return NextResponse.json({
    processed: failedEmails.length,
    retried,
    dead,
    ts: new Date().toISOString(),
  })
}
