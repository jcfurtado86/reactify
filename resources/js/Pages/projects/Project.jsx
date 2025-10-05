import { useEcho } from '@laravel/echo-react'
import { Head, router, usePage } from '@inertiajs/react'
import NavMenu from '@/Components/NavMenu'
import { ProjectPermissions } from '@/Components/ProjectPermissions'
// inception
import MainView from './project-ceremonies/Inception/MainView.jsx'
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
import { ArrowLeft, PenLine, X } from 'lucide-react'
import { toast } from 'sonner'

import MainLayout from '@/Layouts/MainLayout'
import {
  PermissionProvider,
  usePermissions,
} from '@/Context/PermissionContext.jsx'
import Sprint from './project-ceremonies/Sprint/Sprint'
import { tooltipInfo } from '@/lib/projectData.js'
import Inspection from './project-ceremonies/Inspection/Inspection.jsx'
//chatbot
import ChatBot from './ChatBot.jsx'
import { ProjectSettings } from '@/Components/ProjectSettings.jsx'
import { useMemo, useState, useEffect } from 'react'

const ProjectView = ({ projectDB = [], page = 'inception' }) => {
  const [project, setProject] = useState({ ...projectDB })
  const { can } = usePermissions()

  // Inception States
  const [activeMenu, setActiveMenu] = useState(
    () => localStorage.getItem('activeMenu') || 'Product Canvas',
  )
  const [menuItems, setMenuItems] = useState([
    ...(can('productCanvas.create')
      ? [
          {
            label: 'Product Canvas',
            value: true,
            tooltip: tooltipInfo.productCanvas,
          },
        ]
      : []),
    ...(can('persona.create')
      ? [
          {
            label: 'Personas',
            value: false,
            tooltip: tooltipInfo.personas,
          },
        ]
      : []),
    ...(can('goal.create')
      ? [
          {
            label: 'Goals',
            value: false,
            tooltip: tooltipInfo.goals,
          },
        ]
      : []),
    ...(can('journey.create')
      ? [
          {
            label: 'Journeys',
            value: false,
            tooltip: tooltipInfo.journeys,
          },
        ]
      : []),
  ])

  // Story Discovery States
  const [activeStoryDiscoveryMenu, setActiveStoryDiscoveryMenu] = useState(
    () => localStorage.getItem('activeStoryDiscoveryMenu') || 'Stories',
  )
  const [storyDiscoveryMenuItems, setStoryDiscoveryMenuItems] = useState([
    ...(can('userStory.create')
      ? [
          {
            label: 'Stories',
            value: true,
            tooltip: tooltipInfo.stories,
          },
        ]
      : []),
    ...(can('overallModel.create')
      ? [
          {
            label: 'Overall Model',
            value: true,
            tooltip: tooltipInfo.overallModel,
          },
        ]
      : []),
    ...(can('prioritizationMatrix.create')
      ? [
          {
            label: 'Matriz de Priorização',
            value: false,
            tooltip: tooltipInfo.prioritizationMatrix,
          },
        ]
      : []),
    ...(can('changeLog.create')
      ? [
          {
            label: 'Change Log',
            value: false,
            tooltip: tooltipInfo.changeLog,
          },
        ]
      : []),
  ])

  // Refining States
  const [activeRefiningMenu, setActiveRefiningMenu] = useState(
    () => localStorage.getItem('activeRefiningMenu') || 'Epic Stories',
  )
  const [refiningMenuItems, setRefiningMenuItems] = useState([
    ...(can('userStory.create')
      ? [
          {
            label: 'Epic Stories',
            value: true,
            tooltip: tooltipInfo.epicStories,
          },
        ]
      : []),
    ...(can('businessRule.create')
      ? [
          {
            label: 'Business Rules',
            value: false,
            tooltip: tooltipInfo.businessRules,
          },
        ]
      : []),
    ...(can('usageScenario.create')
      ? [
          {
            label: 'Use Scenarios',
            value: false,
            tooltip: tooltipInfo.usageScenarios,
          },
        ]
      : []),
  ])

  // Modeling States
  const [activeModelingMenu, setActiveModelingMenu] = useState(
    () => localStorage.getItem('activeModelingMenu') || 'Overall Model',
  )
  const [modelingMenuItems, setModelingMenuItems] = useState([
    ...(can('overallModel.create')
      ? [
          {
            label: 'Overall Model',
            value: true,
            tooltip: tooltipInfo.overallModel,
          },
        ]
      : []),
    ...(can('interface.create')
      ? [
          {
            label: 'Internal and External Interfaces',
            value: false,
            tooltip: tooltipInfo.interfaces,
          },
        ]
      : []),
    ...(can('storyboard.create')
      ? [
          {
            label: 'Storyboards',
            value: false,
            tooltip: tooltipInfo.storyboards,
          },
        ]
      : []),
  ])

  const currentArtifact = useMemo(() => {
    switch (page) {
      case 'inception':
        return activeMenu
      case 'storyDiscovery':
        return activeStoryDiscoveryMenu
      case 'refining':
        return activeRefiningMenu
      case 'modeling':
        return activeModelingMenu
      case 'inspection':
      case 'productBacklog':
        // Para estes casos, o nome do artefato é o mesmo nome da página.
        return page
      default:
        return page
    }
  }, [
    page,
    activeMenu,
    activeStoryDiscoveryMenu,
    activeRefiningMenu,
    activeModelingMenu,
  ])

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
      'Use Scenarios': 'usage_scenarios',
      'Internal and External Interfaces': 'system_interfaces',
      Storyboards: 'storyboards',
      //Inspection: '',
      //'Product Backlog': 'stories',
      Sprint: 'sprints.stories',
    }),
    [],
  )

  const currentArtifactData = useMemo(() => {
    if (!projectDB || !currentArtifact) {
      return null
    }
    const dataKey = artifactToDataKeyMap[currentArtifact]
    return dataKey ? projectDB[dataKey] : null
  }, [projectDB, currentArtifact, artifactToDataKeyMap])

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
        // console.log(data.project)
      }
    } catch (error) {
      toast.error(
        'Erro ao obter o projeto ' +
          projectID +
          ' atualizado: ' +
          error.message,
      )
    } finally {
      // console.log('Projeto atualizado com sucesso!')
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
      value: item.label === activeMenu,
    }))
    setMenuItems(updatedMenuItems)
    localStorage.setItem('activeMenu', activeMenu)
  }, [activeMenu])

  // Effect for Story Discovery menu
  useEffect(() => {
    const updatedMenuItems = storyDiscoveryMenuItems.map((item) => ({
      ...item,
      value: item.label === activeStoryDiscoveryMenu,
    }))
    setStoryDiscoveryMenuItems(updatedMenuItems)
    localStorage.setItem('activeStoryDiscoveryMenu', activeStoryDiscoveryMenu)
  }, [activeStoryDiscoveryMenu])

  // Effect for Refining menu
  useEffect(() => {
    const updatedMenuItems = refiningMenuItems.map((item) => ({
      ...item,
      value: item.label === activeRefiningMenu,
    }))
    setRefiningMenuItems(updatedMenuItems)
    localStorage.setItem('activeRefiningMenu', activeRefiningMenu)
  }, [activeRefiningMenu])

  // Effect for Modeling menu
  useEffect(() => {
    const updatedMenuItems = modelingMenuItems.map((item) => ({
      ...item,
      value: item.label === activeModelingMenu,
    }))
    setModelingMenuItems(updatedMenuItems)
    localStorage.setItem('activeModelingMenu', activeModelingMenu)
  }, [activeModelingMenu])

  useEffect(() => {
    // console.log(project?.product_canvas)
  }, [project])

  const renderInceptionContent = () => {
    switch (activeMenu) {
      case 'Product Canvas':
        return (
          can('productCanvas.create') && (
            <MainView project={project} setProject={setProject} />
          )
        )
      case 'Personas':
        return (
          can('persona.create') && (
            <Personas project={project} setProject={setProject} />
          )
        )
      case 'Goals':
        return (
          can('goal.create') && (
            <Goals project={project} setProject={setProject} />
          )
        )
      case 'Journeys':
        return (
          can('journey.create') && (
            <Journeys project={project} setProject={setProject} />
          )
        )
      default:
        return null
    }
  }

  const renderStoryDiscoveryContent = () => {
    switch (activeStoryDiscoveryMenu) {
      case 'Stories':
        return (
          can('userStory.create') && (
            <Stories project={project} setProject={setProject} />
          )
        )
      case 'Overall Model':
        return (
          can('overallModel.create') && (
            <OverallModel project={project} setProject={setProject} />
          )
        )
      case 'Matriz de Priorização':
        return (
          can('prioritizationMatrix.create') && (
            <PrioritizationMatrix project={project} setProject={setProject} />
          )
        )
      case 'Change Log':
        return (
          can('changeLog.create') && (
            <ChangeLog project={project} setProject={setProject} />
          )
        )
      default:
        return null
    }
  }

  const renderRefiningContent = () => {
    switch (activeRefiningMenu) {
      case 'Epic Stories':
        return (
          can('userStory.create') && (
            <EpicStories project={project} setProject={setProject} />
          )
        )
      case 'Business Rules':
        return (
          can('businessRule.create') && (
            <BusinessRules project={project} setProject={setProject} />
          )
        )
      case 'Use Scenarios':
        return (
          can('usageScenario.create') && (
            <UsageScenarios project={project} setProject={setProject} />
          )
        )
      default:
        return null
    }
  }

  const renderModelingContent = () => {
    switch (activeModelingMenu) {
      case 'Overall Model':
        return (
          can('overallModel.create') && (
            <OverallModel project={project} setProject={setProject} />
          )
        )
      case 'Internal and External Interfaces':
        return (
          can('interface.create') && (
            <Interfaces project={project} setProject={setProject} />
          )
        )
      case 'Storyboards':
        return (
          can('storyboard.create') && (
            <SidebarProvider className="min-h-[calc(100vh-100px)]">
              <Storyboards project={project} setProject={setProject} />{' '}
            </SidebarProvider>
          )
        )
      default:
        return null
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
          onValueChange={(e) =>
            router.get(
              route('project.ceremony.show', {
                project: project.id,
                ceremony: e,
              }),
            )
          }
          className="w-full"
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
              <TabsTrigger value="inception">Inception</TabsTrigger>
              <TabsTrigger value="storyDiscovery">Story Discovery</TabsTrigger>
              <TabsTrigger value="refining">Refining</TabsTrigger>
              <TabsTrigger value="modeling">Modeling</TabsTrigger>
              <TabsTrigger value="inspection">Inspection</TabsTrigger>
              {can('productBacklog.create') && (
                <TabsTrigger value="productBacklog">
                  Product Backlog
                </TabsTrigger>
              )}
              {can('sprint.create') && (
                <TabsTrigger value="sprint">Sprint</TabsTrigger>
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
            <NavMenu menuItems={menuItems} setActiveMenu={setActiveMenu} />
            {renderInceptionContent()}
          </TabsContent>
          <TabsContent value="storyDiscovery">
            <NavMenu
              menuItems={storyDiscoveryMenuItems}
              setActiveMenu={setActiveStoryDiscoveryMenu}
            />
            {renderStoryDiscoveryContent()}
          </TabsContent>
          <TabsContent value="refining">
            <NavMenu
              menuItems={refiningMenuItems}
              setActiveMenu={setActiveRefiningMenu}
            />
            {renderRefiningContent()}
          </TabsContent>
          <TabsContent value="modeling">
            <NavMenu
              menuItems={modelingMenuItems}
              setActiveMenu={setActiveModelingMenu}
            />
            {renderModelingContent()}
          </TabsContent>
          <TabsContent value="inspection">
            <Inspection project={project} setProject={setProject} />
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
          currentPage={{ page: page, artifact: currentArtifact }}
          currentContextData={currentArtifactData}
        />
      </div>
    </div>
  )
}
const Project = ({ project, page }) => {
  const { auth, project: currentProject } = usePage().props

  const currentUserInProject = currentProject.users.find(
    (user) => user.user_id === auth.user.id,
  )
  const currentUserPermissions = currentUserInProject?.pivot?.permissions || []
  return (
    <PermissionProvider permissions={currentUserPermissions}>
      <Head title={project.title} />
      <ProjectView projectDB={project} page={page} />
    </PermissionProvider>
  )
}

Project.layout = (page) => <MainLayout children={page} />

export default Project
