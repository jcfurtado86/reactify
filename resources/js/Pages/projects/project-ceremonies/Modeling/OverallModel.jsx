import { router, usePage } from '@inertiajs/react'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { Plus, Check, X, Edit, Trash2 } from 'lucide-react'

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

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSave()
    else if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center min-h-8 rounded-md transition-colors p-0 border-border border"
    >
      {isEditing ? (
        <div className="flex items-center gap-2 w-full p-0">
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={onValueChange}
            onKeyDown={handleKeyDown}
            className="h-8 flex-1 text-center p-0 bg-secondary"
            autoFocus
          />
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
        </div>
      ) : (
        <>
          <p className="text-sm flex-1">{item}</p>
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
          {options.map((option, index) => (
            <SelectItem
              key={index}
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
}) => {
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)
  const titleInputRef = useRef(null)

  useEffect(() => {
    if (editingTitleId === card.id) {
      titleInputRef.current?.focus()
    }
  }, [editingTitleId, card.id])

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') saveEditTitle()
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

  return (
    <div className="relative group bg-card border border-border rounded-lg shadow-lg flex flex-col text-muted-foreground animate-fade-in">
      <div
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        className="relative flex justify-between items-center text-foreground bg-muted p-3 rounded-t-lg border-border border-b"
      >
        {editingTitleId === card.id ? (
          <div className="flex items-center gap-2 w-full">
            <Input
              ref={titleInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              className="h-9 text-lg font-semibold flex-1"
            />
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
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold">{card.class}</h3>
            <span className="text-sm font-bold ">{card.id}</span>
            <MotionDivOptions
              isHovered={isHeaderHovered}
              onEdit={() => startEditTitle(card)}
              onDelete={() => confirmDeleteCard(card.id)}
            />
          </>
        )}
      </div>
      <div className="flex flex-grow">
        <div className="w-1/2 p-3 flex flex-col gap-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-sm">Responsabilidades</h4>
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
        <div className="w-1/2 bg-muted/50 p-3 border-l border-border rounded-br-lg flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-sm">Colaboradores</h4>
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
              options={reusableClasses}
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
  const [editingField, setEditingField] = useState({
    cardId: null,
    field: null,
    itemIndex: null,
  })
  const [editingTitleId, setEditingTitleId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newReusableName, setNewReusableName] = useState('')
  const [deleteConfirmCardId, setDeleteConfirmCardId] = useState(null)

  const { errors } = usePage().props
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
    // router.patch(...)
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
    const updatedCards = [...project.crc_cards, newCard]

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
          setProject((prev) => ({ ...prev, crc_cards: updatedCards }))
        },
      },
    )
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <section className="flex gap-2 ">
        <Accordion
          type="single"
          collapsible
          className="w-full bg-card border rounded-lg"
        >
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              Banco de Classes
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <div className="flex items-center gap-2 my-2">
                <Input
                  placeholder="Adicionar nova classe ou colaborador..."
                  value={newReusableName}
                  onChange={(e) => setNewReusableName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleAddReusableName()
                  }
                />
                <Button onClick={handleAddReusableName}>Salvar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(project.overall_model_classes || []).length > 0 ? (
                  (project.overall_model_classes || []).map(
                    (model_class, index) => (
                      <Badge
                        key={index}
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
                    ),
                  )
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum nome salvo ainda.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Button className="h-11" onClick={handleAddCard}>
          Adicionar CRC Card
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {project?.crc_cards
          ?.slice()
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
            />
          ))}
      </div>

      <AlertDialog
        open={deleteConfirmCardId !== null}
        onOpenChange={() => setDeleteConfirmCardId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              card e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard}>
              Sim, excluir card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default OverallModel
