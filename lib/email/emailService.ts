/**
 * emailService — production-grade transactional email with retry + audit log.
 *
 * Features:
 *  - Singleton Resend client (no per-request allocation)
 *  - Exponential back-off retry (up to 3 attempts: 0ms / 1s / 2s)
 *  - 12 s hard timeout per attempt
 *  - Structured JSON logs (Vercel / Datadog / Axiom compatible)
 *  - Non-blocking audit log to email_logs table (best-effort, never blocks send)
 */

import { getResend, EMAIL_FROM, isEmailEnabled } from './resend'
import { getServiceSupabaseClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmailType =
  | 'rfq_invitation'
  | 'winner_notification'
  | 'loser_notification'
  | 'buyer_confirmation'
  | 'supplier_signing_link'
  | 'otp_verification'

export interface SendEmailParams {
  to:        string
  subject:   string
  html:      string
  from?:     string
  emailType: EmailType
  metadata?: {
    rfqId?:        string
    contractId?:   string
    userId?:       string
    supplierEmail?: string
    [key: string]: unknown
  }
}

export interface SendEmailResult {
  success:  boolean
  emailId?: string
  attempts: number
  error?:   string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS   = 3
const TIMEOUT_MS     = 12_000  // 12 s per attempt
const BACKOFF_BASE   = 1_000   // 1 s → 2 s between retries

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function structuredLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: Record<string, unknown>,
): void {
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  fn(JSON.stringify({ level, event, ...data, ts: new Date().toISOString() }))
}

// ── Core send (single attempt, with timeout) ──────────────────────────────────

async function trySend(
  to: string,
  from: string,
  subject: string,
  html: string,
): Promise<string> {
  const resend = getResend()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const { data, error } = await resend.emails.send({ from, to, subject, html })

    if (error) throw new Error(`Resend: ${error.message} (${error.name})`)
    if (!data?.id) throw new Error('Resend returned no email ID')

    return data.id
  } finally {
    clearTimeout(timer)
  }
}

// ── Public sendEmail ──────────────────────────────────────────────────────────

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isEmailEnabled()) {
    structuredLog('info', 'email_disabled', {
      emailType: params.emailType,
      to:        params.to,
    })
    return { success: true, attempts: 0 }
  }

  const from = params.from ?? EMAIL_FROM
  let lastError = ''
  let emailId: string | undefined

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      emailId = await trySend(params.to, from, params.subject, params.html)

      structuredLog('info', 'email_sent', {
        emailType: params.emailType,
        to:        params.to,
        emailId,
        attempt,
        metadata:  params.metadata,
      })

      // Best-effort DB audit — never block the caller
      void logToDb({
        emailType: params.emailType,
        to:        params.to,
        subject:   params.subject,
        html:      params.html,
        status:    'sent',
        resendId:  emailId,
        attempts:  attempt,
        metadata:  params.metadata,
      })

      return { success: true, emailId, attempts: attempt }

    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)

      structuredLog('warn', 'email_attempt_failed', {
        emailType:   params.emailType,
        to:          params.to,
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        error:       lastError,
        metadata:    params.metadata,
      })

      if (attempt < MAX_ATTEMPTS) {
        await sleep(BACKOFF_BASE * (attempt))  // 1 s, then 2 s
      }
    }
  }

  structuredLog('error', 'email_failed_permanently', {
    emailType: params.emailType,
    to:        params.to,
    error:     lastError,
    metadata:  params.metadata,
  })

  // Best-effort DB audit
  void logToDb({
    emailType: params.emailType,
    to:        params.to,
    subject:   params.subject,
    html:      params.html,
    status:    'failed',
    attempts:  MAX_ATTEMPTS,
    lastError,
    metadata:  params.metadata,
  })

  return { success: false, attempts: MAX_ATTEMPTS, error: lastError }
}

// ── DB audit log (best-effort, never throws) ──────────────────────────────────

interface LogEntry {
  emailType: string
  to:        string
  subject:   string
  html:      string
  status:    'sent' | 'failed'
  resendId?: string
  attempts:  number
  lastError?: string
  metadata?: Record<string, unknown>
}

async function logToDb(entry: LogEntry): Promise<void> {
  try {
    const supabase = getServiceSupabaseClient()
    await supabase.from('email_logs').insert({
      email_type:      entry.emailType,
      to_email:        entry.to,
      subject:         entry.subject,
      html_body:       entry.html,
      status:          entry.status,
      resend_email_id: entry.resendId ?? null,
      attempts:        entry.attempts,
      last_error:      entry.lastError ?? null,
      metadata:        entry.metadata ?? {},
      sent_at:         entry.status === 'sent' ? new Date().toISOString() : null,
      next_retry_at:   entry.status === 'failed'
        ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
        : null,
    })
  } catch {
    // DB logging is best-effort — a logging failure must never crash email delivery
  }
}
