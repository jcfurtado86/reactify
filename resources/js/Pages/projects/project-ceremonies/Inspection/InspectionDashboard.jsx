import { router } from '@inertiajs/react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '@/Context/PermissionContext'
import { inspectionStatus, cn } from '@/lib/utils'
import StatusBadge from '@/Components/StatusBadge'

const INVEST_KEYS = ['independent', 'negotiable', 'valuable', 'estimable', 'small', 'testable']
const INVEST_LABELS = { independent: 'I', negotiable: 'N', valuable: 'V', estimable: 'E', small: 'S', testable: 'T' }

const InvestCell = ({ value, onClick, canManage }) => {
  const bg = value === 'yes'
    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
    : value === 'no'
      ? 'bg-red-500/20 text-red-700 dark:text-red-400'
      : 'bg-muted text-muted-foreground'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canManage}
      className={`size-8 rounded text-xs font-bold flex items-center justify-center transition-colors ${bg} ${canManage ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
    >
      {value === 'yes' ? '✓' : value === 'no' ? '✗' : '—'}
    </button>
  )
}

const InspectionDashboard = ({ project, setProject }) => {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canManage = can('inspectionCards.manage')
  const [filter, setFilter] = useState('all')

  const snapshotRef = useRef({})
  const currentStoriesRef = useRef(project.stories || [])

  useEffect(() => {
    currentStoriesRef.current = project.stories || []
  }, [project.stories])

  useEffect(() => {
    const initial = {}
    ;(project.stories || []).forEach((s) => {
      initial[s.id] = inspectionStatus(s)
    })
    snapshotRef.current = initial

    return () => {
      if (!canManage) return
      const current = currentStoriesRef.current
      const criteria = ['independent', 'negotiable', 'valuable', 'estimable', 'small', 'testable']

      current.forEach((story) => {
        const oldStatus = snapshotRef.current[story.id]
        const newStatus = inspectionStatus(story)
        if (newStatus === 'rejected' && oldStatus !== 'rejected') {
          const ic = story.invest_card || {}
          const failed = criteria.filter((c) => ic[c] === 'no')
          if (failed.length > 0) {
            axios.post(route('story.notify-invest', story.id), { failed_criteria: failed }).catch(() => {})
          }
        }
      })
    }
  }, [])

  const stories = useMemo(() =>
    (project.stories || [])
      .filter((s) => !s.epic_id)
      .sort((a, b) => a.id - b.id),
    [project.stories])

  const activeStories = stories.filter((s) => s.status !== 'done')
  const doneStories = stories.filter((s) => s.status === 'done')

  const filtered = (filter === 'done' ? doneStories : activeStories).filter((s) => {
    if (filter === 'all') return true
    if (filter === 'done') return true
    const status = inspectionStatus(s)
    if (filter === 'validated') return status === 'validated'
    if (filter === 'rejected') return status === 'rejected'
    if (filter === 'pending') return status === 'pending' || status === null
    return true
  })

  const counts = {
    all: activeStories.length,
    validated: activeStories.filter((s) => inspectionStatus(s) === 'validated').length,
    rejected: activeStories.filter((s) => inspectionStatus(s) === 'rejected').length,
    pending: activeStories.filter((s) => {
      const st = inspectionStatus(s)
      return st === 'pending' || st === null
    }).length,
    done: doneStories.length,
  }

  const toggleInvest = (storyId, field) => {
    const story = project.stories.find((s) => s.id === storyId)
    if (!story) return
    const ic = story.invest_card || {}
    const current = ic[field] || 'na'
    const next = current === 'yes' ? 'no' : current === 'no' ? 'na' : 'yes'
    const updatedCard = { ...ic, [field]: next }

    setProject((prev) => ({
      ...prev,
      stories: prev.stories.map((s) =>
        s.id === storyId ? { ...s, invest_card: updatedCard } : s,
      ),
    }))

    router.patch(
      route('story.update', storyId),
      { invest_card: updatedCard },
      { preserveState: true, preserveScroll: true },
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        {['all', 'rejected', 'pending', 'validated', 'done'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {t(`inspection_dashboard.filter_${f}`, f)} ({counts[f]})
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-foreground">{t('inspection_dashboard.story', 'Story')}</th>
              {INVEST_KEYS.map((k) => (
                <th key={k} className="p-3 font-medium text-foreground text-center w-12">
                  {INVEST_LABELS[k]}
                </th>
              ))}
              <th className="p-3 font-medium text-foreground text-center">{t('inspection_dashboard.status', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((story) => {
              const ic = story.invest_card || {}
              const isDone = story.status === 'done'
              return (
                <tr key={story.id} className={cn('border-t border-border hover:bg-muted/30', isDone && 'opacity-40')}>
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                        {story.type === 'system' ? 'SS' : 'US'}{story.id}
                      </Badge>
                      <span className="text-foreground text-sm">{story.title}</span>
                    </div>
                  </td>
                  {INVEST_KEYS.map((k) => (
                    <td key={k} className="p-3 text-center">
                      <InvestCell
                        value={ic[k] || 'na'}
                        canManage={canManage && !isDone}
                        onClick={() => toggleInvest(story.id, k)}
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <StatusBadge status={inspectionStatus(story)} />
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  {t('inspection_dashboard.empty', 'Nenhuma story neste filtro.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InspectionDashboard
