import { useEcho } from '@laravel/echo-react'
import {
  CheckCircle,
  CornerDownLeft,
  Power,
  Trash2,
  EllipsisVertical,
} from 'lucide-react'
import { Link, router, usePage, Head } from '@inertiajs/react'
import MainLayout from '@/Layouts/MainLayout'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

const ProjectCard = ({ project, toggleActiveProject, deleteProject }) => {
  return (
    <AlertDialog>
      <Card className="flex flex-col rounded justify-between h-52 w-64 hover:shadow-md">
        {/* CABEÇALHO: Título do projeto e menu de ações */}

        <CardHeader className="flex-row items-center justify-between w-full">
          <CardTitle className="text-md">
            <Link
              href={route('project.show', project.id)}
              className="flex hover:underline max-w-48 "
            >
              <p className="truncate w-full"> {project.title}</p>
            </Link>
          </CardTitle>

          {/* MENU DE AÇÕES */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onSelect={() => toggleActiveProject(project.id)}
              >
                <Power
                  className={`mr-2 size-4 ${project.active ? 'text-success' : 'text-destructive'}`}
                />
                <span>{project.active ? 'Desativar' : 'Ativar'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* CONTEÚDO: Descrição e contagem de membros */}
        <CardContent className="flex-1 overflow-hidden">
          <Link href={route('project.show', project.id)}>
            <CardDescription className="line-clamp-3">
              {' '}
              {/* Limita o texto a 3 linhas */}
              {project.description}
            </CardDescription>
          </Link>
        </CardContent>

        {/* RODAPÉ: Status e badge de Ativo/Inativo */}
        <CardFooter>
          <AvatarCircles
            numPeople={project?.users.length}
            avatarUrls={project?.users.map(
              (user) =>
                ({
                  imageUrl: user.provider_avatar,
                  profileUrl: '',
                }) || {},
            )}
          />
        </CardFooter>
      </Card>

      {/* CONTEÚDO DO DIÁLOGO DE CONFIRMAÇÃO */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{project.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o
            projeto e todos os seus dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteProject(project.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const Dashboard = ({}) => {
  const props = usePage().props
  const projects = props.auth.projects || []
  const [currentProjects, setCurrentProjects] = useState(projects)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const commandInputRef = useRef(null)
  const [search, setSearch] = useState('')

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
  })

  const columns = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
    },
  ]

  const [taskFilters, setTaskFilters] = useState([
    { name: 'Todos', active: true },
    { name: 'Ativos', active: false },
    { name: 'Inativos', active: false },
  ])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  const handleFilterChange = (filter) => {
    if (filter) {
      const filters = taskFilters.map((f, i) =>
        f.name === filter.name
          ? { ...f, active: true }
          : { ...f, active: false },
      )
      setTaskFilters(filters)
    }
    const updatedUiFilters = taskFilters.map((f) =>
      f.name === filter.name ? { ...f, active: true } : { ...f, active: false },
    )
    setTaskFilters(updatedUiFilters)

    // Apenas atualiza o nome do filtro ativo no estado
    setActiveFilter(filter.name)
  }

  const filteredProjects = useMemo(() => {
    if (!currentProjects) return []

    switch (activeFilter) {
      case 'Ativos':
        return currentProjects.filter((p) => p.active)
      case 'Inativos':
        return currentProjects.filter((p) => !p.active)
      case 'Finalizados':
        return []
      case 'Todos':
      default:
        return currentProjects
    }
  }, [currentProjects, activeFilter])

  const createProject = (e) => {
    e.preventDefault()
    router.post(route('project.store'), newProject)
  }
  const toggleActiveProject = (projectId) => {
    const updatedProjects = currentProjects.map((p) =>
      p.id === projectId ? { ...p, active: !p.active } : p,
    )
    setCurrentProjects(updatedProjects)

    router.patch(route('project.toggle-active', projectId))
  }

  const deleteProject = (projectId) => {
    const updatedProjects = currentProjects.filter((p) => p.id !== projectId)

    setCurrentProjects(updatedProjects)

    router.delete(route('project.destroy', projectId))
  }

  const getUpdatedProjects = async (idList) => {
    try {
      const response = await fetch(route('projects.updated', { ids: idList }), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
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
    } catch (error) {
      toast.error('Erro ao obter projetos atualizados: ' + error.message)
    } finally {
      console.log('Projetos atualizados com sucesso!')
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
      <div className="flex items-start gap-2">
        <div className=" flex flex-col ">
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
        {/* command */}

        {/* <div className="relative flex flex-col justify-end">*/}
        <Command className=" relative w-full md:min-w-[250px] max-w-prose  lg:max-w-screen-lg">
          <CommandInput
            shortcut
            ref={commandInputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar Projetos..."
            className="border-none focus:outline-none focus:ring-0"
          />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden ">
            <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
              Nenhum projeto encontrado.
            </CommandEmpty>
            <CommandGroup className={search.length > 0 ? '' : 'hidden'}>
              {filteredProjects?.map(
                (project) =>
                  project && (
                    <CommandItem
                      key={project.id}
                      value={project.title}
                      onSelect={() => {
                        router.visit(route('project.show', project.id))
                      }}
                    >
                      <CheckCircle className="mr-3 size-4 text-foreground" />
                      <span className="truncate w-full">{project.title}</span>
                      <CornerDownLeft className="mr-3 size-4 text-zinc-500" />
                    </CommandItem>
                  ),
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        {/* </div>*/}
      </div>

      {/* Task Overview */}
      <div className="my-8">
        <p className="font-semibold text-lg mb-4 text-foreground">Projects</p>

        <div className="flex space-x-2 mb-6">
          {taskFilters.map((filter, index) => (
            <Button
              variant="ghost"
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-1 hover:bg-secondary/50 rounded transition-colors duration-200 ${
                filter.active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground'
              }`}
              key={index}
            >
              {filter.name}
            </Button>
          ))}
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const Home = ({}) => {
  return <Dashboard />
}

Home.layout = (page) => <MainLayout children={page} />

export default Home
