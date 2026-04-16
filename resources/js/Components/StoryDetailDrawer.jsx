import { useTranslation } from 'react-i18next'
import { inspectionStatus } from '@/lib/utils'
import StatusBadge from '@/Components/StatusBadge'

const INVEST_KEYS = ['independent', 'negotiable', 'valuable', 'estimable', 'small', 'testable']
const INVEST_SHORT = { independent: 'I', negotiable: 'N', valuable: 'V', estimable: 'E', small: 'S', testable: 'T' }

const Section = ({ title, icon, color, children, empty, count }) => {
  if (!children && !empty) return null
  return (
    <div className={`rounded-lg border-l-4 bg-card border border-border overflow-hidden`} style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${color}10` }}>
        <span style={{ color }}>{icon}</span>
        <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{title}</h4>
        {count !== undefined && (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">{count}</Badge>
        )}
      </div>
      <div className="px-3 py-2">
        {children || <p className="text-xs text-muted-foreground italic">{empty}</p>}
      </div>
    </div>
  )
}

const StoryDetailDrawer = ({ story, project, open, onClose }) => {
  const { t } = useTranslation()
  if (!story) return null

  const personas = story.personas || []
  const ic = story.invest_card || {}
  const rules = (project?.business_rules || []).filter((r) => r.story_id === story.id)
  const scenarios = (project?.usage_scenarios || []).filter((s) => s.story_id === story.id)
  const storyboards = (project?.storyboards || []).filter((sb) => sb.story_id === story.id)
  const crcCards = (project?.crc_cards || [])
  const interfaces = (project?.system_interfaces || [])
  const storyVariants = project?.system_colors?.stories || {}
  const color = storyVariants[story.type] || '#f97316'
  const label = `${story.type === 'system' ? 'SS' : 'US'}${story.id}`

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="max-w-[420px] sm:max-w-[500px] overflow-y-auto p-0">
        {/* Header com cor da story */}
        <div className="p-4 border-b border-border" style={{ backgroundColor: `${color}15` }}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <Badge style={{ backgroundColor: color }} className="text-black font-bold border-transparent text-sm px-2.5 py-0.5">
                {label}
              </Badge>
              <StatusBadge status={inspectionStatus(story)} />
            </SheetTitle>
            <SheetDescription className="text-foreground text-sm text-left font-medium mt-1">
              {story.title}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-4 space-y-3">
          {/* Persona */}
          {story.type !== 'system' && (
            <Section
              title={t('stories.select_persona', 'Persona')}
              icon="👤"
              color="#22c55e"
              count={personas.length}
              empty={personas.length === 0 ? t('story_detail.no_persona', 'Nenhuma persona vinculada') : null}
            >
              {personas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {personas.map((p) => (
                    <Badge key={p.id} className="text-xs bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">{p.name}</Badge>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* INVEST */}
          <Section title="INVEST" icon="🛡" color="#6366f1" count={Object.values(ic).filter((v) => v === 'yes').length + '/' + INVEST_KEYS.length}>
            <div className="flex gap-2 justify-around">
              {INVEST_KEYS.map((k) => {
                const v = ic[k] || 'na'
                const bg = v === 'yes'
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                  : v === 'no'
                    ? 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                return (
                  <div key={k} className="flex flex-col items-center gap-1">
                    <span className={`size-8 rounded-lg text-xs font-bold flex items-center justify-center border ${bg}`}>
                      {v === 'yes' ? '✓' : v === 'no' ? '✗' : '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">{INVEST_SHORT[k]}</span>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* Regras de Negocio */}
          <Section
            title={t('stories.rules_label', 'Regras de Negocio')}
            icon="📋"
            color="#f97316"
            count={rules.length}
            empty={rules.length === 0 ? t('story_detail.no_rules', 'Nenhuma regra cadastrada') : null}
          >
            {rules.length > 0 && (
              <ul className="space-y-1.5">
                {rules.map((r) => (
                  <li key={r.id} className="flex items-start gap-2 text-sm">
                    <Badge style={{ backgroundColor: '#f97316' }} className="text-[10px] shrink-0 text-black font-bold border-transparent mt-0.5">BR{r.id}</Badge>
                    <span className="text-foreground">{r.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Cenarios de Uso */}
          <Section
            title={t('stories.scenarios_label', 'Cenarios de Uso')}
            icon="🎭"
            color="#14b8a6"
            count={scenarios.length}
            empty={scenarios.length === 0 ? t('story_detail.no_scenarios', 'Nenhum cenario cadastrado') : null}
          >
            {scenarios.length > 0 && (
              <div className="space-y-2">
                {scenarios.map((s) => {
                  const d = s.description || {}
                  return (
                    <div key={s.id} className="rounded-md border border-teal-500/20 bg-teal-500/5 p-2 text-sm">
                      <Badge className="text-[10px] mb-1.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-500/30">UC{s.id}</Badge>
                      <p><span className="font-semibold text-teal-600 dark:text-teal-400">As</span> {d.as}</p>
                      <p><span className="font-semibold text-teal-600 dark:text-teal-400">Given</span> {d.given}</p>
                      <p><span className="font-semibold text-teal-600 dark:text-teal-400">When</span> {d.when}</p>
                      <p><span className="font-semibold text-teal-600 dark:text-teal-400">Then</span> {d.then_1}</p>
                      {d.and && <p><span className="font-semibold text-teal-600 dark:text-teal-400">And</span> {d.and}</p>}
                      {d.then_2 && <p><span className="font-semibold text-teal-600 dark:text-teal-400">Then</span> {d.then_2}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Overall Model (CRC Cards) */}
          <Section
            title={t('story_detail.overall_model', 'Overall Model (CRC)')}
            icon="🏗"
            color="#8b5cf6"
            count={crcCards.length}
            empty={crcCards.length === 0 ? t('story_detail.no_crc', 'Nenhum CRC cadastrado') : null}
          >
            {crcCards.length > 0 && (
              <div className="space-y-2">
                {crcCards.map((c) => (
                  <div key={c.id} className="rounded-md border border-violet-500/20 bg-violet-500/5 p-2">
                    <p className="font-bold text-sm text-violet-700 dark:text-violet-400">{c.class}</p>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div>
                        <p className="text-[10px] text-violet-600/70 dark:text-violet-400/70 uppercase font-semibold mb-0.5">Responsabilidades</p>
                        <ul className="text-xs text-foreground space-y-0.5">
                          {(c.responsabilities || []).map((r, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-violet-500 mt-0.5">-</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] text-violet-600/70 dark:text-violet-400/70 uppercase font-semibold mb-0.5">Colaboradores</p>
                        <ul className="text-xs text-foreground space-y-0.5">
                          {(c.collaborators || []).map((co, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-violet-500 mt-0.5">-</span> {co}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Interfaces de Sistema */}
          <Section
            title={t('story_detail.interfaces', 'Interfaces de Sistema')}
            icon="🔌"
            color="#06b6d4"
            count={interfaces.length}
            empty={interfaces.length === 0 ? t('story_detail.no_interfaces', 'Nenhuma interface cadastrada') : null}
          >
            {interfaces.length > 0 && (
              <div className="space-y-2">
                {interfaces.map((si) => (
                  <div key={si.id} className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-cyan-700 dark:text-cyan-400">{si.title}</p>
                      <Badge className="text-[9px] bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30">{si.type}</Badge>
                    </div>
                    <div className="mt-1.5 space-y-0.5 text-xs">
                      <p><span className="text-cyan-600/70 dark:text-cyan-400/70 font-semibold">Input:</span> <span className="text-foreground">{si.input}</span></p>
                      <p><span className="text-cyan-600/70 dark:text-cyan-400/70 font-semibold">Output:</span> <span className="text-foreground">{si.output}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Storyboards */}
          <Section
            title="Storyboards"
            icon="🎨"
            color="#ec4899"
            count={storyboards.length}
            empty={storyboards.length === 0 ? t('story_detail.no_storyboards', 'Nenhum storyboard cadastrado') : null}
          >
            {storyboards.length > 0 && (
              <div className="space-y-2">
                {storyboards.map((sb) => (
                  <div key={sb.id} className="rounded-md border border-pink-500/20 overflow-hidden">
                    {sb.image_url && (
                      <img src={sb.image_url} alt={`Storyboard ${sb.id}`} className="w-full max-h-48 object-contain bg-pink-500/5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default StoryDetailDrawer
