'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2, CheckCircle2, Send, RefreshCw } from 'lucide-react'
import { toast } from '@/components/Toast'
import { submitPaymentRequest } from '@/app/billing/actions'

const WA_NUMBER = '966552488556'

function buildWaLink(email: string) {
  const msg = `السلام عليكم، أبغى الاشتراك في SIRAJ Pro.\nالإيميل: ${email}`
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
}

interface Props {
  email: string | null
}

export function PricingCTA({ email }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)

  // ── WhatsApp-only button (no DB — just opens chat) ──────────────────────────
  function handleWhatsApp() {
    if (!email) { router.push('/login?next=/pricing'); return }
    window.open(buildWaLink(email), '_blank', 'noopener,noreferrer')
  }

  // ── "I sent the transfer" button — inserts payment request + opens WA ───────
  function handleSentTransfer() {
    if (!email) { router.push('/login?next=/pricing'); return }

    // Open WhatsApp synchronously first (popup blockers fire on async calls)
    window.open(buildWaLink(email), '_blank', 'noopener,noreferrer')

    if (done) return

    setSubmitting(true)
    startTransition(async () => {
      const result = await submitPaymentRequest()
      if (result.ok) {
        setDone(true)
        toast.success('تم إرسال طلب الدفع. سيتم التفعيل خلال دقائق.')
        // Refresh server components so SubscriptionBanner and status cards update.
        router.refresh()
      } else if (result.error?.toLowerCase().includes('pending')) {
        setDone(true)
      } else {
        toast.error(result.error ?? 'حدث خطأ، حاول مرة أخرى.')
      }
      setSubmitting(false)
    })
  }

  // ── Post-submit state ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-300">تم استلام طلبك ✓</p>
            <p className="text-xs text-emerald-400/80 mt-1 leading-relaxed">
              سيتحقق فريقنا من التحويل ويفعّل حسابك خلال دقائق معدودة.
              إذا لم تتلقَّ تأكيداً خلال ساعة، تواصل معنا عبر واتساب.
            </p>
          </div>
        </div>
        <button
          onClick={handleWhatsApp}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400 hover:bg-emerald-500/[0.10] text-sm font-semibold transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          فتح واتساب مجدداً
        </button>
      </div>
    )
  }

  // ── Default CTA ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Primary: WhatsApp subscribe */}
      <button
        onClick={handleWhatsApp}
        className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white text-base font-bold transition-all shadow-lg shadow-[#25D366]/25"
      >
        <MessageCircle className="h-5 w-5" />
        {email ? 'اشترك الآن عبر واتساب' : 'سجّل دخولك للاشتراك'}
      </button>

      {/* Secondary: I sent the transfer */}
      {email && (
        <button
          onClick={handleSentTransfer}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-50"
        >
          {submitting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
          {submitting ? 'جارٍ الإرسال…' : 'أرسلت التحويل'}
        </button>
      )}
    </div>
  )
}
