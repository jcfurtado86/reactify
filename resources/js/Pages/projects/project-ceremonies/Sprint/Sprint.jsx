import KanbanBoard from './KanbanBoard'
import { isSprintActive } from '@/lib/utils'
const getActiveSprints = (sprints) => {
  return sprints.filter((sprint) => {
    return isSprintActive(sprint)
  })
}

const Sprint = ({ project, setProject }) => {
  const [activeSprints, setActiveSprints] = useState(
    getActiveSprints(project?.sprints || []),
  )

  const updateProjectData = (updatedProject) => {
    setProject(updatedProject)
  }

  return (
    <div className="w-full space-y-6 p-4">
      <KanbanBoard
        sprints={activeSprints}
        systemColors={project?.system_colors}
        updateProject={updateProjectData}
      />
    </div>
  )
}

export default Sprint
