import {
  Plus,
  Edit,
  Trash,
  UserCircle2,
  Check,
  X,
  Minus,
  ChevronsUp,
} from 'lucide-react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import MotionDivOptions from '@/Components/MotionDivOptions'
import TextareaAutosize from 'react-textarea-autosize'
import GenerateAIButton from '@/Components/GenerateAIButton'
import InvestCard from '../Inspection/InvestCard'

const GeneratedItemsModal = ({
  isModalMinimized,
  changeModalState,
  cancelGeneratedItems,
  generatedItems,
  toggleItemSelection,
  confirmGeneratedItems,
  toggleAllItems,
}) => {
  return (
    <div
      className={`
          transition-all duration-300 z-50
          ${
            isModalMinimized
              ? 'fixed bottom-4 right-4 w-[400px]'
              : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'
          }
        `}
    >
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-3 flex-shrink-0">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            {!isModalMinimized && 'Personas Geradas por IA'}
            {isModalMinimized && 'Personas Geradas'}
          </h3>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="secondary" onClick={changeModalState}>
              {isModalMinimized ? (
                <ChevronsUp size={20} />
              ) : (
                <Minus size={20} />
              )}
            </Button>
            <Button
              onClick={cancelGeneratedItems}
              size="icon"
              variant="secondary"
            >
              <X size={24} />
            </Button>
          </div>
        </div>

        {!isModalMinimized && (
          <>
            <div className="flex items-center justify-between mx-6 mb-4 p-3 bg-muted rounded-lg flex-shrink-0">
              <span className="text-foreground font-medium">
                {generatedItems.filter((j) => j.selected).length} de{' '}
                {generatedItems.length} selecionadas
              </span>
              <Button
                onClick={toggleAllItems}
                className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
              >
                {generatedItems.every((story) => story.selected)
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </Button>
            </div>

            <div className=" px-6 overflow-y-auto min-h-0">
              <div className="flex flex-col gap-4 py-2">
                {generatedItems.map((persona, index) => (
                  <div
                    key={persona.id || `temp-${index}`}
                    className={`rounded-lg p-4 border transition-all duration-300 w-full ${
                      persona.selected
                        ? 'bg-muted border-primary shadow-lg scale-[1.02]' // Efeito de destaque ao selecionar
                        : 'bg-muted/40 border-border hover:border-primary/50'
                    }`}
                  >
                    <label className="flex flex-col cursor-pointer w-full">
                      {/* Cabeçalho do Card */}
                      <div className="flex items-center justify-between w-full mb-4 pb-3 border-b border-border">
                        <h3 className="text-xl font-bold text-foreground">
                          {persona.name}
                        </h3>
                        <Checkbox
                          checked={persona.selected}
                          onCheckedChange={() => toggleItemSelection(index)}
                          // Adicionar uma 'aria-label' melhora a acessibilidade para leitores de tela.
                          aria-label={`Selecionar ${persona.name}`}
                        />
                      </div>

                      {/* Corpo do Card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm text-left">
                        {/* Seção de Perfil */}
                        <div className="flex flex-col gap-2">
                          <h4 className="font-semibold text-foreground mb-1">
                            Perfil
                          </h4>
                          <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                            {persona.profile.map((item, i) => (
                              <li key={`profile-${persona.id}-${i}`}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Seção de Expectativas */}
                        <div className="flex flex-col gap-2">
                          <h4 className="font-semibold text-foreground mb-1">
                            Expectativas
                          </h4>
                          <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                            {persona.expectations.map((item, i) => (
                              <li key={`expectation-${persona.id}-${i}`}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Seção de Objetivos */}
                        <div className="flex flex-col gap-2">
                          <h4 className="font-semibold text-foreground mb-1">
                            Objetivos
                          </h4>
                          <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                            {persona.goals.map((item, i) => (
                              <li key={`goal-${persona.id}-${i}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-border flex-shrink-0">
              <Button
                onClick={cancelGeneratedItems}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmGeneratedItems}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center"
                disabled={generatedItems.filter((j) => j.selected).length === 0}
              >
                <Check className="mr-2" size={16} />
                Confirmar e Adicionar (
                {generatedItems.filter((j) => j.selected).length})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
const PersonaCard = ({
  persona,
  addNewItem,
  editingPersona,
  saveEditField,
  editPersonaName,
  saveEditPersona,
  startEditPersona,
  inspectPersona,
  personaFieldVariants,
  getFieldTitle,
  editingField,
  editValue,
  setEditValue,
  setEditPersonaName,
  startEditField,
  textareaRef,
  confirmDeleteItem,
  confirmDeletePersona,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      key={persona.id}
      className="group relative col-span-1 bg-card border-0 animate-fade-in rounded"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          <UserCircle2 className=" shrink-0 size-8 text-primary" />
          {editingPersona === persona.id ? (
            <Input
              type="text"
              value={editPersonaName}
              onChange={(e) => setEditPersonaName(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === 'Enter') saveEditPersona()
              }}
              className="!text-xl font-bold"
              autoFocus
            />
          ) : (
            <CardTitle data-card-id={persona.id} className="ml-3 text-xl">
              {persona.name}
            </CardTitle>
          )}
        </div>
        {/* <div className="flex items-center gap-1">
        {editingPersona === persona.id ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={saveEditPersona}
          >
            <Check className="h-4 w-4 text-green-500" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startEditPersona(persona.id)}
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive/80 hover:text-destructive"
          onClick={() => confirmDeletePersona(persona.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>*/}
        <MotionDivOptions
          isHovered={isHovered}
          onEdit={() => startEditPersona(persona.id)}
          onDelete={() => confirmDeletePersona(persona.id)}
          onInspect={() => inspectPersona(persona.id)}
        />
      </CardHeader>

      <CardContent className="persona grid grid-cols-1 md:grid-cols-2 p-2 gap-2">
        {['profile', 'expectations', 'goals'].map((field) => (
          <div
            key={field}
            className="flex flex-col gap-2 p-3 rounded-lg bg-card border-border border-2"
          >
            <div className="flex items-center justify-between">
              <h4
                className={`font-semibold text-sm ${personaFieldVariants[field].text}`}
              >
                {getFieldTitle(field)}
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => addNewItem(persona.id, field)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              {persona[field].map((item, itemIndex) => (
                <PersonaItem
                  key={itemIndex}
                  item={item}
                  isEditing={
                    editingField.personaId === persona.id &&
                    editingField.field === field &&
                    editingField.itemIndex === itemIndex
                  }
                  editValue={editValue}
                  onValueChange={(e) => setEditValue(e.target.value)}
                  onEdit={() => startEditField(persona.id, field, itemIndex)}
                  onSave={saveEditField}
                  onDelete={() =>
                    confirmDeleteItem(persona.id, field, itemIndex)
                  }
                  textareaRef={
                    editingField.personaId === persona.id &&
                    editingField.field === field &&
                    editingField.itemIndex === itemIndex
                      ? textareaRef
                      : null
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
const PersonaItem = ({
  item,
  isEditing,
  editValue,
  onValueChange,
  onEdit,
  onSave,
  onDelete,
  textareaRef,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave()
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex min-h-[40px] items-center justify-between rounded p-2 transition-colors font-normal hover:bg-muted/50 cursor-default"
    >
      {isEditing ? (
        <div className="flex w-full items-center gap-2">
          <TextareaAutosize
            ref={textareaRef}
            value={editValue || ''}
            onChange={onValueChange}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-0  w-full rounded text-sm"
            autoFocus
          />
          {/* <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-green-500 hover:bg-green-500/10 hover:text-green-500"
              onClick={onSave}
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onEdit(null)}
            >
              <X className="size-4" />
            </Button>
          </div>*/}
        </div>
      ) : (
        <p
          className={`text-sm text-muted-foreground text-left pr-4 ${
            !item ? 'italic text-muted-foreground/50' : ''
          }`}
        >
          {item || 'Clique em editar para adicionar'}
        </p>
      )}

      <MotionDivOptions
        isHovered={isHovered}
        isEditing={isEditing}
        // isTemporary={isTemporary}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

const Personas = ({ project, setProject }) => {
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const textareaRef = useRef(null)
  const [editingField, setEditingField] = useState({
    personaId: null,
    field: null,
    itemIndex: null,
  })
  const [editValue, setEditValue] = useState('')
  const [deleteConfirmItem, setDeleteConfirmItem] = useState({
    personaId: null,
    field: null,
    itemIndex: null,
  })
  const [editingPersona, setEditingPersona] = useState(null)
  const [editPersonaName, setEditPersonaName] = useState('')
  const [deleteConfirmPersona, setDeleteConfirmPersona] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  //ia states
  const [aiGeneratedPersonas, setAiGeneratedPersonas] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)

  const personaFieldVariants = {
    profile: { text: 'text-primary' },
    expectations: { text: 'text-blue-400' },
    goals: { text: 'text-green-400' },
  }

  const startEditField = (personaId, field, itemIndex) => {
    const persona = project.personas.find((p) => p.id === personaId)
    setEditingField({ personaId, field, itemIndex })
    setEditValue(persona[field][itemIndex])
  }

  const startEditPersona = (personaId) => {
    const persona = project.personas.find((p) => p.id === personaId)
    setEditingPersona(personaId)
    setEditPersonaName(persona.name)
  }

  const confirmDeleteItem = (personaId, field, itemIndex) => {
    setDeleteConfirmItem({ personaId, field, itemIndex })
  }

  const confirmDeletePersona = (personaId) => {
    setDeleteConfirmPersona(personaId)
  }

  const addNewPersona = () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const newPersona = {
      name: 'Nova Persona',
      profile: [],
      expectations: [],
      goals: [],
      project_id: project.id,
    }

    router.post('/persona', newPersona, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        const createdPersona = page.props.project.personas.find(
          (p) => !project.personas.find((existingP) => existingP.id === p.id),
        )

        if (createdPersona) {
          setProject({
            ...project,
            personas: [...project.personas, createdPersona],
          })
        }
        setIsSubmitting(false)
      },
      onError: (errors) => {
        console.error('Erro ao criar persona:', errors)
        setIsSubmitting(false)
      },
    })
  }

  const saveEditPersona = () => {
    const personaId = editingPersona
    if (personaId === null || !project.personas) return

    const updatedPersonas = project.personas.map((persona) =>
      persona.id === personaId
        ? { ...persona, name: editPersonaName }
        : persona,
    )

    setProject({ ...project, personas: updatedPersonas })
    setEditingPersona(null)

    router.patch(route('persona.update', personaId), {
      name: editPersonaName,
    })
  }

  const saveEditField = () => {
    const { personaId, field, itemIndex } = editingField
    if (!personaId || !field || itemIndex === null) return

    const persona = project.personas.find((p) => p.id === personaId)
    if (!persona) return

    const updatedArray = [...persona[field]]
    updatedArray[itemIndex] = editValue

    const updatedPersonas = project.personas.map((p) =>
      p.id === personaId ? { ...p, [field]: updatedArray } : p,
    )

    setProject({ ...project, personas: updatedPersonas })
    setEditingField({ personaId: null, field: null, itemIndex: null })

    router.patch(route('persona.update', personaId), {
      // ...persona,
      [field]: updatedArray,
      project_id: project.id,
    })
  }

  const deleteItem = () => {
    const { personaId, field, itemIndex } = deleteConfirmItem
    if (personaId === null || field === null || itemIndex === null) return

    const persona = project.personas.find((p) => p.id === personaId)
    if (!persona || !persona[field] || itemIndex >= persona[field].length)
      return

    const updatedArray = [...persona[field]]
    updatedArray.splice(itemIndex, 1)

    if (updatedArray.length === 0) {
      updatedArray.push('')
    }

    const updatedPersonas = project.personas.map((p) =>
      p.id === personaId ? { ...p, [field]: updatedArray } : p,
    )

    setProject({ ...project, personas: updatedPersonas })
    setDeleteConfirmItem({ personaId: null, field: null, itemIndex: null })

    router.patch(route('persona.update', personaId), {
      // ...persona,
      [field]: updatedArray,
      project_id: project.id,
    })
  }

  const handleDeletePersona = () => {
    if (deleteConfirmPersona === null || !project.personas) return

    const updatedPersonas = project.personas.filter(
      (persona) => persona.id !== deleteConfirmPersona,
    )

    setDeleteConfirmPersona(null)

    setProject((prevProject) => ({
      ...prevProject,
      personas: updatedPersonas,
    }))

    router.delete(route('persona.delete', deleteConfirmPersona))
  }

  const addNewItem = (personaId, field) => {
    if (!project.personas) return

    const persona = project.personas.find((p) => p.id === personaId)
    if (!persona) return

    const updatedArray = [...persona[field], '']

    const updatedPersonas = project.personas.map((p) =>
      p.id === personaId ? { ...p, [field]: updatedArray } : p,
    )

    setProject({ ...project, personas: updatedPersonas })

    router.patch(route('persona.update', personaId), {
      // ...persona,
      [field]: updatedArray,
      project_id: project.id,
    })
  }

  const getFieldTitle = (field) => {
    switch (field) {
      case 'profile':
        return 'Perfil'
      case 'expectations':
        return 'Expectativas'
      case 'goals':
        return 'Objetivos'
      default:
        return field
    }
  }

  // inspection function
  const inspectPersona = (personaId) => {
    if (inspectionId === personaId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(`[data-card-id="${personaId}"]`)
      setAnchorEl(element)
      setInspectionId(personaId)
    }
  }
  //ia functions
  const generatePersonas = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('persona.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const personasWithSelection = data.personas.map((persona) => ({
          ...persona,
          selected: true,
        }))

        if (personasWithSelection.length === 0) {
          toast.info('A IA não gerou novas personas com base nas entrevistas.')
          return
        }

        setAiGeneratedPersonas(personasWithSelection)
        setShowAiModal(true)
        toast.success('Personas geradas com sucesso.')
      } else {
        if (data.status === 'warning') {
          toast.warning(data.message)
        } else {
          toast.error(
            data.message || 'Ocorreu uma resposta inesperada do servidor.',
          )
        }
      }
    } catch (error) {
      console.error('Erro ao gerar personas:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmGeneratedPersonas = () => {
    const selectedPersonas = aiGeneratedPersonas.filter(
      (persona) => persona.selected,
    )
    const remainingPersonas = aiGeneratedPersonas.filter(
      (persona) => !persona.selected,
    )

    if (selectedPersonas.length === 0) {
      toast.warning('Selecione pelo menos uma persona para adicionar.')
      return
    }

    const personasToAdd = selectedPersonas.map((persona) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      project_id: project.id,
      ...persona,
    }))

    setProject((prevProject) => ({
      ...prevProject,
      personas: [...(prevProject.personas || []), ...personasToAdd],
    }))

    const personasForBackend = selectedPersonas.map(
      ({ selected, ...personaData }) => ({
        ...personaData,
        project_id: project.id,
      }),
    )

    router.post(
      route('persona.bulk-store'),
      { personas: personasForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedPersonas.length} persona(s) adicionada(s) com sucesso!`,
          )
          setAiGeneratedPersonas(remainingPersonas)
          if (remainingPersonas.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error('Ocorreu um erro ao salvar as personas.')
          console.error('Erro do backend:', errors)
          setProject((prevProject) => {
            const personasToAddIds = personasToAdd.map((p) => p.id)
            return {
              ...prevProject,
              personas: prevProject.personas.filter(
                (p) => !personasToAddIds.includes(p.id),
              ),
            }
          })
        },
      },
    )
  }

  const cancelGeneratedPersonas = () => {
    setShowAiModal(false)
    setAiGeneratedPersonas([])
    setIsModalMinimized(false)
  }

  const togglePersonaSelection = (index) => {
    setAiGeneratedPersonas((prev) =>
      prev.map((persona, i) =>
        i === index ? { ...persona, selected: !persona.selected } : persona,
      ),
    )
  }

  const toggleAllPersonas = () => {
    const allSelected = aiGeneratedPersonas.every((persona) => persona.selected)
    setAiGeneratedPersonas((prev) =>
      prev.map((persona) => ({ ...persona, selected: !allSelected })),
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 w-full p-4">
      {showAiModal && (
        <GeneratedItemsModal
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedPersonas}
          generatedItems={aiGeneratedPersonas}
          toggleItemSelection={togglePersonaSelection}
          confirmGeneratedItems={confirmGeneratedPersonas}
          toggleAllItems={toggleAllPersonas}
        />
      )}
      {inspectionId && (
        <InvestCard
          itemCategory={'stories'}
          itemId={inspectionId}
          anchorEl={anchorEl}
          project={project}
          setProject={setProject}
          setInspectionId={setInspectionId}
        />
      )}
      <Button
        variant="secondary"
        onClick={addNewPersona}
        disabled={isSubmitting}
        className="xl:col-span-2 flex items-center justify-center w-full py-1 bg-card hover:bg-accent text-primary rounded-lg transition-colors shadow-md"
      >
        <Plus size={18} className="mr-2" />
        {isSubmitting ? 'Criando...' : 'Nova Persona'}
      </Button>

      {project.personas && project.personas.length > 0 ? (
        project.personas
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((persona) => {
            return (
              <PersonaCard
                key={persona.id}
                textareaRef={textareaRef}
                persona={persona}
                getFieldTitle={getFieldTitle}
                editingField={editingField}
                editingPersona={editingPersona}
                editValue={editValue}
                setEditValue={setEditValue}
                setEditPersonaName={setEditPersonaName}
                startEditField={startEditField}
                saveEditField={saveEditField}
                editPersonaName={editPersonaName}
                saveEditPersona={saveEditPersona}
                startEditPersona={startEditPersona}
                confirmDeleteItem={confirmDeleteItem}
                confirmDeletePersona={confirmDeletePersona}
                inspectPersona={inspectPersona}
                personaFieldVariants={personaFieldVariants}
                addNewItem={addNewItem}
              />
            )
          })
      ) : (
        <div className="col-span-1 flex flex-col items-center justify-center p-10 bg-muted/50 border-dashed border rounded-lg text-center">
          <UserCircle2 size={40} className="mb-4 text-primary" />
          <h3 className="text-xl font-semibold">Nenhuma persona definida</h3>
          <p className="text-muted-foreground mt-2">
            Crie sua primeira persona para mapear os usuários do seu projeto.
          </p>
        </div>
      )}

      <AlertDialog
        open={deleteConfirmPersona !== null}
        onOpenChange={() => setDeleteConfirmPersona(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              persona e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePersona}>
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteConfirmItem.personaId !== null}
        onOpenChange={() =>
          setDeleteConfirmItem({
            personaId: null,
            field: null,
            itemIndex: null,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem}>
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GenerateAIButton
        isGenerating={isGenerating}
        onClick={generatePersonas}
        // tooltip={tooltipInfo.aiGeneratedStory}
        className="xl:col-span-2"
      />
    </div>
  )
}

export default Personas
