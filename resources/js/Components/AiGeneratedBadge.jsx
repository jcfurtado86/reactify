import { Sparkles, Check, X } from 'lucide-react'
import { route } from 'ziggy-js'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'

/**
 * Badge visual + ações pra um item gerado por IA pendente de revisão.
 *
 * Props:
 * - item: objeto do artefato (precisa ter id e is_ai_generated)
 * - type: slug do artefato (personas, goals, journeys, stories, etc)
 * - onDiscard: callback opcional pra descartar (delete). Se omitido,
 *              o botão de descarte não aparece — o user pode usar o
 *              delete normal do componente.
 * - compact: bool, se true mostra só ícones sem texto
 */
const AiGeneratedBadge = ({ item, type, onDiscard, compact = false }) => {
  const { t } = useTranslation()

  if (!item?.is_ai_generated) {
    return null
  }

  const handleApprove = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    try {
      await axios.patch(route('ai-generated.approve', { type, id: item.id }))
      toast.success(t('ai_review.approved', 'Aprovado'))
      // O controller dispara ProjectUpdated; o useEcho do Project re-fetcha
      // automaticamente. Não precisa reload manual aqui.
    } catch (err) {
      console.error('Erro ao aprovar:', err)
      toast.error(t('ai_review.error', 'Erro ao aprovar'))
    }
  }

  const handleDiscard = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (onDiscard) onDiscard(item)
  }

  return (
    <span className="inline-flex items-center gap-0.5 align-middle whitespace-nowrap border border-dashed border-muted-foreground/25 rounded-full px-0.5 py-px">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-muted/40 px-1.5 py-px text-[10px] leading-tight font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 shrink-0" />
            {!compact && (t('ai_review.badge_label', 'IA'))}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {t('ai_review.badge_tooltip', 'Gerado por IA, revise antes de aprovar')}
        </TooltipContent>
      </Tooltip>
      <ButtonWithTooltip
        type="button"
        onClick={handleApprove}
        variant="ghost"
        size="icon"
        className="inline-flex items-center justify-center rounded-md p-0.5 text-emerald-600 hover:bg-emerald-500/10 transition-colors size-6"
        tooltipContent={t('ai_review.approve', 'Aprovar')}
      >
        <Check className="h-3.5 w-3.5" />
      </ButtonWithTooltip>
      {onDiscard && (
        <ButtonWithTooltip
          type="button"
          onClick={handleDiscard}
          variant="ghost"
          size="icon"
          className="inline-flex items-center justify-center rounded-md p-0.5 text-destructive hover:bg-destructive/10 transition-colors size-6"
          tooltipContent={t('ai_review.discard', 'Descartar')}
        >
          <X className="h-3.5 w-3.5" />
        </ButtonWithTooltip>
      )}
    </span>
  )
}

export default AiGeneratedBadge
