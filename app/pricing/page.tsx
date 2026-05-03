export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAuthUser, getServerSupabaseClient } from '@/lib/supabase/server'
import { checkAccess } from '@/lib/subscription'
import { PricingCTA } from '@/components/PricingCTA'
import {
  CheckCircle2, Zap, FileText, Users, BarChart2,
  GitCompare, FileSignature, MessageSquare, PieChart,
  Crown, ArrowRight, Shield, Clock, Star, Building2,
} from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────

const WA_NUMBER = '966552488556'
const IBAN      = 'SA27 8000 0523 6080 1012 5902'
const BANK      = 'مصرف الراجحي'
const ACCOUNT_NAME = 'شركة سراج للتقنية'

const FEATURES = [
  { icon: FileText,      label: 'طلبات عروض أسعار غير محدودة' },
  { icon: Users,         label: 'موردون غير محدودين' },
  { icon: Zap,           label: 'تحليل الموردين بالذكاء الاصطناعي' },
  { icon: BarChart2,     label: 'تقارير وتحليلات متقدمة' },
  { icon: GitCompare,    label: 'مقارنة العروض جنباً إلى جنب' },
  { icon: FileSignature, label: 'إدارة العقود الذكية' },
  { icon: MessageSquare, label: 'التواصل مع الموردين' },
  { icon: PieChart,      label: 'تقارير المشتريات' },
]

const STEPS = [
  {
    n: '١',
    title: 'حوّل المبلغ',
    body: `حوّل 299 ر.س إلى الآيبان أدناه. اكتب إيميلك في ملاحظة التحويل.`,
  },
  {
    n: '٢',
    title: 'أرسل إشعاراً عبر واتساب',
    body: 'اضغط "اشترك الآن عبر واتساب" لإرسال إشعار لفريقنا فوراً.',
  },
  {
    n: '٣',
    title: 'يُفعَّل حسابك',
    body: 'نتحقق من التحويل ونُفعّل حسابك خلال دقائق — في أوقات الدوام.',
  },
]

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getUserContext() {
  try {
    const user = await getAuthUser()
    if (!user) return { email: null, isActive: false }

    const supabase = await getServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    const { allowed } = checkAccess(profile)
    return { email: user.email ?? null, isActive: allowed }
  } catch {
    return { email: null, isActive: false }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  const { email, isActive } = await getUserContext()

  // ── Active subscriber ──────────────────────────────────────────────────────
  if (isActive) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          الاشتراك نشط
        </div>
        <h1 className="text-3xl font-bold text-white">أنت جاهز تماماً!</h1>
        <p className="text-gray-400">اشتراكك نشط. توجّه للوحة التحكم وابدأ الآن.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          الذهاب للوحة التحكم <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // ── Upgrade funnel ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">

      {/* ── Urgency banner ── */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mx-auto">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <p className="text-xs font-semibold text-amber-300">
          عرض محدود · الشهر الأول مجاناً · عدد المقاعد محدود
        </p>
      </div>

      {/* ── Hero headline ── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider">
          <Crown className="h-3 w-3" />
          SIRAJ Pro
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          ابدأ الآن وطوّر إدارة الموردين
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
            في شركتك خلال دقائق
          </span>
        </h1>
        <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed">
          منصة SIRAJ تجمع طلبات العروض والموردين والعقود في مكان واحد مع تحليل ذكي بالذكاء الاصطناعي.
        </p>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 pt-1">
          {[
            { icon: Building2, text: 'تثق به أكثر من 50+ شركة' },
            { icon: Star,      text: 'نتائج فورية بدون تعقيد' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon className="h-3.5 w-3.5 text-gray-600 shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan card ── */}
      <div className="rounded-2xl border border-violet-500/25 bg-[#0d1220] overflow-hidden relative">
        {/* Top gradient line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
        {/* Glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-violet-500/[0.07] blur-3xl" />

        <div className="relative p-6 sm:p-8 space-y-7">

          {/* Badge + price */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full mb-3">
                <Star className="h-2.5 w-2.5" />
                الأكثر اختياراً
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white tabular-nums">299</span>
                <div>
                  <p className="text-lg text-gray-400 font-medium leading-none">ر.س</p>
                  <p className="text-sm text-gray-500">/ شهر</p>
                </div>
              </div>
              <p className="text-sm text-emerald-400 font-semibold mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                الشهر الأول مجاناً — ابدأ تجربتك اليوم
              </p>
            </div>

            {/* Guarantee badge */}
            <div className="shrink-0 text-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 hidden sm:block">
              <Shield className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-white leading-tight">ضمان</p>
              <p className="text-[10px] text-gray-500 leading-tight">استرجاع 7 أيام</p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="shrink-0 h-6 w-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Icon className="h-3 w-3 text-violet-400" />
                </div>
                <span className="text-sm text-gray-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.05]" />

          {/* CTA */}
          <PricingCTA email={email} />

          {/* Friction reducers */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield,   text: 'بدون التزام' },
              { icon: Clock,    text: 'إلغاء في أي وقت' },
              { icon: MessageSquare, text: 'دعم واتساب' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="text-center py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Icon className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                <p className="text-[11px] text-gray-600 font-medium">{text}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Bank transfer info ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
          <p className="text-sm font-semibold text-white">بيانات التحويل البنكي</p>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'الآيبان',    value: IBAN },
            { label: 'البنك',      value: BANK },
            { label: 'اسم الحساب', value: ACCOUNT_NAME },
            { label: 'المبلغ',     value: '299 ر.س' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-500 shrink-0">{label}</span>
              <span className="text-sm font-semibold text-white text-left font-mono tracking-wide">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 space-y-5">
        <p className="text-sm font-semibold text-white">كيف يعمل الاشتراك؟</p>
        <ol className="space-y-5">
          {STEPS.map(({ n, title, body }) => (
            <li key={n} className="flex items-start gap-4">
              <span className="flex-none h-8 w-8 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm font-bold text-violet-400 flex items-center justify-center shrink-0">
                {n}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── WhatsApp direct link ── */}
      <div className="rounded-2xl border border-[#25D366]/20 bg-[#25D366]/[0.04] p-5 flex items-center gap-4">
        <MessageSquare className="h-8 w-8 text-[#25D366] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">تحدّث مع فريقنا مباشرة</p>
          <p className="text-xs text-gray-500 mt-0.5">لديك سؤال؟ فريق الدعم متاح عبر واتساب.</p>
        </div>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('مرحباً، أبغى أعرف عن SIRAJ Pro')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all active:scale-95"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          تواصل معنا
        </a>
      </div>

      {/* ── Footer ── */}
      <p className="text-center text-xs text-gray-600 pb-4">
        {email ? (
          <>
            مسجّل بـ <span className="text-gray-400">{email}</span> ·{' '}
            <Link href="/billing" className="text-blue-400 hover:underline">سجل المدفوعات</Link>
          </>
        ) : (
          <>
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-blue-400 hover:underline">سجّل الدخول</Link>
          </>
        )}
      </p>

    </div>
  )
}
