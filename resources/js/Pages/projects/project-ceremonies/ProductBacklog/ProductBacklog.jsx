import React, { useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { EllipsisVertical } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import TableComponent from '@/Components/TableComponent'
import NewSprintForm from '../Sprint/NewSprintForm'

const getSharedColumns = ({
  storyVariants,
  project,
  onMoveRequest,
  selectedStories,
}) => [
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
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => {
      const story = row.original
      const selectedVariant = storyVariants[story.type] || '#f97316'
      return (
        <Badge
          style={{ backgroundColor: selectedVariant }}
          variant="outline"
          className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer`}
        >
          {`${story.type === 'system' ? 'SS' : 'US'}${story.id}`.toUpperCase()}
        </Badge>
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
  {
    accessorKey: 'pivot.kanban_status',
    header: 'Status',
    cell: ({ row }) => {
      const story = row.original
      const status = story?.pivot?.kanban_status || 'Backlog'
      const getStatusColor = (status) => {
        switch (status) {
          case 'Backlog':
            return '#433E3F' // Jet
          case 'In Progress':
            return '#A5D8FF' // uranian blue
          case 'Completed':
            return '#6F9B77' //
          default:
            return '#433E3F' //
        }
      }
      return (
        <div className="flex items-center ">
          <Badge
            variant={'ghost'}
            style={{ backgroundColor: getStatusColor(status) }}
            className="whitespace-nowrap"
          >
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title={'Options'}>
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuItem>Sprint Options</DropdownMenuItem>
          <DropdownMenuItem>Edit Sprint</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    cell: ({ row }) => {
      const story = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title={'Options'}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem>
              {selectedStories.length > 1
                ? `${selectedStories.length} selected`
                : `1 selected`}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to sprint</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {project.sprints
                    .sort((a, b) => a.created_at - b.created_at)
                    .map((sprint) => (
                      <DropdownMenuItem
                        key={sprint.id}
                        // 4. O onClick agora chama a prop 'onMoveRequest'
                        // Ele passa o ID da sprint e a story da linha
                        onClick={() => onMoveRequest(sprint.id, story.id)}
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

  const handleMoveRequest = useCallback(
    (sprintId, clickedStoryId) => {
      let idsToMove = []
      if (selectedStories.length > 0) {
        idsToMove = selectedStories
      } else {
        idsToMove = [clickedStoryId]
      }

      // Chama a função 'moveToSprint' (do pai)
      moveToSprint(sprintId, idsToMove).then(() => {
        setRowSelection({}) // Limpa o estado LOCAL
      })
    },
    [selectedStories, moveToSprint],
  )
  const columns = useMemo(
    () =>
      getSharedColumns({
        storyVariants,
        project,
        onMoveRequest: handleMoveRequest, // Passe o handler LOCAL
        selectedStories,
      }),
    [storyVariants, project, handleMoveRequest, selectedStories],
  )

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
    <Accordion
      defaultValue={sprint.stories.length > 0 ? sprint.name : ''}
      type="single"
      collapsible
    >
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
    </Accordion>
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

  const moveToSprint = async (sprintId, storyIdsToMove = []) => {
    if (storyIdsToMove.length === 0) return

    setIsLoading(true)

    setLocalProject((prevProject) => {
      const updatedProject = { ...prevProject }
      const targetSprint = updatedProject.sprints.find((s) => s.id === sprintId)

      if (targetSprint) {
        // Adicionar stories selecionadas ao sprint
        const storiesToMove = updatedProject.stories.filter((s) =>
          storyIdsToMove.includes(s.id),
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
        story_ids: storyIdsToMove,
      },
      {
        onSuccess: (page) => {
          setIsLoading(false)

          if (page.props.project) {
            setProject(page.props.project)
            setLocalProject(page.props.project)
          }
        },
        onError: (errors) => {
          setIsLoading(false)
          setError('Failed to move stories to sprint')
          console.error('Error:', errors)

          setLocalProject(project)
        },
      },
    )
  }

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

  const handleMoveRequest = ({ sprintId, clickedStoryId }) => {
    let idsToMove = []
    if (selectedStories.length > 0) {
      idsToMove = selectedStories.map((story) => story.id)
    } else {
      idsToMove = [clickedStoryId]
    }

    moveToSprint(sprintId, idsToMove).then(() => {
      setRowSelection({})
    })
  }

  const backlogColumns = useMemo(
    () =>
      getSharedColumns({
        storyVariants,
        project,
        onMoveRequest: handleMoveRequest,
        selectedStories,
      }),
    [storyVariants, project, handleMoveRequest, selectedStories],
  )

  useEffect(() => {
    selectItems(board.productBacklog, rowSelection, setSelectedStories)
  }, [rowSelection])

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
      <section>
        <NewSprintForm project={project} setProject={setProject} />
      </section>
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="Product Backlog"
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
      </Accordion>
      {project.sprints.map((sprint) => (
        <SprintTable
          key={sprint.id}
          sprint={sprint}
          storyVariants={storyVariants}
          moveToSprint={moveToSprint}
          project={project}
        />
      ))}
    </div>
  )
}

export default ProductBacklog
