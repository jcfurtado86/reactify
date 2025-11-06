import React, { useState, useEffect, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

const ProductBacklog = ({ project, setProject }) => {
  const [localProject, setLocalProject] = useState(project)
  const [selectedStories, setSelectedStories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  //
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])

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

  const handleStorySelection = (storyId) => {
    setSelectedStories((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId],
    )
  }

  const moveToSprint = async (sprintId) => {
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

  const board = {
    productBacklog: productBacklogStories,
    sprintBacklog: sprintBacklogStories,
    delivered: deliveredStories,
  }

  console.log(board)
  const storyVariants = project?.system_colors?.stories || {}

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => {
        const story = row.original
        const selectedVariant = storyVariants[story.type] || '#f97316'
        console.log(story)
        return (
          <div className="flex items-center ">
            <Badge
              style={{ backgroundColor: selectedVariant }}
              variant="outline"
              className={`border-transparent text-primary-foreground font-bold w-fit cursor-pointer mb-2`}
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
  ]
  const table = useReactTable({
    data: board.productBacklog,
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
      Product Backlog
      <div className="overflow-hidden rounded-md border ">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className="whitespace-nowrap" key={header.id}>
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

export default ProductBacklog
