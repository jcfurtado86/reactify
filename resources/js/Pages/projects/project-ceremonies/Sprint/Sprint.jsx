import KanbanBoard from './KanbanBoard'

const getActiveSprints = (sprints) => {
  const now = new Date()
  return sprints.filter((sprint) => {
    const startDate = new Date(sprint.start_date)
    const endDate = new Date(sprint.end_date)
    return startDate <= now && now <= endDate
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
