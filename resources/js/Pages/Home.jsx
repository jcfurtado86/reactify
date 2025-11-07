import { useEcho } from '@laravel/echo-react'
import {
  MoreHorizontal,
  CircleCheck,
  CircleOff,
  PowerCircle,
  Trash2,
} from 'lucide-react'
import { router, usePage, Head } from '@inertiajs/react'
import MainLayout from '@/Layouts/MainLayout'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import TableComponent from '@/Components/TableComponent'

const Dashboard = ({}) => {
  const props = usePage().props
  const projects = props.auth.projects || []
  const [currentProjects, setCurrentProjects] = useState(projects)
  const commandInputRef = useRef(null)
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
  })

  const columns = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
                  imageUrl: user.provider_avatar,
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
    router.post(route('project.store'), newProject)
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
        <Dialog>
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

          <DialogContent className="sm:max-w-[425px]">
            <form className="space-y-4" onSubmit={createProject}>
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para criar um novo projeto.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="title-1">Nome</Label>
                  <Input
                    placeholder="Nome do Projeto"
                    id="title-1"
                    name="title"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({ ...newProject, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    placeholder="Descrição do Projeto"
                    id="description-1"
                    name="description"
                    className="bg-background "
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                  />
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

      <div className="overflow-hidden rounded-md border">
        <TableComponent table={table} />
      </div>
    </div>
  )
}

const Home = ({}) => {
  return <Dashboard />
}

Home.layout = (page) => <MainLayout children={page} />

export default Home
