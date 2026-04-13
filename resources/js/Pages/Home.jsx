import { useEcho } from '@laravel/echo-react'
import {
  MoreHorizontal,
  CircleCheck,
  CircleOff,
  PowerCircle,
  Trash2,
  MousePointerClick,
} from 'lucide-react'
import { router, usePage, Head, useForm } from '@inertiajs/react'
import MainLayout from '@/Layouts/MainLayout'
import { toast } from 'sonner'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useEffect, useRef, useState } from 'react'
import TableComponent from '@/Components/TableComponent'
import { cn } from '@/lib/utils'

const NAME_MAX = 50

const Home = ({}) => {
  const props = usePage().props
  //const { errors } = props
  const projects = props.auth.projects || []
  const [currentProjects, setCurrentProjects] = useState(projects)
  const commandInputRef = useRef(null)
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  // Dialog "Criar Novo Projeto" compartilhado entre o botão do header
  // e o CTA "Criar meu primeiro projeto" do estado vazio.
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  // const [newProject, setNewProject] = useState({
  //   title: '',
  //   description: '',
  //   emoji: '',
  // })

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      title: '',
      description: '',
      emoji: '',
    })

  const columns = [
    {
      accessorKey: 'id',
      header: null,
      cell: ({ row }) => null,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Button
          variant="empty"
          onClick={() => router.get(route('project.show', row.getValue('id')))}
        >
          {row.getValue('title')}
        </Button>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="flex items-center !line-clamp-3">
          {row.getValue('description')}
        </div>
      ),
    },
    {
      accessorKey: 'users',
      header: 'Members',
      cell: ({ row }) => (
        <div className="w-32">
          <AvatarCircles
            numPeople={row.getValue('users').length}
            avatarUrls={row.getValue('users').map(
              (user) =>
                ({
                  imageUrl: user?.avatar_url,
                  profileUrl: '',
                }) || {},
            )}
          />
        </div>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center !line-clamp-3">
          <Button
            size="icon"
            variant="empty"
            className={`rounded-full ${row.getValue('active') ? 'text-green-400' : 'text-red-500'}`}
            title={row.getValue('active') ? 'Active' : 'Inactive'}
          >
            {row.getValue('active') ? <CircleCheck /> : <CircleOff />}
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <div className="flex items-center whitespace-nowrap">
          {new Date(row.getValue('created_at')).toLocaleString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => toggleActive(row.getValue('id'))}
              >
                Toggle active
                <PowerCircle />
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => deleteProject(row.getValue('id'))}
              >
                Delete
                <Trash2 />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: projects,
    columns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnFilters,
      sorting,
    },
  })

  const createProject = (e) => {
    e.preventDefault()

    post(route('project.store'), {
      onSuccess: () => {
        reset()
      },
    })
  }
  const toggleActive = (projectId) => {
    if (!projectId) return
    router.patch(route('project.toggle-active', projectId))
  }

  const deleteProject = (projectId) => {
    if (!projectId) return

    router.delete(route('project.destroy', projectId))
  }
  //
  const getUpdatedProjects = async (idList) => {
    try {
      const response = await fetch(route('projects.updated', { ids: idList }), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (response.ok && data.projects.length > 0) {
        setCurrentProjects((prev) => {
          const updatesMap = new Map(
            data.projects.map((updatedProject) => [
              updatedProject.id,
              updatedProject,
            ]),
          )

          return prev.map(
            (oldProject) => updatesMap.get(oldProject.id) || oldProject,
          )
        })
      }
      toast.success('Projetos atualizados com sucesso!')
    } catch (error) {
      toast.error('Erro ao obter projetos atualizados: ' + error.message)
      console.error(error)
    }
  }

  useEffect(() => {
    const focusCommandInput = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (commandInputRef.current) commandInputRef.current.focus()
      }
    }
    document.addEventListener('keydown', focusCommandInput)
    return () => document.removeEventListener('keydown', focusCommandInput)
  }, [])

  useEcho(`projects`, 'ProjectUpdated', (e) => {
    let newProjectList = []
    currentProjects.forEach((project) => {
      if (project.id === e.project_id) newProjectList.push(e.project_id)
    })

    if (newProjectList.length > 0) getUpdatedProjects(newProjectList)
  })

  useEcho('projects', 'ProjectDeleted', (e) => {
    setCurrentProjects((prev) =>
      prev.filter((project) => project.id !== e.projectId),
    )
  })

  return (
    <div className="bg-background text-white p-6 flex-1 mx-auto w-full">
      <Head title="Home" />
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-lg mb-4 text-foreground">Projects</p>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              className="flex relative items-center justify-center rounded-full shadow-md transition-colors hover:bg-accent bg-card text-foreground"
            >
              <ShineBorder
                borderWidth={2}
                shineColor={[
                  'oklch(0.5497 0.2143 285.2157)',
                  'oklch(0.6861 0.2061 14.9941)',
                ]}
              />
              Novo Projeto
            </Button>
          </DialogTrigger>

          <DialogContent className="">
            <form className="space-y-4" onSubmit={createProject}>
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para criar um novo projeto.
                  <br />
                  Os campos obrigatórios estão marcados com um asterisco{' '}
                  <span className="text-destructive">*</span>
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="title-1">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <span
                      className={cn(
                        'text-[10px]',
                        data.title.length >= NAME_MAX
                          ? 'text-destructive font-bold'
                          : 'text-muted-foreground',
                      )}
                    >
                      {data.title.length}/{NAME_MAX}
                    </span>
                  </div>

                  <Input
                    placeholder="Nome do Projeto"
                    id="title-1"
                    name="title"
                    maxLength={NAME_MAX} // Bloqueio físico
                    value={data.title}
                    className={cn(
                      errors.title
                        ? 'border-destructive focus-visible:ring-destructive'
                        : '',
                    )}
                    onChange={(e) => {
                      setData('title', e.target.value)
                      if (errors.title) clearErrors('title')
                    }}
                  />
                  {errors.title && (
                    <span className="text-destructive text-sm font-medium">
                      {errors.title}
                    </span>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description-1">
                      Descrição <span className="text-destructive">*</span>
                    </Label>
                    <span
                      className={cn(
                        'text-[10px]',
                        data.description.length >= 1000
                          ? 'text-destructive font-bold'
                          : 'text-muted-foreground',
                      )}
                    >
                      {data.description.length}/1000
                    </span>
                  </div>

                  <Input
                    placeholder="Descrição do Projeto"
                    id="description-1"
                    name="description"
                    maxLength={1000} // Bloqueio físico
                    className={cn(
                      'bg-background',
                      errors.description
                        ? 'border-destructive focus-visible:ring-destructive'
                        : '',
                    )}
                    value={data.description}
                    onChange={(e) => {
                      setData('description', e.target.value)
                      if (errors.description) clearErrors('description')
                    }}
                  />
                  {errors.description && (
                    <span className="text-destructive text-sm font-medium">
                      {errors.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="description">Emoji</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        {data.emoji || <MousePointerClick />}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-0">
                      <EmojiPicker
                        className="h-[342px]"
                        onEmojiSelect={({ emoji }) => {
                          setData('emoji', emoji)
                        }}
                      >
                        <EmojiPickerSearch />
                        <EmojiPickerContent />
                        <EmojiPickerFooter />
                      </EmojiPicker>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Remover emoji"
                    onClick={(e) => {
                      e.preventDefault()
                      setData('emoji', null)
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Criar Projeto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Overview */}
      {projects.length > 0 ? (
        <div className="overflow-hidden rounded-md border">
          <TableComponent table={table} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] border border-dashed rounded-lg bg-card/50 text-center p-8">
          <div className="bg-accent/50 p-4 rounded-full mb-4">
            <MousePointerClick className="h-12 w-12 text-foreground/80" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo ao Reactify
          </h3>
          <p className="text-muted-foreground max-w-md mb-8">
            Você ainda não tem nenhum projeto. Crie seu primeiro espaço de
            trabalho para começar a gerenciar suas tarefas com IA.
          </p>
          <Button
            size="lg"
            className="rounded-full font-semibold"
            onClick={() => setCreateDialogOpen(true)}
          >
            Criar meu primeiro projeto
          </Button>
        </div>
      )}
    </div>
  )
}

Home.layout = (page) => <MainLayout children={page} />

export default Home
