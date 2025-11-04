import { router } from '@inertiajs/react'
import {
  Play,
  Check,
  Calendar as CalendarIcon,
  Trash2,
  Eye,
  Info,
  Edit,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SprintList = ({
  sprints,
  setActiveSprint,
  setView,
  systemColors,
  updateProject,
}) => {
  const [editingSprint, setEditingSprint] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    sprint: null,
    newStatus: null,
  })
  const [confirmDeleteStory, setConfirmDeleteStory] = useState({
    open: false,
    storyId: null,
    sprintId: null,
  })
  const [confirmDeleteSprint, setConfirmDeleteSprint] = useState({
    open: false,
    sprint: null,
  })

  const statusOptions = [
    {
      value: 'planning',
      label: 'Planejada',
      description: 'Sprint em fase de planejamento',
    },
    { value: 'active', label: 'Ativa', description: 'Sprint em execução' },
    {
      value: 'completed',
      label: 'Concluída',
      description: 'Sprint finalizada',
    },
  ]

  const storyVariants = systemColors?.stories
  // Separar sprints por status
  const sprintsByStatus = {
    planning: sprints.filter((sprint) => sprint.status === 'planning'),
    active: sprints.filter((sprint) => sprint.status === 'active'),
    completed: sprints.filter((sprint) => sprint.status === 'completed'),
  }

  const statusConfig = {
    planning: {
      title: 'Sprints Planejadas',
      icon: <CalendarIcon className="w-5 h-5 text-blue-600" />,
      color: 'text-blue-600',
      count: sprintsByStatus.planning.length,
    },
    active: {
      title: 'Sprint Ativas',
      icon: <Play className="w-5 h-5 text-green-600" />,
      color: 'text-green-600',
      count: sprintsByStatus.active.length,
    },
    completed: {
      title: 'Sprints Concluídas',
      icon: <CheckCircle className="w-5 h-5 text-gray-600" />,
      color: 'text-gray-600',
      count: sprintsByStatus.completed.length,
    },
  }

  const removeStoryFromSprint = (storyId, sprintId) => {
    router.delete(route('sprint-stories.destroy', [sprintId, storyId]), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        if (page.props.project) {
          updateProject(page.props.project)
        }
        setConfirmDeleteStory({ open: false, storyId: null, sprintId: null })
      },
      onError: (errors) => {
        console.error('Erro ao remover story:', errors)
        toast.error('Erro ao remover story. Tente novamente.')
        setConfirmDeleteStory({ open: false, storyId: null, sprintId: null })
      },
    })
  }

  const handleStatusChange = (sprint, newStatus) => {
    if (sprint.status === newStatus) return

    if (
      newStatus === 'active' &&
      (!sprint.stories || sprint.stories.length === 0)
    ) {
      toast.warning(
        'Não é possível ativar uma sprint vazia. Adicione pelo menos uma story antes de prosseguir.',
        {
          duration: 4000,
        },
      )
      return
    }

    setStatusChangeDialog({
      open: true,
      sprint: sprint,
      newStatus: newStatus,
    })
  }

  const confirmStatusChange = () => {
    const { sprint, newStatus } = statusChangeDialog

    router.patch(
      route('sprint.update', sprint.id),
      {
        status: newStatus,
        name: sprint.name,
        start_date: sprint.start_date.split('T')[0],
        end_date: sprint.end_date.split('T')[0],
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page) => {
          if (page.props.project) {
            updateProject(page.props.project)
          }
          toast.success(
            `Status da sprint alterado para "${statusOptions.find((s) => s.value === newStatus)?.label}"`,
          )
          setStatusChangeDialog({ open: false, sprint: null, newStatus: null })
        },
        onError: (errors) => {
          console.error('Erro ao alterar status da sprint:', errors)

          const mensagens = Object.values(errors || {})
          if (mensagens.length > 0) {
            toast.warning(mensagens.join('\n'))
          } else {
            toast.error('Erro ao alterar status da sprint. Tente novamente.')
          }

          setStatusChangeDialog({ open: false, sprint: null, newStatus: null })
        },
      },
    )
  }

  const getStatusWarning = (currentStatus, newStatus) => {
    if (currentStatus === 'active' && newStatus === 'planning') {
      return 'Atenção: Voltar uma sprint ativa para planejamento pode afetar o progresso das stories no Kanban.'
    }
    if (currentStatus === 'completed' && newStatus !== 'completed') {
      return 'Atenção: Alterar o status de uma sprint concluída pode afetar relatórios e métricas.'
    }
    if (newStatus === 'active') {
      return 'Esta sprint ficará disponível no Kanban Board para movimentação das stories.'
    }
    if (newStatus === 'completed') {
      return 'Esta ação marcará a sprint como finalizada. Stories não concluídas precisarão ser movidas para outras sprints.'
    }
    return null
  }

  const handleEditSprint = (sprint) => {
    setEditingSprint(sprint.id)
    setEditForm({
      name: sprint.name,
      start_date: sprint.start_date.split('T')[0],
      end_date: sprint.end_date.split('T')[0],
    })
  }

  const handleSaveEdit = (sprintId) => {
    router.patch(
      route('sprint.update', sprintId),
      {
        name: editForm.name,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page) => {
          setEditingSprint(null)
          if (page.props.project) {
            updateProject(page.props.project)
          }
          toast.success('Sprint atualizada com sucesso!')
        },
        onError: (errors) => {
          console.error('Erro ao editar sprint:', errors)
          toast.error('Erro ao atualizar sprint. Tente novamente.')
        },
      },
    )
  }

  const handleCancelEdit = () => {
    setEditingSprint(null)
    setEditForm({})
  }

  const handleDeleteSprint = (sprint) => {
    setConfirmDeleteSprint({ open: true, sprint: sprint })
  }

  const removeSprint = () => {
    const sprint = confirmDeleteSprint.sprint

    router.delete(route('sprint.destroy', sprint.id), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        if (page.props.project) {
          updateProject(page.props.project)
        }
        toast.success('Sprint deletada com sucesso!')
        setConfirmDeleteSprint({ open: false, sprint: null })
      },
      onError: (errors) => {
        console.error('Erro ao deletar sprint:', errors)
        toast.error('Erro ao deletar sprint. Tente novamente.')
        setConfirmDeleteSprint({ open: false, sprint: null })
      },
    })
  }

  const handleViewKanban = (sprint) => {
    setActiveSprint(sprint)
    setView('kanban')
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''

    const dateOnly = dateString.split('T')[0]
    const [year, month, day] = dateOnly.split('-')

    return `${day}/${month}/${year}`
  }

  const getSprintDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return ''

    const startOnly = startDate.split('T')[0]
    const endOnly = endDate.split('T')[0]

    const start = new Date(startOnly + 'T00:00:00')
    const end = new Date(endOnly + 'T00:00:00')

    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    return `${diffDays} dias`
  }

  const isSprintOverdue = (endDate, status) => {
    if (!endDate || status === 'completed') return false

    const today = new Date()
    const todayString =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0')

    const endOnly = endDate.split('T')[0]

    return todayString > endOnly && status === 'active'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'planning':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-600" />
      case 'completed':
        return <Check className="w-4 h-4 text-gray-600" />
      case 'planning':
        return <CalendarIcon className="w-4 h-4 text-blue-600" />
      default:
        return <Check className="w-4 h-4 text-gray-400" />
    }
  }

  const renderSprintCard = (sprint) => (
    <Card key={sprint.id}>
      <CardHeader>
        <div className="flex justify-between items-center">
          {editingSprint === sprint.id ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="max-w-xs"
              />
            </div>
          ) : (
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(sprint.status)}
              {sprint.name}
            </CardTitle>
          )}

          <div className="flex gap-2 items-center">
            {editingSprint === sprint.id ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveEdit(sprint.id)}
                >
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                {/* Select de Status */}
                <Select
                  value={sprint.status}
                  onValueChange={(value) => handleStatusChange(sprint, value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewKanban(sprint)}
                  disabled={sprint.status !== 'active'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Kanban
                </Button>

                {sprint.status !== 'active' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Kanban não disponível</h4>
                        <div className="text-sm text-muted-foreground">
                          O Kanban board só pode ser acessado quando a sprint
                          está com status <strong>"Ativa"</strong>. Esta sprint
                          está com status:{' '}
                          <Badge variant="outline" className="ml-1">
                            {sprint.status === 'planning'
                              ? 'Planejada'
                              : sprint.status === 'completed'
                                ? 'Concluída'
                                : sprint.status}
                          </Badge>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSprint(sprint)}
                  disabled={sprint.status === 'completed'}
                >
                  <Edit className="w-4 h-4" />
                </Button>

                <Popover
                  open={
                    confirmDeleteSprint.open &&
                    confirmDeleteSprint.sprint?.id === sprint.id
                  }
                  onOpenChange={(open) => {
                    if (!open) {
                      setConfirmDeleteSprint({ open: false, sprint: null })
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSprint(sprint)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-medium">Deletar Sprint</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Tem certeza que deseja deletar a sprint "{sprint.name}
                          "?
                        </p>
                        {sprint.stories && sprint.stories.length > 0 && (
                          <p className="mt-2 text-yellow-600 dark:text-yellow-400">
                            <strong>Atenção:</strong> Esta sprint possui{' '}
                            {sprint.stories.length} story(s). Elas retornarão
                            para o Product Backlog.
                          </p>
                        )}
                        <p className="mt-2 text-red-600 dark:text-red-400">
                          <strong>Esta ação não pode ser desfeita.</strong>
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmDeleteSprint({
                              open: false,
                              sprint: null,
                            })
                          }
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeSprint}
                        >
                          Deletar Sprint
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {editingSprint === sprint.id ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !editForm.start_date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.start_date ? (
                        format(editForm.start_date, 'dd/MM/yyyy', {
                          locale: ptBR,
                        })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editForm.end_date}
                      onSelect={(value) =>
                        setEditForm({
                          ...editForm,
                          start_date: value,
                        })
                      }
                      disabled={{ before: new Date() }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !editForm.end_date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.end_date ? (
                        format(editForm.end_date, 'dd/MM/yyyy', {
                          locale: ptBR,
                        })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editForm.end_date}
                      onSelect={(value) =>
                        setEditForm({
                          ...editForm,
                          end_date: value,
                        })
                      }
                      disabled={{ before: new Date() }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {/* <label className="text-sm font-medium">Data de Fim</label>
                <Input
                  type="date"
                  value={editForm.end_date}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={sprint.status === 'active'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end_date: e.target.value })
                  }
                />*/}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-medium">
                {formatDate(sprint.start_date)} até{' '}
                {formatDate(sprint.end_date)}
              </span>
              <span className="text-xs bg-muted px-2 py-1 rounded">
                {getSprintDuration(sprint.start_date, sprint.end_date)}
              </span>
              {isSprintOverdue(sprint.end_date, sprint.status) && (
                <Badge variant="destructive" className="text-xs">
                  Atrasada
                </Badge>
              )}
            </div>

            <Badge
              variant={getStatusColor(sprint.status)}
              className="capitalize"
            >
              {sprint.status === 'planning'
                ? 'Planejada'
                : sprint.status === 'active'
                  ? 'Ativa'
                  : sprint.status === 'completed'
                    ? 'Concluída'
                    : sprint.status}
            </Badge>

            <span>Stories: {sprint.stories ? sprint.stories.length : 0}</span>
          </div>
        )}

        {/* Stories da sprint - só mostra quando não está editando */}
        {editingSprint !== sprint.id &&
          sprint.stories &&
          sprint.stories.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">
                Stories nesta sprint ({sprint.stories.length}):
              </h4>
              <div className="space-y-2">
                {sprint.stories.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        style={{ backgroundColor: storyVariants[story.type] }}
                        variant="outline"
                        className="border-transparent text-primary-foreground font-bold cursor-pointer"
                      >
                        US{story.id}
                      </Badge>
                      <span className="text-sm">{story.title}</span>
                      {story.pivot?.kanban_status && (
                        <Badge
                          variant={
                            story.pivot.kanban_status === 'done'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {story.pivot.kanban_status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    {sprint.status === 'planning' && (
                      <Popover
                        open={
                          confirmDeleteStory.open &&
                          confirmDeleteStory.storyId === story.id
                        }
                        onOpenChange={(open) => {
                          if (!open) {
                            setConfirmDeleteStory({
                              open: false,
                              storyId: null,
                              sprintId: null,
                            })
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfirmDeleteStory({
                                open: true,
                                storyId: story.id,
                                sprintId: sprint.id,
                              })
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-3">
                            <h4 className="font-medium">
                              Remover Story da Sprint
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Tem certeza que deseja remover a story "
                              {story.title}" desta sprint?
                              <br />
                              Ela retornará para o Product Backlog.
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setConfirmDeleteStory({
                                    open: false,
                                    storyId: null,
                                    sprintId: null,
                                  })
                                }
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  removeStoryFromSprint(story.id, sprint.id)
                                }
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  )

  if (sprints.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma sprint criada ainda. Crie uma para começar!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={['planning', 'active', 'completed']}
        className="w-full"
      >
        {Object.entries(statusConfig).map(([status, config]) => (
          <AccordionItem key={status} value={status}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                {config.icon}
                <span className={`font-semibold ${config.color}`}>
                  {config.title}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {config.count}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              {sprintsByStatus[status].length === 0 ? (
                <Card>
                  <CardContent className="text-center py-6">
                    <p className="text-muted-foreground">
                      Nenhuma sprint{' '}
                      {status === 'planning'
                        ? 'planejada'
                        : status === 'active'
                          ? 'ativa'
                          : 'concluída'}{' '}
                      encontrada.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sprintsByStatus[status].map((sprint) =>
                    renderSprintCard(sprint),
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Alert Dialog para confirmação de mudança de status */}
      <AlertDialog
        open={statusChangeDialog.open}
        onOpenChange={(open) =>
          !open &&
          setStatusChangeDialog({ open: false, sprint: null, newStatus: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar mudança de status</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {statusChangeDialog.sprint && statusChangeDialog.newStatus && (
                  <div className="space-y-2">
                    <div>
                      Deseja alterar o status da sprint "
                      <strong>{statusChangeDialog.sprint.name}</strong>" de{' '}
                      <Badge variant="outline">
                        {
                          statusOptions.find(
                            (s) => s.value === statusChangeDialog.sprint.status,
                          )?.label
                        }
                      </Badge>{' '}
                      para{' '}
                      <Badge variant="outline">
                        {
                          statusOptions.find(
                            (s) => s.value === statusChangeDialog.newStatus,
                          )?.label
                        }
                      </Badge>
                      ?
                    </div>

                    {getStatusWarning(
                      statusChangeDialog.sprint.status,
                      statusChangeDialog.newStatus,
                    ) && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          {getStatusWarning(
                            statusChangeDialog.sprint.status,
                            statusChangeDialog.newStatus,
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SprintList
