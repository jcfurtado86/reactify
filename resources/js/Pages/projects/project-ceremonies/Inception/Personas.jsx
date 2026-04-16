import { usePermissions } from '@/Context/PermissionContext'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Edit,
  Trash,
  UserCircle2,
} from 'lucide-react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { toastSuccess, toastApiError } from '@/lib/toastHelpers'
import MotionDivOptions from '@/Components/MotionDivOptions'
import TextareaAutosize from 'react-textarea-autosize'
import GenerateAIButton from '@/Components/GenerateAIButton'
import AiGeneratedBadge from '@/Components/AiGeneratedBadge'
import { useTooltipInfo } from '@/lib/projectData'
import { inspectionStatus } from '@/lib/utils'
import StatusBadge from '@/Components/StatusBadge'
import { usePage } from '@inertiajs/react' 
import { cn } from '@/lib/utils' 

const NAME_MAX = 50; 

const PersonaCard = ({
  persona,
  project,
  disabled = false,
  addNewItem,
  editingPersona,
  saveEditField,
  editPersonaName,
  saveEditPersona,
  startEditPersona,
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
  errors
}) => {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const status = inspectionStatus(persona)

  const nameError = errors?.name;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value={persona.id}
        className="group relative col-span-1 bg-card border-0 animate-fade-in rounded"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AccordionTrigger
          data-card-id={persona.id}
          className="p-4 hover:no-underline flex-row items-center justify-between"
        >
          <div className="flex items-center gap-3 w-full">
            <UserCircle2 className=" shrink-0 size-8 text-primary" />
            
            {editingPersona === persona.id ? (
              <div className="flex flex-col w-full max-w-[300px]" onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="text"
                    value={editPersonaName}
                    maxLength={NAME_MAX} // Bloqueio físico
                    onChange={(e) => setEditPersonaName(e.target.value)}
                    onKeyUp={(e) => {
                      if (e.key === 'Enter') saveEditPersona()
                    }}
                    className={cn(
                        "!text-xl font-bold h-10",
                        (nameError || !editPersonaName.trim()) ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                    autoFocus
                  />
                   {/* Contador e Erro do Nome */}
                   <div className="flex justify-between mt-1 px-1">
                      <span className="text-xs text-destructive font-medium h-4 block">
                          {nameError || (!editPersonaName.trim() ? "O nome é obrigatório" : "")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                          {editPersonaName.length}/{NAME_MAX}
                      </span>
                   </div>
              </div>
            ) : (
              <CardTitle className="ml-3 text-xl">{persona.name}</CardTitle>
            )}
            <StatusBadge status={status} />
            <AiGeneratedBadge
              item={persona}
              type="personas"
              onDiscard={() => confirmDeletePersona(persona.id)}
            />
          </div>
        </AccordionTrigger>
        <AccordionContent className="persona grid grid-cols-1 md:grid-cols-2 p-2 gap-2">
          {persona.stories && persona.stories.length > 0 && (
            <div className="col-span-1 md:col-span-2 flex flex-wrap items-center gap-2 px-2 py-1">
              <span className="text-xs text-muted-foreground font-medium">
                {t('personas.linked_stories', 'Stories vinculadas:')}
              </span>
              {persona.stories.map((s) => {
                const storyVariants = project?.system_colors?.stories || {}
                const color = storyVariants[s.type] || '#f97316'
                const label = `${s.type === 'system' ? 'SS' : 'US'}${s.id}`
                return (
                  <Badge
                    key={s.id}
                    style={{ backgroundColor: color }}
                    className="text-[10px] text-black font-bold cursor-pointer hover:opacity-80 border-transparent"
                    title={s.title}
                    onClick={() => router.get(route('project.ceremony.show', {
                      project: persona.project_id, ceremony: 'storyDiscovery',
                    }), { artifact: 'stories', scrollTo: s.id })}
                  >
                    {label}
                  </Badge>
                )
              })}
            </div>
          )}
          {['profile', 'expectations', 'goals'].map((field) => (
            <div
              key={field}
              className="flex flex-col gap-2 p-2 rounded-lg bg-card border-border border-2"
            >
              <div className="flex items-center justify-between">
                <h4
                  className={`font-semibold text-sm ${personaFieldVariants[field].text}`}
                >
                  {getFieldTitle(field)}
                </h4>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => addNewItem(persona.id, field)}
                  >
                    <Plus className="size-4" />
                  </Button>
                )}
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                {persona[field].map((item, itemIndex) => (
                  <PersonaItem
                    key={itemIndex}
                    item={item}
                    disabled={disabled}
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
                    error={errors?.[`${field}.${itemIndex}`]}
                  />
                ))}
              </div>
            </div>
          ))}
        </AccordionContent>
        <MotionDivOptions slot="persona.manage"
          disabled={disabled}
          isHovered={isHovered}
          onEdit={() => startEditPersona(persona.id)}
          onDelete={() => confirmDeletePersona(persona.id)}
        />
      </AccordionItem>
    </Accordion>
  )
}
const PersonaItem = ({
  item,
  disabled = false,
  isEditing,
  editValue,
  onValueChange,
  onEdit,
  onSave,
  onDelete,
  textareaRef,
  error
}) => {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const ITEM_MAX = 255;

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
      className={cn(
        "group relative flex min-h-[40px] items-start justify-between rounded p-2 transition-colors font-normal cursor-default",
        isEditing ? "" : "hover:bg-muted/50",
        error ? "bg-destructive/10" : ""
      )}
    >
      {isEditing ? (
        <div className="flex w-full items-center gap-2">
          <TextareaAutosize
            ref={textareaRef}
            maxLength={ITEM_MAX}
            value={editValue || ''}
            onChange={onValueChange}
            onKeyDown={handleKeyDown}
            className={cn(
                "bg-transparent w-full rounded text-sm resize-none focus:outline-none p-1 border border-transparent focus:border-input focus:bg-background",
                (error || !editValue?.trim()) ? "border-destructive focus:border-destructive" : ""
            )}
            autoFocus
          />
          <div className="flex justify-between items-center px-1">
             <span className="text-xs text-destructive font-medium min-h-[1rem]">
                {error || (!editValue?.trim() ? "O item não pode ser vazio" : "")}
             </span>
             <span className={cn(
                 "text-[10px]",
                 (editValue?.length || 0) >= ITEM_MAX ? "text-destructive font-bold" : "text-muted-foreground"
             )}>
                {(editValue?.length || 0)}/{ITEM_MAX}
             </span>
          </div>
        </div>
      ) : (
        <p
          className={cn(
            "text-sm text-muted-foreground text-left pr-4 break-words whitespace-pre-wrap flex-1 min-w-0",
            !item ? 'italic text-muted-foreground/50' : ''
          )}
        >
          {item || t('personas.click_to_add')}
        </p>
      )}

      <MotionDivOptions slot="persona.manage"
        disabled={disabled}
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
  const { t } = useTranslation()
  const tooltipInfo = useTooltipInfo()
  const textareaRef = useRef(null)
  const [editingField, setEditingField] = useState({
    personaId: null,
    field: null,
    itemIndex: null,
  })
  const { can } = usePermissions()
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
  const { errors } = usePage().props

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
      name: t('personas.default_name'),
      profile: [],
      expectations: [],
      goals: [],
      project_id: project.id,
    }

    router.post('/persona', newPersona, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        toastSuccess('personas.toast_added')
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
        toastApiError(errors, 'common.toast.error_save')
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

    router.patch(
      route('persona.update', personaId),
      {
        name: editPersonaName,
      },
      { preserveScroll: true, preserveState: true },
    )
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

    router.patch(
      route('persona.update', personaId),
      {
        // ...persona,
        [field]: updatedArray,
        project_id: project.id,
      },
      { preserveScroll: true, preserveState: true },
    )
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

    router.patch(
      route('persona.update', personaId),
      {
        // ...persona,
        [field]: updatedArray,
        project_id: project.id,
      },
      { preserveScroll: true, preserveState: true },
    )
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

    router.delete(route('persona.delete', deleteConfirmPersona), {
      preserveScroll: true,
      preserveState: true,
    })
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

    router.patch(
      route('persona.update', personaId),
      {
        // ...persona,
        [field]: updatedArray,
        project_id: project.id,
      },
      { preserveScroll: true, preserveState: true },
    )
  }

  const getFieldTitle = (field) => {
    switch (field) {
      case 'profile':
        return t('personas.profile')
      case 'expectations':
        return t('personas.expectations')
      case 'goals':
        return t('personas.goals')
      default:
        return field
    }
  }

  const generatePersonas = async () => {
    try {
      const response = await axios.post(route('persona.generate'), {
        project_id: project.id,
      })
      if (response.status === 202) {
        toast.info(
          t('ai.generation_queued', 'Geração na fila. Vai aparecer na tela quando ficar pronta.'),
        )
        router.reload({ only: ['pending_generations'] })
      } else if (response.data?.status === 'warning') {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Erro ao gerar personas:', error)
      toast.error(
        error.response?.data?.message || t('ai_errors.server_error'),
      )
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 w-full p-4">
      {project.personas && project.personas.length > 0 ? (
        project.personas
          .sort((a, b) => a.id - b.id)
          .map((persona) => {
            return (
              <PersonaCard
                key={persona.id}
                textareaRef={textareaRef}
                persona={persona}
                project={project}
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
                personaFieldVariants={personaFieldVariants}
                addNewItem={addNewItem}
                disabled={!can('persona.manage')}
                errors={errors}
              />
            )
          })
      ) : (
        <div className="col-span-1 xl:col-span-2 flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border">
          <UserCircle2 size={40} className="mb-4 text-primary" />
          <p className="mb-2 font-medium text-foreground">
            {t('personas.empty_title')}
          </p>
          <p className="mb-4 text-sm text-center max-w-xs">
            {t('personas.empty_hint')}
          </p>
        </div>
      )}

      {can('persona.manage') && (
        <>
          <Button
            variant="secondary"
            onClick={addNewPersona}
            disabled={isSubmitting}
            className="xl:col-span-2 flex "
          >
            <Plus size={18} className="mr-2" />
            {isSubmitting ? t('common.processing') : t('personas.new')}
          </Button>
          <GenerateAIButton
            type="personas"
            onClick={generatePersonas}
            tooltip={tooltipInfo.aiGeneratedPersonas}
            className="xl:col-span-2"
          />
        </>
      )}

      <AlertDialog
        open={deleteConfirmPersona !== null}
        onOpenChange={() => setDeleteConfirmPersona(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('personas.confirm_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('personas.confirm_delete_body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePersona}>
              {t('personas.confirm_delete_action')}
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
            <AlertDialogTitle>{t('personas.confirm_delete_item_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('personas.confirm_delete_item_body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem}>
              {t('personas.confirm_delete_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Personas
