import { useTranslation } from 'react-i18next'

// Metadata (links, classNames) que não precisa ser traduzida.
// Os textos (title/description) vêm do i18n (seção "tooltips.*").
const tooltipMeta = {
  // tooltips do navMenu (cerimônias/ferramentas)
  inception: { link: 'inception' },
  storyDiscovery: { link: 'storyDiscovery' },
  refining: { link: 'refining' },
  modeling: { link: 'modeling' },
  inspection: { link: 'inspection', classNames: { badge: 'bg-purple-600 ' } },
  productBacklog: { link: 'productBacklog' },
  sprint: { link: 'sprint' },

  // inception
  productCanvas: { link: 'productCanvas' },
  goals: { link: 'goals' },
  personas: { link: 'personas' },
  journeys: { link: 'journeys' },

  // story discovery
  stories: { link: 'stories' },
  prioritizationMatrix: { link: 'prioritizationMatrix' },
  changeLog: { link: 'changeLog' },

  // refining
  epicStories: { link: 'epicStories' },
  businessRules: { link: 'businessRules' },
  usageScenarios: {
    link: 'usageScenarios',
    classNames: { badge: 'bg-purple-600 ' },
  },

  // modeling
  overallModel: {
    link: 'overallModel',
    classNames: { badge: 'bg-purple-600 ' },
  },
  interfaces: {
    link: 'interfaces',
    classNames: { badge: 'bg-purple-600 ' },
  },
  storyboards: {
    link: 'storyboards',
    classNames: { badge: 'bg-purple-600 ' },
  },

  // tooltips internos
  userStory: { classNames: { badge: 'bg-purple-600 ' } },
  systemStory: { classNames: { badge: 'bg-orange-600 ' } },
  epicStory: { classNames: { badge: 'bg-orange-600 ' } },
  businessRule: { classNames: { button: 'max-w-md md:max-w-2xl' } },
  businessGoal: { classNames: { badge: 'bg-orange-600 ' } },
  constraintGoal: { classNames: { badge: 'bg-purple-600 ' } },

  // botões IA
  aiGeneratedGoals: {},
  aiGeneratedPersonas: {},
  aiGeneratedJourney: {},
  aiGeneratedProductCanvas: {},
  aiGeneratedStory: {},
  aiGeneratedEpic: {},
  aiGeneratedBusinessRule: {},
  aiGeneratedUsageScenario: {},
  aiGeneratedOverallModel: {},
  aiGeneratedInterface: {},
  aiGeneratedStoryboard: {},
}

// camelCase -> snake_case para bater com as chaves do i18n.
const toSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

export const useTooltipInfo = () => {
  const { t } = useTranslation()
  const out = {}
  for (const [key, meta] of Object.entries(tooltipMeta)) {
    const i18nKey = `tooltips.${toSnake(key)}`
    out[key] = {
      ...meta,
      title: t(`${i18nKey}.title`),
      description: t(`${i18nKey}.description`),
    }
  }
  return out
}
