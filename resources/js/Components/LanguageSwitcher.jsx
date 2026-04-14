import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

/**
 * Botão que alterna entre os dois idiomas suportados (pt ↔ en).
 * Persiste a escolha em localStorage via i18next-browser-languagedetector.
 *
 * Uso: posicionar em qualquer header/topbar. Sem props.
 */
const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language || 'pt'

  const toggle = () => {
    const next = current.startsWith('pt') ? 'en' : 'pt'
    i18n.changeLanguage(next)
  }

  const label = current.startsWith('pt') ? 'PT' : 'EN'

  return (
    <button
      type="button"
      onClick={toggle}
      title={t('nav.language')}
      aria-label={t('nav.language')}
      className={
        'inline-flex items-center gap-1 px-2 h-8 rounded-md border border-border bg-card text-foreground text-xs font-medium hover:bg-accent transition-colors ' +
        className
      }
    >
      <Languages size={14} />
      {label}
    </button>
  )
}

export default LanguageSwitcher
