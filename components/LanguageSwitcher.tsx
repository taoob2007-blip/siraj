'use client'

import { useLocale } from 'next-intl'

export function LanguageSwitcher({ collapsed }: { collapsed?: boolean }) {
  const locale = useLocale()

  function toggle() {
    const next = locale === 'ar' ? 'en' : 'ar'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      title={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className="
        flex items-center justify-center gap-1.5
        px-2 py-1.5 rounded-lg
        border border-white/10
        text-gray-400 hover:text-white hover:border-white/20
        bg-white/[0.03] hover:bg-white/[0.06]
        transition-all duration-200
        text-xs font-medium
        min-h-[36px] w-full
      "
    >
      <span className="text-sm leading-none">{locale === 'ar' ? '🌐' : '🌐'}</span>
      {!collapsed && (
        <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
      )}
    </button>
  )
}
