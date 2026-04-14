import { formatDate, isSprintActive } from '@/lib/utils'
import { Trash2Icon as TrashIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import SpanButton from '@/Components/SpanButton'
import TableComponent from '@/Components/TableComponent'
import { getSharedColumns, selectItems } from './sprintTableColumns'

/**
 * Tabela expandível de uma sprint específica — extraída de
 * ProductBacklog.jsx (Q2 do plano de qualidade). Fica encapsulada
 * com seu próprio state de seleção/sorting, recebendo só os handlers
 * de movimentação vindos do pai.
 */
export const SprintTable = ({
  sprint,
  moveToSprint,
  removeFromSprint,
  storyVariants,
  project,
  openDeleteSprintForm,
  openEditSprintForm,
  openEndSprintForm,
}) => {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [selectedStories, setSelectedStories] = useState([])

  useEffect(() => {
    selectItems(sprint.stories, rowSelection, setSelectedStories)
  }, [rowSelection])

  const handleRemoveRequest = useCallback(
    (sprintId, clickedStoryId) => {
      const idsToMove =
        selectedStories.length > 0 ? selectedStories : [clickedStoryId]
      removeFromSprint(sprintId, idsToMove)
      setRowSelection({})
    },
    [selectedStories, removeFromSprint],
  )

  const handleMoveRequest = useCallback(
    (sprintId, clickedStoryId) => {
      const idsToMove =
        selectedStories.length > 0 ? selectedStories : [clickedStoryId]
      moveToSprint(sprintId, idsToMove).then(() => {
        setRowSelection({})
      })
    },
    [selectedStories, moveToSprint],
  )

  const columns = useMemo(
    () =>
      getSharedColumns({
        storyVariants,
        project,
        onMoveRequest: handleMoveRequest,
        onRemoveRequest: handleRemoveRequest,
        selectedStories,
        status: sprint.status,
        isBacklog: false,
      }),
    [
      storyVariants,
      project,
      handleMoveRequest,
      handleRemoveRequest,
      selectedStories,
      sprint.status,
    ],
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
        <AccordionTrigger className="hover:no-underline">
          <div className="flex gap-4">
            <span className="font-bold hover:underline my-auto">
              {sprint.name}
            </span>
            <span className="text-muted-foreground my-auto">
              {' '}
              {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)} ({' '}
              {t('common.items_count', { count: table.getRowCount() })})
            </span>

            {sprint.status === 'completed' && (
              <Badge variant="badge" className={'bg-rose-300'}>
                {t('sprint.sprint_completed')}
              </Badge>
            )}

            {isSprintActive(sprint) && sprint.status === 'active' && (
              <Badge variant="badge" className={'bg-green-300'}>
                {t('sprint.sprint_active')}
              </Badge>
            )}
            {sprint.status === 'active' && (
              <>
                <SpanButton
                  variant="secondary"
                  onClick={() => {
                    !isSprintActive(sprint)
                      ? openEditSprintForm(sprint, true)
                      : openEndSprintForm(sprint)
                  }}
                >
                  {!isSprintActive(sprint)
                    ? 'Iniciar Sprint'
                    : 'Finalizar Sprint'}
                </SpanButton>
                <SpanButton
                  variant="secondary"
                  onClick={() => openEditSprintForm(sprint)}
                >
                  {t('sprint.edit_sprint')}
                </SpanButton>
              </>
            )}
            <SpanButton
              title={t('sprint.delete_sprint')}
              variant="destructive"
              onClick={() => openDeleteSprintForm(sprint)}
            >
              <TrashIcon className="size-3" />
            </SpanButton>
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

export default SprintTable
