import { router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { Plus, StickyNote } from 'lucide-react'
import GenerateAIButton from '@/Components/GenerateAIButton'
import InvestCard from '../Inspection/InvestCard'
import { useTooltipInfo } from '@/lib/projectData'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useOverallModelAIStore } from '@/stores/useOverallModelAIStore'
import OverallModelAIModal from './components/OverallModelAIModal'

// Q2/Q4 do plano de qualidade: o GeneratedItemsModal que ficava inline
// neste arquivo foi movido para ./components/OverallModelAIModal.jsx e
// o estado de UI (cards/classes geradas, isOpen, isMinimized) migrou
// para useOverallModelAIStore.

// Componente para a lista de Responsabilidades (com Input)
const EditableListItem = ({
  item,
  isEditing,
  editValue,
  onValueChange,
  onSave,
  onCancel,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef(null)
  const LIST_ITEM_MAX = 50
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && editValue.trim()) onSave()
    else if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center min-h-8 rounded-md transition-colors p-0 border-border border"
    >
      {isEditing ? (
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2 w-full p-0">
            <Input
              ref={inputRef}
              type="text"
              value={editValue}
              maxLength={LIST_ITEM_MAX} // [NOVO] LIMITE
              onChange={onValueChange}
              onKeyDown={handleKeyDown}
              className={cn(
                'h-8 flex-1 text-left px-2 bg-secondary',
                !editValue.trim()
                  ? 'border-destructive focus-visible:ring-destructive'
                  : '',
              )}
              autoFocus
            />
          </div>
          {/* <Button
            variant="ghost"
            size="icon"
            className="size-7 text-green-500 hover:bg-green-500/10 hover:text-green-500"
            onClick={onSave}
          >
            <Check className="size-4" />
          </Button>*/}
          {/* <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onCancel}
          >
            <X className="size-4" />
          </Button>*/}
          <div className="flex justify-between px-1 bg-background/50">
            <span className="text-[10px] text-destructive font-bold h-3 block">
              {!editValue.trim() ? 'Obrigatório' : ''}
            </span>
            <span
              className={cn(
                'text-[10px]',
                (editValue?.length || 0) >= LIST_ITEM_MAX
                  ? 'text-destructive font-bold'
                  : 'text-muted-foreground',
              )}
            >
              {editValue?.length || 0}/{LIST_ITEM_MAX}
            </span>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm px-2 flex-1 break-words">{item}</p>
          <MotionDivOptions
            isHovered={isHovered}
            isEditing={isEditing}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </>
      )}
    </div>
  )
}

// Componente para a lista de Colaboradores (com Select)
const CollaboratorItem = ({ item, onChange, onDelete, options = [] }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex w-full"
    >
      <Select value={item} onValueChange={onChange} className="text-center">
        <SelectTrigger className="h-8 justify-evenly">
          <SelectValue>{item || 'Selecione...'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.id ?? option.name}
              value={option.name}
              className="justify-evenly"
            >
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <MotionDivOptions
        isHovered={isHovered}
        onDelete={onDelete}
        options={{ edit: false, delete: true }}
      />
    </div>
  )
}

const CRCCard = ({
  card,
  project,
  setProject,
  editingField,
  setEditingField,
  editValue,
  setEditValue,
  handleDeleteListItem,
  confirmDeleteCard,
  editingTitleId,
  startEditTitle,
  saveEditTitle,
  cancelEditTitle,
  reusableClasses,
  handleCollaboratorChange,
  onInspect,
}) => {
  const { t } = useTranslation()
  const { errors } = usePage().props
  const CLASS_NAME_MAX = 40
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)
  const titleInputRef = useRef(null)

  useEffect(() => {
    if (editingTitleId === card.id) {
      titleInputRef.current?.focus()
    }
  }, [editingTitleId, card.id])

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' && editValue.trim()) saveEditTitle()
    if (e.key === 'Escape') cancelEditTitle()
  }

  const startEdit = (cardId, field, itemIndex) => {
    setEditingField({ cardId, field, itemIndex })
    setEditValue(card[field][itemIndex])
  }

  const addNewItem = (cardId, field) => {
    if (!card[field]) return
    const updatedArray = [...card[field], 'Novo item...']
    const updatedCards = project.crc_cards.map((c) =>
      c.id === cardId ? { ...c, [field]: updatedArray } : c,
    )
    const updatedField = updatedCards.find((c) => c.id === cardId)[field]

    setProject({ ...project, crc_cards: updatedCards })
    router.patch(route('overall.update', { id: cardId }), {
      [field]: updatedField,
    })
  }

  const collaboratorOptions = reusableClasses.filter(
    (cls) => cls.name !== card.class,
  )

  return (
    <div className="relative group bg-card border border-border rounded-lg shadow-lg flex flex-col text-muted-foreground animate-fade-in">
      <div
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        className="relative flex justify-between items-center text-foreground bg-muted p-3 rounded-t-lg border-border border-b"
        data-card-id={card.id}
      >
        {editingTitleId === card.id ? (
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-2 w-full">
              <Input
                ref={titleInputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className={cn(
                  'h-9 text-lg font-semibold flex-1',
                  !editValue.trim()
                    ? 'border-destructive focus-visible:ring-destructive'
                    : '',
                )}
                maxLength={CLASS_NAME_MAX}
              />
            </div>
            {/* <Button
              variant="ghost"
              size="icon"
              className="size-8 text-green-500 hover:bg-green-500/10 hover:text-green-500"
              onClick={saveEditTitle}
            >
              <Check className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={cancelEditTitle}
            >
              <X className="size-5" />
            </Button>*/}
            <div className="flex justify-between px-1">
              <span className="text-[10px] text-destructive font-bold h-3 block">
                {!editValue.trim() ? 'Nome obrigatório' : ''}
              </span>
              <span
                className={cn(
                  'text-[10px]',
                  (editValue?.length || 0) >= CLASS_NAME_MAX
                    ? 'text-destructive font-bold'
                    : 'text-muted-foreground',
                )}
              >
                {editValue?.length || 0}/{CLASS_NAME_MAX}
              </span>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold">{card.class}</h3>
            <span className="text-sm font-bold ">{card.id}</span>
            <MotionDivOptions
              isHovered={isHeaderHovered}
              onEdit={() => startEditTitle(card)}
              onDelete={() => confirmDeleteCard(card.id)}
              onInspect={onInspect}
            />
          </>
        )}
      </div>
      <div className="flex flex-grow">
        <div className="w-1/2 p-1 flex flex-col gap-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-sm">{t('overall_model.responsibilities')}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => addNewItem(card.id, 'responsabilities')}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {card.responsabilities?.map((resp, i) => (
            <EditableListItem
              key={`${card.id}-resp-${i}`}
              item={resp}
              isEditing={
                editingField.cardId === card.id &&
                editingField.field === 'responsabilities' &&
                editingField.itemIndex === i
              }
              editValue={editValue}
              onValueChange={(e) => setEditValue(e.target.value)}
              onEdit={() => startEdit(card.id, 'responsabilities', i)}
              onSave={saveEditTitle}
              onCancel={() =>
                setEditingField({ cardId: null, field: null, itemIndex: null })
              }
              onDelete={() =>
                handleDeleteListItem(card.id, 'responsabilities', i)
              }
            />
          ))}
        </div>
        <div className="w-1/2 bg-muted/50 p-1 border-l border-border rounded-br-lg flex flex-col gap-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-sm">{t('overall_model.collaborators')}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => addNewItem(card.id, 'collaborators')}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {card.collaborators.map((collab, i) => (
            <CollaboratorItem
              key={`${card.id}-collab-${i}`}
              item={collab}
              options={collaboratorOptions}
              onChange={(value) => handleCollaboratorChange(value, card.id, i)}
              onDelete={() => handleDeleteListItem(card.id, 'collaborators', i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const OverallModel = ({ project, setProject }) => {
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)

  // IA states movidos para useOverallModelAIStore (Q2/Q4).
  // Lemos só o que precisamos dentro deste componente; o modal
  // externo (OverallModelAIModal) consome o store diretamente.
  const isGenerating = useOverallModelAIStore((s) => s.isGenerating)
  const startGeneratingAI = useOverallModelAIStore((s) => s.startGenerating)
  const stopGeneratingAI = useOverallModelAIStore((s) => s.stopGenerating)
  const setGeneratedAI = useOverallModelAIStore((s) => s.setGenerated)
  const cancelAI = useOverallModelAIStore((s) => s.cancel)
  const [editingField, setEditingField] = useState({
    cardId: null,
    field: null,
    itemIndex: null,
  })
  const [editingTitleId, setEditingTitleId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newReusableName, setNewReusableName] = useState('')
  const [deleteConfirmCardId, setDeleteConfirmCardId] = useState(null)
  const CLASS_NAME_MAX = 40
  const { errors } = usePage().props

  // inspection function
  const inspectOverallModel = (modelId) => {
    if (inspectionId === modelId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${modelId}"]`)
      setAnchorEl(element)
      setInspectionId(modelId)
    }
  }

  const handleAddReusableName = () => {
    if (!newReusableName.trim()) return
    const currentNames = project.overall_model_classes || []
    const updatedNames = [...currentNames, { name: newReusableName.trim() }]
    setProject({ ...project, overall_model_classes: updatedNames })
    setNewReusableName('')
    router.post(route('overall-model-class.store'), {
      name: newReusableName,
      project_id: project.id,
    })
  }

  const handleDeleteReusableName = (idToDelete) => {
    const currentNames = project.overall_model_classes || []
    const updatedNames = currentNames.filter((item) => item.id !== idToDelete)
    setProject({ ...project, overall_model_classes: updatedNames })
    router.delete(route('overall-model-class.destroy', { id: idToDelete }))
  }

  const startEditTitle = (card) => {
    setEditingTitleId(card.id)
    setEditValue(card.class)
  }

  const cancelEditTitle = () => {
    setEditingTitleId(null)
    setEditValue('')
  }

  const saveEditTitle = () => {
    if (editingTitleId === null) return
    const updatedCards = project.crc_cards.map((c) =>
      c.id === editingTitleId ? { ...c, class: editValue } : c,
    )
    setProject({ ...project, crc_cards: updatedCards })
    cancelEditTitle()
    router.patch(route('overall.update', { id: editingTitleId }), {
      class: editValue,
    })
  }

  const saveEditListItem = () => {
    const { cardId, field, itemIndex } = editingField
    if (cardId === null) return
    const card = project.crc_cards.find((c) => c.id === cardId)
    const updatedArray = [...card[field]]
    updatedArray[itemIndex] = editValue
    const updatedCards = project.crc_cards.map((c) =>
      c.id === cardId ? { ...c, [field]: updatedArray } : c,
    )
    setProject({ ...project, crc_cards: updatedCards })
    setEditingField({ cardId: null, field: null, itemIndex: null })
    router.patch(route('overall.update', { id: cardId }), {
      [field]: updatedArray,
    })
  }

  const handleCollaboratorChange = (newValue, cardId, itemIndex) => {
    const card = project.crc_cards.find((c) => c.id === cardId)
    const updatedArray = [...card.collaborators]
    updatedArray[itemIndex] = newValue
    const updatedCards = project.crc_cards.map((c) =>
      c.id === cardId ? { ...c, collaborators: updatedArray } : c,
    )
    setProject({ ...project, crc_cards: updatedCards })
    router.patch(route('overall.update', { model: cardId }), {
      collaborators: updatedArray,
    })
  }

  const handleSave = () => {
    if (editingTitleId) {
      saveEditTitle()
    } else if (editingField.cardId) {
      saveEditListItem()
    }
  }

  const handleDeleteListItem = (cardId, field, itemIndex) => {
    const card = project.crc_cards.find((c) => c.id === cardId)
    const updatedArray = card[field].filter((_, i) => i !== itemIndex)
    const updatedCards = project.crc_cards.map((c) =>
      c.id === cardId ? { ...c, [field]: updatedArray } : c,
    )
    setProject({ ...project, crc_cards: updatedCards })
    router.patch(route('overall.update', { id: cardId }), {
      [field]: updatedArray,
    })
  }

  const confirmDeleteCard = (cardId) => {
    setDeleteConfirmCardId(cardId)
  }

  const handleDeleteCard = () => {
    if (deleteConfirmCardId === null) return
    const updatedCards = project.crc_cards.filter(
      (c) => c.id !== deleteConfirmCardId,
    )
    setProject({ ...project, crc_cards: updatedCards })
    setDeleteConfirmCardId(null)
    router.delete(route('overall.destroy', { id: deleteConfirmCardId }))
  }

  const handleAddCard = () => {
    const newCard = {
      id: `temp-${new Date().getTime()}`,
      class: 'Classe',
      responsabilities: ['Responsabilidade'],
      collaborators: ['Colaborador'],
    }

    const newClass = {
      id: `temp-class-${new Date().getTime()}`,
      name: newCard.class,
    }

    // Prepara as listas atualizadas para o estado
    const updatedCards = [...project.crc_cards, newCard]
    const updatedClasses = [...project.overall_model_classes, newClass]

    router.post(
      route('overall.store'),
      {
        class: newCard.class,
        responsabilities: newCard.responsabilities,
        collaborators: newCard.collaborators,
        project_id: project.id,
      },
      {
        onSuccess: () => {
          // Atualiza ambos (cards e classes) no sucesso
          setProject((prev) => ({
            ...prev,
            crc_cards: updatedCards,
            overall_model_classes: updatedClasses,
          }))
        },
      },
    )
  }

  const generateCRCCards = async () => {
    startGeneratingAI()
    try {
      const response = await axios.post(route('overall-model.generate'), {
        project_id: project.id,
      })
      const data = response.data

      if (data.status === 'sucesso') {
        if (!data.crc_cards || data.crc_cards.length === 0) {
          toast.info(t('overall_model.toast_empty_generation'))
          return
        }
        setGeneratedAI({
          cards: data.crc_cards,
          classes: data.overall_model_classes,
        })
        toast.success(`${data.crc_cards.length} cards foram sugeridos.`)
      } else if (data.status === 'warning') {
        toast.warning(data.message)
      } else {
        toast.error(
          data.message || 'Ocorreu uma resposta inesperada do servidor.',
        )
      }
    } catch (error) {
      console.error('Erro ao gerar cards:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      )
    } finally {
      stopGeneratingAI()
    }
  }

  const confirmGeneratedCards = () => {
    // Lê do store via getState (não precisa subscribe fino aqui)
    const state = useOverallModelAIStore.getState()
    const selectedCards = state.cards.filter((card) => card.selected)
    const selectedClasses = state.classes.filter((c) => c.selected)

    if (selectedCards.length === 0 && selectedClasses.length === 0) {
      toast.warning(t('overall_model.toast_select_one'))
      return
    }

    const cardsForBackend = selectedCards.map((card) => ({
      class: card.class,
      responsabilities: card.responsabilities,
      collaborators: card.collaborators,
      project_id: project.id,
    }))

    const classesForBackend = selectedClasses.map(({ name }) => ({
      name,
      project_id: project.id,
    }))

    const saveCards = () => {
      if (cardsForBackend.length > 0) {
        router.post(
          route('overall.bulk-store'),
          { crc_cards: cardsForBackend },
          {
            preserveScroll: true,
            onSuccess: () => {
              toast.success(
                `${cardsForBackend.length} CRC Card(s) salvo(s) com sucesso!`,
              )
              cancelAI()
            },
            onError: (errors) => {
              toast.error(t('overall_model.toast_save_error'))
              console.error(errors)
            },
          },
        )
      } else {
        cancelAI()
      }
    }

    if (classesForBackend.length > 0) {
      router.post(
        route('overall-model-class.bulk-store'),
        { classes: classesForBackend },
        {
          preserveScroll: true,
          onSuccess: () => {
            toast.success(
              `${classesForBackend.length} classe(s) salva(s) com sucesso!`,
            )
            saveCards()
          },
          onError: (errors) => {
            toast.error(t('overall_model.toast_classes_save_error'))
            console.error(errors)
          },
        },
      )
    } else {
      saveCards()
    }
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <OverallModelAIModal onConfirm={confirmGeneratedCards} />
      {inspectionId && (
        <InvestCard
          itemCategory={'crc_cards'}
          itemId={inspectionId}
          anchorEl={anchorEl}
          project={project}
          setProject={setProject}
          setInspectionId={setInspectionId}
        />
      )}
      <section className="flex gap-2 ">
        <Accordion
          type="single"
          collapsible
          className="w-full bg-card border rounded-lg"
        >
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              {t('overall_model.class_bank')}
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <div className="flex flex-col gap-1 my-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={t('overall_model.add_class_placeholder')}
                    value={newReusableName}
                    maxLength={CLASS_NAME_MAX}
                    onChange={(e) => setNewReusableName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      newReusableName.trim() &&
                      handleAddReusableName()
                    }
                  />
                  <Button
                    onClick={handleAddReusableName}
                    disabled={!newReusableName.trim()}
                  >
                    {t('common.save')}
                  </Button>
                </div>

                <div className="flex justify-end px-1">
                  <span
                    className={cn(
                      'text-[10px]',
                      newReusableName.length >= CLASS_NAME_MAX
                        ? 'text-destructive font-bold'
                        : 'text-muted-foreground',
                    )}
                  >
                    {newReusableName.length}/{CLASS_NAME_MAX}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(project.overall_model_classes || []).length > 0 ? (
                  (project.overall_model_classes || []).map((model_class) => (
                      <Badge
                        key={model_class.id}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {model_class.name}
                        <button
                          onClick={() =>
                            handleDeleteReusableName(model_class.id)
                          }
                          className="rounded-full hover:bg-destructive/20"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {t('overall_model.no_names_saved')}
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Button variant="secondary" className="h-12 " onClick={handleAddCard}>
          <Plus size={18} className="mr-2" />
          {t('overall_model.add_crc_card')}
        </Button>
      </section>
      {Object.keys(errors).length > 0 && (
        <div className="flex flex-col items-start">
          {Object.keys(errors).map((key, item) => (
            <span key={key} className="text-destructive text-xs font-normal">
              {errors[key]}
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* Adicionada verificação de 'length > 0' */}
        {project?.crc_cards && project.crc_cards.length > 0 ? (
          project.crc_cards
            .slice()
            .sort((a, b) => a.id - b.id)
            .map((card) => (
              <CRCCard
                key={card.id}
                card={card}
                project={project}
                setProject={setProject}
                editingField={editingField}
                setEditingField={setEditingField}
                handleDeleteListItem={handleDeleteListItem}
                confirmDeleteCard={confirmDeleteCard}
                editingTitleId={editingTitleId}
                startEditTitle={startEditTitle}
                saveEditTitle={handleSave}
                cancelEditTitle={cancelEditTitle}
                editValue={editValue}
                setEditValue={setEditValue}
                reusableClasses={project?.overall_model_classes || []}
                handleCollaboratorChange={handleCollaboratorChange}
                onInspect={() => inspectOverallModel(card.id)}
              />
            ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[200px]">
            <StickyNote size={32} className="mb-3 text-primary" />
            <p className="mb-2 font-medium text-foreground">
              {t('overall_model.no_crc_cards')}
            </p>
            <p className="mb-4 text-sm text-center max-w-xs">
              {t('overall_model.empty_hint')}
            </p>
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteConfirmCardId !== null}
        onOpenChange={() => setDeleteConfirmCardId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('overall_model.confirm_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('overall_model.confirm_delete_body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard}>
              {t('overall_model.confirm_delete_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GenerateAIButton
        isGenerating={isGenerating}
        onClick={generateCRCCards}
        tooltip={tooltipInfo.aiGeneratedOverallModel}
        className="w-1/2"
      />
    </div>
  )
}

export default OverallModel
