import { useEcho } from '@laravel/echo-react'
import { Head, router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NavMenu from '@/Components/NavMenu'
import { ProjectPermissions } from '@/Components/ProjectPermissions'
// inception
import MainView from './project-ceremonies/Inception/ProductCanvas.jsx'
import Personas from './project-ceremonies/Inception/Personas'
import Journeys from './project-ceremonies/Inception/Journeys'
import Goals from './project-ceremonies/Inception/Goals'
// story discovery
import Stories from './project-ceremonies/StoryDiscovery/Stories'
import PrioritizationMatrix from './project-ceremonies/StoryDiscovery/PrioritizationMatrix.jsx'
import ChangeLog from './project-ceremonies/StoryDiscovery/ChangeLog.jsx'
// refining
import EpicStories from './project-ceremonies/Refining/EpicStories.jsx'
import BusinessRules from './project-ceremonies/Refining/BusinessRules.jsx'
import UsageScenarios from './project-ceremonies/Refining/UsageScenarios.jsx'
//modeling
import OverallModel from './project-ceremonies/Modeling/OverallModel'
import Interfaces from './project-ceremonies/Modeling/Interfaces.jsx'
import Storyboards from './project-ceremonies/Modeling/Storyboards/Storyboards.jsx'
//
import ProductBacklog from './project-ceremonies/ProductBacklog/ProductBacklog.jsx'
//components
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import MainLayout from '@/Layouts/MainLayout'
import {
  PermissionProvider,
  usePermissions,
} from '@/Context/PermissionContext.jsx'
import Sprint from './project-ceremonies/Sprint/Sprint'
import { useTooltipInfo } from '@/lib/projectData.js'
//chatbot
import ChatBot from './ChatBot.jsx'
import { ProjectSettings } from '@/Components/ProjectSettings.jsx'

const ProjectView = ({ projectDB = [], page = 'inception', artifact }) => {
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  const [project, setProject] = useState({ ...projectDB })
  const { can } = usePermissions()

  // Sincroniza o state local com o prop do Inertia. Sem isso, o
  // useState fica congelado no valor inicial e qualquer refresh de
  // página (ex: back() depois de um POST de criar/editar artefato) não
  // chega no state — usuário vê o card temporário pendurado pra sempre.
  useEffect(() => {
    if (projectDB && projectDB.id) {
      setProject(projectDB)
    }
  }, [projectDB])
  // Inception States

  // Menu items têm labelKey (i18n key) em vez de label estática. A
  // string exibida é resolvida via t() no momento de passar para o
  // NavMenu, lá embaixo, para responder a mudanças de idioma.
  const [menuItems, setMenuItems] = useState([
    ...(can('productCanvas.view')
      ? [
          {
            labelKey: 'project.artifacts.product_canvas',
            link: 'productCanvas',
            value: true,
            tooltip: tooltipInfo.productCanvas,
          },
        ]
      : []),
    ...(can('persona.view')
      ? [
          {
            labelKey: 'project.artifacts.personas',
            link: 'personas',
            value: false,
            tooltip: tooltipInfo.personas,
          },
        ]
      : []),
    ...(can('goal.view')
      ? [
          {
            labelKey: 'project.artifacts.goals',
            link: 'goals',
            value: false,
            tooltip: tooltipInfo.goals,
          },
        ]
      : []),
    ...(can('journey.view')
      ? [
          {
            labelKey: 'project.artifacts.journeys',
            link: 'journeys',
            value: false,
            tooltip: tooltipInfo.journeys,
          },
        ]
      : []),
  ])

  const [storyDiscoveryMenuItems, setStoryDiscoveryMenuItems] = useState([
    ...(can('userStory.view')
      ? [
          {
            labelKey: 'project.artifacts.stories',
            link: 'stories',
            value: true,
            tooltip: tooltipInfo.stories,
          },
        ]
      : []),
    ...(can('overallModel.view')
      ? [
          {
            labelKey: 'project.artifacts.overall_model',
            link: 'overallModel',
            value: false,
            tooltip: tooltipInfo.overallModel,
          },
        ]
      : []),
    ...(can('prioritizationMatrix.view')
      ? [
          {
            labelKey: 'project.artifacts.prioritization_matrix',
            link: 'prioritizationMatrix',
            value: false,
            tooltip: tooltipInfo.prioritizationMatrix,
          },
        ]
      : []),
    ...(can('changeLog.view')
      ? [
          {
            labelKey: 'project.artifacts.change_log',
            link: 'changeLog',
            value: false,
            tooltip: tooltipInfo.changeLog,
          },
        ]
      : []),
  ])

  const [refiningMenuItems, setRefiningMenuItems] = useState([
    ...(can('userStory.view')
      ? [
          {
            labelKey: 'project.artifacts.epic_stories',
            link: 'epicStories',
            value: true,
            tooltip: tooltipInfo.epicStories,
          },
        ]
      : []),
    ...(can('businessRule.view')
      ? [
          {
            labelKey: 'project.artifacts.business_rules',
            link: 'businessRules',
            value: false,
            tooltip: tooltipInfo.businessRules,
          },
        ]
      : []),
    ...(can('usageScenario.view')
      ? [
          {
            labelKey: 'project.artifacts.usage_scenarios',
            link: 'usageScenarios',
            value: false,
            tooltip: tooltipInfo.usageScenarios,
          },
        ]
      : []),
  ])

  const [modelingMenuItems, setModelingMenuItems] = useState([
    ...(can('overallModel.view')
      ? [
          {
            labelKey: 'project.artifacts.overall_model',
            link: 'overallModel',
            value: true,
            tooltip: tooltipInfo.overallModel,
          },
        ]
      : []),
    ...(can('interface.view')
      ? [
          {
            labelKey: 'project.artifacts.system_interfaces',
            link: 'interfaces',
            value: false,
            tooltip: tooltipInfo.interfaces,
          },
        ]
      : []),
    ...(can('storyboard.view')
      ? [
          {
            labelKey: 'project.artifacts.storyboards',
            link: 'storyboards',
            value: false,
            tooltip: tooltipInfo.storyboards,
          },
        ]
      : []),
  ])

  // Wrapper para traduzir labels antes de passar para NavMenu.
  // Usa `link` como key estável pra comparação de artefato ativo.
  const localized = (items) =>
    items.map((item) => ({ ...item, label: t(item.labelKey) }))

  const defaultArtifacts = useMemo(
    () => ({
      inception: 'productCanvas',
      storyDiscovery: 'stories',
      refining: 'epicStories',
      modeling: 'overallModel',
    }),
    [],
  )
  const activeArtifact = artifact || defaultArtifacts[page]

  const artifactToDataKeyMap = useMemo(
    () => ({
      'Product Canvas': 'product_canvas',
      Personas: 'personas',
      Goals: 'goal_sketches',
      Journeys: 'journeys',
      Stories: 'stories',
      'Overall Model': 'overall_model_classes',
      'Matriz de Priorização': 'matrix_priorities',
      'Change Log': 'change_requests',
      'Epic Stories': 'epic_stories',
      'Business Rules': 'business_rules',
      'Usage Scenarios': 'usage_scenarios',
      'Interfaces Internas e Externas': 'system_interfaces',
      Storyboards: 'storyboards',
      //'Product Backlog': 'stories',
      Sprint: 'sprints.stories',
    }),
    [],
  )

  // const currentArtifactData = useMemo(() => {
  //   if (!projectDB || !currentArtifact) {
  //     return null
  //   }
  //   const dataKey = artifactToDataKeyMap[currentArtifact]
  //   return dataKey ? projectDB[dataKey] : null
  // }, [projectDB, currentArtifact, artifactToDataKeyMap])

  const getUpdatedProject = async (projectID) => {
    try {
      const response = await fetch(route('project.updated', projectID), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      const data = await response.json()
      if (response.ok) {
        setProject(data.project)
      }
    } catch (error) {
      toast.error(t('project.project_update_error') + ': ' + error.message)
    }
  }

  // Websocket for project updates
  useEcho(`project.${project.id}`, 'ProjectUpdated', (e) => {
    getUpdatedProject(e.project_id)
  })

  // Effect for Inception menu
  useEffect(() => {
    const updatedMenuItems = menuItems.map((item) => ({
      ...item,
      value: item.link === activeArtifact,
    }))
    setMenuItems(updatedMenuItems)
    localStorage.setItem('activeMenu', activeArtifact)
  }, [activeArtifact])

  // Effect for Story Discovery menu
  useEffect(() => {
    const updatedMenuItems = storyDiscoveryMenuItems.map((item) => ({
      ...item,
      value: item.link === activeArtifact,
    }))
    setStoryDiscoveryMenuItems(updatedMenuItems)
    localStorage.setItem('activeStoryDiscoveryMenu', activeArtifact)
  }, [activeArtifact])

  // Effect for Refining menu
  useEffect(() => {
    const updatedMenuItems = refiningMenuItems.map((item) => ({
      ...item,
      value: item.link === activeArtifact,
    }))
    setRefiningMenuItems(updatedMenuItems)
    localStorage.setItem('activeRefiningMenu', activeArtifact)
  }, [activeArtifact])

  // Effect for Modeling menu
  useEffect(() => {
    const updatedMenuItems = modelingMenuItems.map((item) => ({
      ...item,
      value: item.link === activeArtifact,
    }))
    setModelingMenuItems(updatedMenuItems)
    localStorage.setItem('activeModelingMenu', activeArtifact)
  }, [activeArtifact])

  const renderInceptionContent = () => {
    switch (activeArtifact) {
      case 'productCanvas':
        return (
          can('productCanvas.view') && (
            <MainView project={project} setProject={setProject} />
          )
        )
      case 'personas':
        return (
          can('persona.view') && (
            <Personas project={project} setProject={setProject} />
          )
        )
      case 'goals':
        return (
          can('goal.view') && (
            <Goals project={project} setProject={setProject} />
          )
        )
      case 'journeys':
        return (
          can('journey.view') && (
            <Journeys project={project} setProject={setProject} />
          )
        )
      default:
        return null
    }
  }

  const renderStoryDiscoveryContent = () => {
    switch (activeArtifact) {
      case 'stories':
        return (
          can('userStory.view') && (
            <Stories project={project} setProject={setProject} />
          )
        )
      case 'overallModel':
        return (
          can('overallModel.view') && (
            <OverallModel project={project} setProject={setProject} />
          )
        )
      case 'prioritizationMatrix':
        return (
          can('prioritizationMatrix.view') && (
            <PrioritizationMatrix project={project} setProject={setProject} />
          )
        )
      case 'changeLog':
        return (
          can('changeLog.view') && (
            <ChangeLog project={project} setProject={setProject} />
          )
        )
      default:
        return null
    }
  }

  const renderRefiningContent = () => {
    switch (activeArtifact) {
      case 'epicStories':
        return (
          can('userStory.view') && (
            <EpicStories project={project} setProject={setProject} />
          )
        )
      case 'businessRules':
        return (
          can('businessRule.view') && (
            <BusinessRules project={project} setProject={setProject} />
          )
        )
      case 'usageScenarios':
        return (
          can('usageScenario.view') && (
            <UsageScenarios project={project} setProject={setProject} />
          )
        )
      default:
        return null
    }
  }

  const renderModelingContent = () => {
    switch (activeArtifact) {
      case 'overallModel':
        return (
          can('overallModel.view') && (
            <OverallModel project={project} setProject={setProject} />
          )
        )
      case 'interfaces':
        return (
          can('interface.view') && (
            <Interfaces project={project} setProject={setProject} />
          )
        )
      case 'storyboards':
        return (
          can('storyboard.view') && (
            <SidebarProvider className="min-h-[calc(100vh-100px)]">
              <Storyboards project={project} setProject={setProject} />{' '}
            </SidebarProvider>
          )
        )
      default:
        return null
    }
  }

  // NOVO: Função que será chamada pelo NavMenu
  const handleArtifactChange = (newArtifactLabel) => {
    router.get(
      // 1. Rota: A mesma rota que você já usa para as TABS principais
      route('project.ceremony.show', {
        project: project.id,
        ceremony: page, // 'page' é a prop da cerimônia atual
        artifact: newArtifactLabel,
      }),
    )
  }

  const handleCeremonyChange = (newCeremonyLabel) => {
    if (
      newCeremonyLabel === 'productBacklog' ||
      newCeremonyLabel === 'sprints'
    ) {
      router.get(
        route('project.ceremony.show', {
          project: project.id,
          ceremony: newCeremonyLabel,
        }),
      )
    } else {
      router.get(
        route('project.ceremony.show', {
          project: project.id,
          ceremony: newCeremonyLabel,
          artifact: defaultArtifacts[newCeremonyLabel],
        }),
      )
    }
  }

  return (
    <div className="project-view flex flex-col items-center justify-start px-1 w-full text-foreground">
      <div
        id="project-title-container"
        className="flex items-center justify-between text-3xl font-bold text-white text-center w-full p-0"
      >
        {/* tabs para alternar entre fases do projeto */}
        <Tabs
          value={page}
          onValueChange={handleCeremonyChange}
          className="w-full font-normal text-left"
        >
          <div className="flex justify-between items-center w-full gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() =>
                router.get(
                  route('project.show', {
                    project: project.id,
                  }),
                )
              }
            >
              <ArrowLeft />
            </Button>
            {/* Left: Tabs */}
            <TabsList>
              <TabsTrigger value="inception">
                {t('project.inception')}
              </TabsTrigger>
              <TabsTrigger value="storyDiscovery">
                {t('project.story_discovery')}
              </TabsTrigger>
              <TabsTrigger value="refining">{t('project.refining')}</TabsTrigger>
              <TabsTrigger value="modeling">{t('project.modeling')}</TabsTrigger>
              {can('productBacklog.view') && (
                <TabsTrigger value="productBacklog">
                  {t('project.product_backlog')}
                </TabsTrigger>
              )}
              {can('sprint.view') && (
                <TabsTrigger value="sprint">{t('project.sprint')}</TabsTrigger>
              )}
            </TabsList>

            {/* Center: Title e Botão de Edição */}
            <div
              id="project-title-content"
              className="flex-1 flex justify-center items-center gap-2 px-4 cursor-pointer" // Ajuste o gap aqui se precisar
            >
              <p className="bg-background text-center text-2xl font-bold text-foreground h-full p-0 border-0 m-0">
                {project.title}
              </p>
            </div>

            {/* Right: Buttons (Apenas ProjectPermissions agora) */}
            <div className="flex items-center gap-2">
              <ProjectSettings project={project} />
              <ProjectPermissions project={project} />
            </div>
          </div>

          <TabsContent value="inception">
            <NavMenu
              menuItems={localized(menuItems)}
              setActiveMenu={handleArtifactChange}
            />
            {renderInceptionContent()}
          </TabsContent>
          <TabsContent value="storyDiscovery">
            <NavMenu
              menuItems={localized(storyDiscoveryMenuItems)}
              setActiveMenu={handleArtifactChange}
            />
            {renderStoryDiscoveryContent()}
          </TabsContent>
          <TabsContent value="refining">
            <NavMenu
              menuItems={localized(refiningMenuItems)}
              setActiveMenu={handleArtifactChange}
            />
            {renderRefiningContent()}
          </TabsContent>
          <TabsContent value="modeling">
            <NavMenu
              menuItems={localized(modelingMenuItems)}
              setActiveMenu={handleArtifactChange}
            />
            {renderModelingContent()}
          </TabsContent>

          <TabsContent value="productBacklog">
            <ProductBacklog project={project} setProject={setProject} />
          </TabsContent>
          <TabsContent value="sprint">
            <Sprint project={project} setProject={setProject} />
          </TabsContent>
        </Tabs>
        <ChatBot
          project={projectDB}
          currentPage={{ page: page, artifact: artifact }}
          currentContextData={artifact}
        />
      </div>
    </div>
  )
}
const Project = ({ project, page, artifact }) => {
  const { auth, project: currentProject } = usePage().props

  const currentUserInProject = currentProject.users.find(
    (user) => user.user_id === auth.user.id,
  )
  const currentUserPermissions = currentUserInProject?.pivot?.permissions || []
  return (
    <PermissionProvider permissions={currentUserPermissions}>
      <Head title={project.title} />
      <ProjectView projectDB={project} page={page} artifact={artifact} />
    </PermissionProvider>
  )
}

Project.layout = (page) => <MainLayout children={page} />

export default Project
