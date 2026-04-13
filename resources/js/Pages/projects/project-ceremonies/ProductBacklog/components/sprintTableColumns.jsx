import { EllipsisVertical, Undo2 } from 'lucide-react'
import { getStatusColor } from '@/lib/utils'

/**
 * Definição das colunas compartilhadas pelas tabelas de
 * Sprint Backlog e Product Backlog. Extraída de ProductBacklog.jsx
 * (Q2 do plano de qualidade) para reduzir o tamanho do componente pai.
 *
 * `status` aqui é o status do sprint/contexto que dita quais ações
 * ficam disponíveis no dropdown.
 */
export const getSharedColumns = ({
  storyVariants,
  project,
  onMoveRequest,
  onRemoveRequest,
  selectedStories,
  status,
  isBacklog = false,
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
      const realStoryId = story.epic_id
        ? `${story.epic_id}.${story.epic_index || 0}`
        : `${story.id}`
      return (
        <Badge style={{ backgroundColor: selectedVariant }} variant="badge">
          {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`.toUpperCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'title',
    header: 'Título',
    meta: { className: 'w-[80%]' },
    cell: ({ row }) => (
      <div className="flex items-center w-full !line-clamp-3">
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

      return (
        <div className="flex items-center ">
          <Badge
            variant={'badge'}
            style={{ backgroundColor: getStatusColor(status) }}
          >
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const story = row.original
      const sprintId = story?.pivot?.sprint_id || null
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
            {status !== 'completed' && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to sprint</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {project.sprints
                      .filter(
                        (sprint) =>
                          sprint.status === 'active' && sprint.id !== sprintId,
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.created_at) - new Date(b.created_at),
                      )
                      .map((sprint) => (
                        <DropdownMenuItem
                          key={sprint.id}
                          onClick={() => onMoveRequest(sprint.id, story.id)}
                        >
                          {sprint.name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}
            {!isBacklog && sprintId && status !== 'completed' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemoveRequest(sprintId, story.id)}
                  className="text-red-600 focus:text-red-600 flex justify-start"
                >
                  <Undo2 className="mr-2 size-4" /> Mover para o Backlog
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export const selectItems = (itemList, rowSelection, setItems) => {
  const currentItems = []
  itemList.forEach((item, index) => {
    if (rowSelection[index]) currentItems.push(item.id)
  })
  setItems(currentItems)
}
