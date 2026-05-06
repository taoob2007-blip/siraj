import { Resend } from 'resend'

// Singleton — avoids creating a new instance per-request in serverless
let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const EMAIL_FROM     = 'SIRAJ <rfq@usesiraj.com>'
export const isEmailEnabled = () => process.env.ENABLE_EMAILS === 'true'
