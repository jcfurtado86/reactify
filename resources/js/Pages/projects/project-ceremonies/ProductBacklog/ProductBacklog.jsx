import React, { useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { Loader2, ArrowRight, EllipsisVertical } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import TableComponent from '@/Components/TableComponent'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'

const selectItems = (itemList, rowSelection, setItems) => {
  const currentItems = []
  itemList.forEach((item, index) => {
    if (rowSelection[index]) currentItems.push(item.id)
  })
  setItems(currentItems)
}

const SprintTable = ({ sprint, moveToSprint, storyVariants, project }) => {
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [selectedStories, setSelectedStories] = useState([])

  useEffect(() => {
    selectItems(sprint.stories, rowSelection, setSelectedStories)
  }, [rowSelection])
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
      header: 'ID',
      cell: ({ row }) => {
        const story = row.original
        const selectedVariant = storyVariants[story.type] || '#f97316'

        return (
          <div className="flex items-center ">
            <Badge
              style={{ backgroundColor: selectedVariant }}
              variant="outline"
              className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer`}
            >
              {`${story.type === 'system' ? 'SS' : 'US'}${story.id}`.toUpperCase()}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center !line-clamp-3">
          {row.getValue('title')}
        </div>
      ),
    },
    { accessorKey: 'type', header: 'Type' },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={'Options'}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem>Options</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to sprint</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {project.sprints.map((sprint) => (
                      <DropdownMenuItem
                        key={sprint.id}
                        onClick={() =>
                          moveToSprint(
                            sprint.id,
                            selectedStories,
                            setSelectedStories,
                          )
                        }
                      >
                        {sprint.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  const table = useReactTable({
    data: sprint.stories || [],
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

  return (
    <AccordionItem
      key={sprint.id}
      value={sprint.name}
      className=" px-4 border border-accent"
    >
      <AccordionTrigger>
        <div>
          {sprint.name} - {table.getRowCount()} items
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="overflow-hidden rounded-md border ">
          <TableComponent table={table} />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

const ProductBacklog = ({ project, setProject }) => {
  const [localProject, setLocalProject] = useState(project)
  const [selectedStories, setSelectedStories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  //
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])

  const moveToSprint = async (
    sprintId,
    selectedStories,
    setSelectedStories,
  ) => {
    console.log(selectedStories)
    if (selectedStories.length === 0) return

    setIsLoading(true)

    setLocalProject((prevProject) => {
      const updatedProject = { ...prevProject }
      const targetSprint = updatedProject.sprints.find((s) => s.id === sprintId)

      if (targetSprint) {
        // Adicionar stories selecionadas ao sprint
        const storiesToMove = updatedProject.stories.filter((s) =>
          selectedStories.includes(s.id),
        )
        targetSprint.stories = [
          ...(targetSprint.stories || []),
          ...storiesToMove,
        ]
      }

      return updatedProject
    })

    router.post(
      route('sprint-stories.store', sprintId),
      {
        story_ids: selectedStories,
      },
      {
        onSuccess: (page) => {
          setSelectedStories([])
          setIsLoading(false)
          toast.success('Stories moved to sprint successfully!')

          if (page.props.project) {
            setProject(page.props.project)
            setLocalProject(page.props.project)
          }
        },
        onError: (errors) => {
          setIsLoading(false)
          setError('Failed to move stories to sprint')
          toast.error('Failed to move stories to sprint')
          console.error('Error:', errors)

          setLocalProject(project)
        },
      },
    )
  }

  const handleNavigateToMatrix = () => {
    localStorage.setItem('activeStoryDiscoveryMenu', 'Matriz de Priorização')

    router.get(
      route('project.ceremony.show', {
        project: project.id,
        ceremony: 'storyDiscovery',
      }),
    )
  }

  // ✅ Sincronizar estado local quando project muda
  useEffect(() => {
    setLocalProject(project)
  }, [project])

  const { productBacklogStories, sprintBacklogStories, deliveredStories } =
    useMemo(() => {
      const stories = localProject?.stories || []
      const sprints = localProject?.sprints || []

      const productBacklog = stories
        .filter((story) => {
          const isInActiveSprint = sprints.some(
            (sprint) =>
              (sprint.status === 'planning' || sprint.status === 'active') &&
              sprint.stories?.some(
                (sprintStory) => sprintStory.id === story.id,
              ),
          )

          return (
            (story.status === 'prioritized' || story.value !== null) &&
            !isInActiveSprint
          )
        })
        .sort((a, b) => {
          if (a.status === 'prioritized' && b.status !== 'prioritized')
            return -1
          if (b.status === 'prioritized' && a.status !== 'prioritized') return 1
          return (b.value ?? -1) - (a.value ?? -1)
        })

      const sprintBacklog = []
      const delivered = []

      sprints.forEach((sprint) => {
        if (sprint.status === 'planning' || sprint.status === 'active') {
          sprint.stories?.forEach((story) => {
            if (story.pivot?.kanban_status === 'done') {
              delivered.push({ ...story, sprint_name: sprint.name })
            } else {
              sprintBacklog.push({ ...story, sprint_name: sprint.name })
            }
          })
        }
      })

      return {
        productBacklogStories: productBacklog,
        sprintBacklogStories: sprintBacklog,
        deliveredStories: delivered,
      }
    }, [localProject])

  const board = {
    productBacklog: productBacklogStories,
    sprintBacklog: sprintBacklogStories,
    delivered: deliveredStories,
  }

  const storyVariants = project?.system_colors?.stories || {}

  const backlogColumns = [
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
      header: 'ID',
      cell: ({ row }) => {
        const story = row.original
        const selectedVariant = storyVariants[story.type] || '#f97316'

        return (
          <div className="flex items-center ">
            <Badge
              style={{ backgroundColor: selectedVariant }}
              variant="outline"
              className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer`}
            >
              {`${story.type === 'system' ? 'SS' : 'US'}${story.id}`.toUpperCase()}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center !line-clamp-3">
          {row.getValue('title')}
        </div>
      ),
    },
    { accessorKey: 'type', header: 'Type' },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={'Options'}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem>Options</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to sprint</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {project.sprints.map((sprint) => (
                      <DropdownMenuItem
                        key={sprint.id}
                        onClick={() =>
                          moveToSprint(
                            sprint.id,
                            selectedStories,
                            setSelectedStories,
                          )
                        }
                      >
                        {sprint.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const productBacklogTable = useReactTable({
    data: board.productBacklog,
    columns: backlogColumns,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnFilters,
      sorting,
    },
  })
  useEffect(() => {
    selectItems(board.productBacklog, rowSelection, setSelectedStories)
  }, [rowSelection])

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="flex flex-col p-4 min-h-[500px]">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-1"
      >
        <AccordionItem
          value={'Product Backlog'}
          className=" px-4 border border-accent"
        >
          <AccordionTrigger>
            <div>
              Product Backlog - {productBacklogTable.getRowCount()} items
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-hidden rounded-md border ">
              <TableComponent table={productBacklogTable} />
            </div>
          </AccordionContent>
        </AccordionItem>
        {project.sprints.map((sprint) => (
          <SprintTable
            key={sprint.id}
            sprint={sprint}
            storyVariants={storyVariants}
            moveToSprint={moveToSprint}
            project={project}
          />
        ))}
      </Accordion>
    </div>
  )
}

export default ProductBacklog
