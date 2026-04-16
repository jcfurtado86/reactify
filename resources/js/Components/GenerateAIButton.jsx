import { useEffect, useRef, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Sparkles, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import ButtonWithTooltip from './ButtonWithTooltip'
import { ShineBorder } from '@/components/magicui/shine-border'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Botão flutuante de "Gerar com IA" presente em cada componente de
 * artefato (Personas, Goals, Stories, etc).
 *
 * Além de disparar a geração local (onClick), agora também serve como
 * indicador GLOBAL de gerações em andamento:
 *   - Lê pending_generations da shared prop do Inertia
 *   - Mostra badge com contador se houver gerações ativas
 *   - Click no badge abre um painel com a lista detalhada
 *     (cronômetro mm:ss, projeto, tipo)
 *   - Faz polling de 10s na shared prop enquanto count > 0
 *
 * Click no botão principal continua disparando a geração local
 * (comportamento original).
 */

const FALLBACK_TYPE_LABELS = {
  personas: 'Personas',
  goals: 'Goals',
  journeys: 'Jornadas',
  stories: 'Estórias',
  epic_stories: 'Estórias Épicas',
  business_rules: 'Regras de Negócio',
  usage_scenarios: 'Cenários de Uso',
  system_interfaces: 'Interfaces de Sistema',
  overall_model: 'Overall Model',
  product_canvas: 'Product Canvas',
}

// Mapeamento de slug de tipo → slot do PermissionEnum que controla
// a criação desse artefato. Usado pra gated do botão "Gerar com IA".
const TYPE_PERMISSION = {
  personas: 'persona.manage',
  goals: 'goal.manage',
  journeys: 'journey.manage',
  product_canvas: 'productCanvas.manage',
  stories: 'userStory.manage',
  epic_stories: 'userStory.manage',
  business_rules: 'businessRule.manage',
  usage_scenarios: 'usageScenario.manage',
  overall_model: 'overallModel.manage',
  system_interfaces: 'interface.manage',
  storyboards: 'storyboard.manage',
}

const formatElapsed = (seconds) => {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const ss = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${mm}:${ss}`
}

const PendingRow = ({ job, t }) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const startedAt = new Date(job.created_at).getTime()
    const tick = () => setElapsed(Math.max(0, (Date.now() - startedAt) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [job.created_at])

  const label = t(
    `generation_status.types.${job.type}`,
    FALLBACK_TYPE_LABELS[job.type] || job.type,
  )

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-b-0">
      <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0 leading-tight">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {label}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {formatElapsed(elapsed)}
          </span>
        </div>
        {job.project && (
          <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
            {job.project.emoji ? `${job.project.emoji} ` : ''}
            {job.project.title}
          </div>
        )}
      </div>
    </div>
  )
}

const GenerateAIButton = ({
  isGenerating = false,
  onClick,
  tooltip,
  className = '',
  /**
   * Slug do tipo de artefato deste botão (ex: 'personas', 'goals').
   * Usado pra detectar se já existe uma geração em curso DESSE tipo
   * específico, dando feedback visual (borda verde) e bloqueando
   * cliques duplicados.
   */
  type = null,
}) => {
  const { t } = useTranslation()
  const pageProps = usePage().props
  const allJobs = Array.isArray(pageProps?.pending_generations)
    ? pageProps.pending_generations
    : []
  const pending = allJobs.filter((j) => j.status === 'queued' || j.status === 'running')

  // Papel do usuário no projeto não tem permissão de manage neste artefato?
  // Esconde o botão inteiro. Backend também bloqueia (layered defense).
  const permissionSlot = type ? TYPE_PERMISSION[type] : null
  const userPerms = pageProps?.auth?.permissions
  const hasPermission = permissionSlot
    ? Array.isArray(userPerms) && userPerms.includes(permissionSlot)
    : true
  if (!hasPermission) {
    return null
  }
  const failedJobs = allJobs.filter((j) => j.status === 'failed')
  const [panelOpen, setPanelOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const containerRef = useRef(null)

  // Toast único por job falho — persistido em localStorage pra sobreviver
  // a reloads de página. Cada id de job só notifica uma vez.
  const SEEN_KEY = 'reactify.seenFailedGenerationIds'
  const readSeen = () => {
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
  }
  const writeSeen = (set) => {
    try {
      // Cap em 200 ids pra não crescer infinito.
      const arr = Array.from(set).slice(-200)
      localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
    } catch {}
  }

  useEffect(() => {
    const seen = readSeen()
    let changed = false
    failedJobs.forEach((job) => {
      if (seen.has(job.id)) return
      seen.add(job.id)
      changed = true
      const label = t(
        `generation_status.types.${job.type}`,
        FALLBACK_TYPE_LABELS[job.type] || job.type,
      )
      toast.error(
        t('generation_status.failed_toast', {
          defaultValue: 'Falha ao gerar {{label}}. Tente novamente.',
          label,
        }),
        {
          description: job.error ? String(job.error).slice(0, 200) : undefined,
          duration: 5000,
        },
      )
    })
    if (changed) writeSeen(seen)
  }, [failedJobs.map((j) => j.id).join(','), t])

  // Está rodando uma geração desse mesmo tipo? Bloqueia re-trigger e
  // dá feedback visual.
  const isThisTypeRunning = type
    ? pending.some((j) => j.type === type)
    : false
  const buttonDisabled = isGenerating || isThisTypeRunning

  const handleClick = (e) => {
    if (buttonDisabled) {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      return
    }
    // Em vez de gerar direto, pedir confirmação. Evita disparos
    // acidentais que custam tokens / tempo de processamento.
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    onClick?.()
  }

  // Polling: enquanto houver jobs, recarrega a shared prop a cada 10s.
  useEffect(() => {
    if (pending.length === 0) {
      // Se a lista esvaziou e o painel estava aberto, fecha sozinho.
      if (panelOpen) setPanelOpen(false)
      return
    }
    const interval = setInterval(() => {
      router.reload({ only: ['pending_generations'] })
    }, 10000)
    return () => clearInterval(interval)
  }, [pending.length, panelOpen])

  // Fecha painel ao clicar fora.
  useEffect(() => {
    if (!panelOpen) return
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [panelOpen])

  const togglePanel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setPanelOpen((v) => !v)
  }

  return (
    <div ref={containerRef} className="fixed z-20 bottom-16 right-2">
      {panelOpen && pending.length > 0 && (
        <div className="absolute bottom-full right-0 mb-3 w-80 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              {t('generation_status.title', 'Gerando com IA')}
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
              aria-label={t('common.close', 'Fechar')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-4 py-2">
            {pending.map((job) => (
              <PendingRow key={job.id} job={job} t={t} />
            ))}
          </div>
          <p className="px-4 py-2 m-0 border-t border-border text-[11px] leading-snug text-muted-foreground">
            {t(
              'generation_status.hint',
              'Você pode navegar livremente. Os artefatos aparecem sozinhos quando ficarem prontos.',
            )}
          </p>
        </div>
      )}

      <div
        className={`relative w-20 flex items-center justify-center rounded-full shadow-md transition-colors ${className} ${
          buttonDisabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-card text-foreground hover:bg-accent'
        }`}
      >
        <ButtonWithTooltip
          onClick={handleClick}
          disabled={buttonDisabled}
          variant="hollow"
          className="flex flex-1 items-center justify-center py-2"
          tooltipContent={
            isThisTypeRunning
              ? t(
                  'generation_status.already_running',
                  'Já está gerando esse artefato. Aguarde terminar.',
                )
              : tooltip?.description || null
          }
          side="left"
        >
          {isGenerating || isThisTypeRunning ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <Sparkles size={18} className="mr-2" />
          )}
          <span>AI</span>
        </ButtonWithTooltip>

        <ShineBorder
          borderWidth={isThisTypeRunning ? 3 : 2}
          shineColor={
            isThisTypeRunning
              ? ['oklch(0.7227 0.192 149.58)', 'oklch(0.8 0.18 149)']
              : [
                  'oklch(0.5497 0.2143 285.2157)',
                  'oklch(0.6861 0.2061 14.9941)',
                ]
          }
        />

        {pending.length > 0 && (
          <button
            type="button"
            onClick={togglePanel}
            title={t('generation_status.fab_title', 'Gerações de IA em curso')}
            className="absolute -top-2 -right-2 z-10 flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold border-2 border-card shadow hover:bg-amber-600 transition-colors"
          >
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            {pending.length}
          </button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ai.confirm.title', 'Gerar com IA?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'ai.confirm.description',
                'A geração leva alguns minutos e consome recursos. Você pode acompanhar o progresso no botão flutuante.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancelar')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {t('ai.confirm.action', 'Gerar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default GenerateAIButton
