import { useTranslation } from 'react-i18next'
import { router, usePage } from '@inertiajs/react'

/**
 * Botão que alterna entre os dois idiomas suportados (pt ↔ en).
 *
 * Bandeira inline em SVG simplificada (sem detalhes — só os blocos
 * de cor essenciais), pra ter render consistente em qualquer sistema
 * independente do suporte a emoji.
 */
// Bandeiras flat inline SVG — copiadas do projeto site-serde pra manter
// consistência visual entre os dois produtos.
// `preserveAspectRatio="none"` força as duas bandeiras a ocuparem
// exatamente o mesmo retângulo `w-6 h-4` (24×16) — sem isso a US
// ficaria achatada (ratio 2:1) e a BR quase quadrada (~1.4:1).
const BrFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 42"
    preserveAspectRatio="none"
    aria-hidden="true"
    className="w-6 h-4 rounded-sm shadow-sm shrink-0"
  >
    <rect width="60" height="42" fill="#009c3b" />
    <polygon points="30,4 56,21 30,38 4,21" fill="#ffdf00" />
    <circle cx="30" cy="21" r="9" fill="#002776" />
  </svg>
)

const UsFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 30"
    preserveAspectRatio="none"
    aria-hidden="true"
    className="w-6 h-4 rounded-sm shadow-sm shrink-0"
  >
    <clipPath id="lang-switcher-us">
      <rect width="60" height="30" />
    </clipPath>
    <g clipPath="url(#lang-switcher-us)">
      <rect width="60" height="30" fill="#B22234" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} y={i * 4.6 + 2.3} width="60" height="2.3" fill="#fff" />
      ))}
      <rect width="24" height="16" fill="#3C3B6E" />
    </g>
  </svg>
)

const LANG_META = {
  pt: { Flag: BrFlag, code: 'PT', label: 'Português' },
  en: { Flag: UsFlag, code: 'EN', label: 'English' },
}

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation()
  const { auth } = usePage().props
  const current = (i18n.resolvedLanguage || i18n.language || 'pt').startsWith(
    'pt',
  )
    ? 'pt'
    : 'en'
  const meta = LANG_META[current]
  const next = current === 'pt' ? 'en' : 'pt'
  const nextMeta = LANG_META[next]
  const Flag = meta.Flag

  const toggle = () => {
    i18n.changeLanguage(next)
    // Persistir no backend pra emails respeitarem o idioma escolhido.
    // Fire-and-forget: sem loading state, sem toast, sem preservação de
    // scroll — só manda e segue a vida.
    if (auth?.user?.id) {
      router.patch(
        route('profile.locale'),
        { locale: next },
        { preserveScroll: true, preserveState: true, only: [] },
      )
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={`${t('nav.language')}: ${meta.label} → ${nextMeta.label}`}
      aria-label={t('nav.language')}
      className={
        'inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-md text-foreground text-xs font-medium hover:bg-accent transition-colors ' +
        className
      }
    >
      <Flag />
      <span>{meta.code}</span>
    </button>
  )
}

export default LanguageSwitcher
