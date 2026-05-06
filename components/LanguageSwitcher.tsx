'use client'

import { useLocale } from 'next-intl'

/**
 * variant="pill"   — used in Sidebar bottom nav, full-width pill
 * variant="compact" — used in MobileHeader, compact two-letter toggle
 */
export function LanguageSwitcher({
  variant = 'pill',
}: {
  variant?: 'pill' | 'compact'
}) {
  const locale = useLocale()
  const isAr   = locale === 'ar'

  function toggle() {
    const next = isAr ? 'en' : 'ar'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  /* ── Compact pill for MobileHeader ─────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <button
        onClick={toggle}
        aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
        className="
          relative flex items-center
          h-8 rounded-full
          border border-white/[0.12]
          bg-white/[0.04]
          hover:bg-white/[0.08]
          hover:border-white/[0.2]
          active:scale-95
          transition-all duration-150
          overflow-hidden
          px-0.5
          gap-0
        "
      >
        {/* sliding active indicator */}
        <span
          className={`
            absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full
            bg-cyan-400/20 border border-cyan-400/30
            transition-all duration-200
            ${isAr ? 'left-0.5' : 'right-0.5'}
          `}
        />
        <span className={`
          relative z-10 px-2.5 text-[11px] font-bold tracking-wide
          transition-colors duration-200
          ${isAr ? 'text-cyan-400' : 'text-gray-500'}
        `}>
          ع
        </span>
        <span className={`
          relative z-10 px-2.5 text-[11px] font-bold tracking-wide
          transition-colors duration-200
          ${!isAr ? 'text-cyan-400' : 'text-gray-500'}
        `}>
          EN
        </span>
      </button>
    )
  }

  /* ── Full pill for Sidebar ──────────────────────────────────────────────── */
  return (
    <button
      onClick={toggle}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      className="
        relative flex items-center w-full
        h-9 rounded-xl
        border border-white/[0.08]
        bg-white/[0.03]
        hover:bg-white/[0.06]
        hover:border-white/[0.14]
        active:scale-[0.98]
        transition-all duration-200
        overflow-hidden
        px-0.5
      "
    >
      {/* sliding active pill */}
      <span
        className={`
          absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-lg
          bg-cyan-400/15 border border-cyan-400/25
          transition-all duration-200 ease-out
          ${isAr ? 'left-0.5' : 'right-0.5'}
        `}
      />
      {/* Arabic option */}
      <span className={`
        relative z-10 flex-1 text-center text-xs font-semibold
        transition-colors duration-200
        ${isAr ? 'text-cyan-400' : 'text-gray-600'}
      `}>
        العربية
      </span>
      {/* English option */}
      <span className={`
        relative z-10 flex-1 text-center text-xs font-semibold
        transition-colors duration-200
        ${!isAr ? 'text-cyan-400' : 'text-gray-600'}
      `}>
        English
      </span>
    </button>
  )
}
