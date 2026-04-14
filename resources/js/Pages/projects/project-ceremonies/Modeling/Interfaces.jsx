import { useForm, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { Minus, Check, X, ChevronsUp, Network } from 'lucide-react'
import GenerateAIButton from '@/Components/GenerateAIButton'
import InvestCard from '../Inspection/InvestCard'
import { toast } from 'sonner'
import { tooltipInfo } from '@/lib/projectData'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { cn } from '@/lib/utils'
/**
 * Componente para gerenciar as interfaces de um projeto (criação e edição).
 *
 * @param {{ project: object }} props
 */

const GeneratedItemsModal = ({
  allClassModels,
  isModalMinimized,
  changeModalState,
  cancelGeneratedItems,
  generatedItems,
  toggleItemSelection,
  confirmGeneratedItems,
  toggleAllItems,
}) => {
  const { t } = useTranslation()
  const formatType = (type) => {
    if (!type) return 'Não definido'
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

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
            {!isModalMinimized && 'Interfaces por IA'}
            {isModalMinimized && 'Interfaces Geradas'}
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
                {t('ai_modal.selected_of', {
                  count: generatedItems.filter((item) => item.selected).length,
                  total: generatedItems.length,
                })}
              </span>
              <Button
                onClick={toggleAllItems}
                className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
              >
                {generatedItems.every((item) => item.selected)
                  ? t('common.deselect_all')
                  : t('common.select_all')}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              <div className="space-y-2 pb-4">
                {generatedItems.map((item, index) => {
                  const relatedIds = item.overall_model_class_ids || []
                  const idsToString =
                    relatedIds.length > 0 ? `C${relatedIds.join('-C')}` : ''
                  // Busca os dados completos das classes relacionadas usando a lista `allClassModels`
                  const relatedClasses = relatedIds
                    .map((id) =>
                      allClassModels.find((model) => model.id === id),
                    )
                    .filter(Boolean) // .filter(Boolean) remove quaisquer resultados nulos se um ID não for encontrado

                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg p-3 border-2 transition-colors ${
                        item.selected
                          ? 'bg-muted border-primary'
                          : 'bg-muted/50 border-border hover:border-muted-foreground'
                      }`}
                    >
                      {/* 1. CABEÇALHO DO CARD (imita o estilo da sua lista de 'story') */}
                      <label className="flex items-center justify-between cursor-pointer flex-1 gap-4 ">
                        {/* 2. DIVISÓRIA E CORPO DO CARD (sempre visível) */}
                        <section className="grid grid-cols-2 gap-3 w-full">
                          <div className="w-full col-span-2 border-b border-border text-lg text-foreground font-semibold text-left">
                            {item.title}
                          </div>
                          <div className="grid gap-1 text-left text-muted-foreground text-sm">
                            <p className="">{t('common.type')}: {formatType(item.type)}</p>
                            <p className="">{t('system_interfaces.input')}: {item.input}</p>
                            <p className="">{t('system_interfaces.output')}: {item.output}</p>
                            <p className="text-muted-foreground">
                              {t('system_interfaces.related_classes')}:
                            </p>
                          </div>
                          <div className="grid gap-1 w-full text-left text-muted-foreground text-sm">
                            {relatedClasses.map((classData) => (
                              <div
                                key={classData.id}
                                className="border p-3 rounded-lg bg-muted/50 flex items-center"
                              >
                                <h4 className="font-semibold text-sm">
                                  {/* Usando a propriedade 'name' como no seu código anterior */}
                                  {classData.id}: {classData.name}
                                </h4>
                              </div>
                            ))}
                          </div>
                        </section>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => toggleItemSelection(index)}
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
              <Button
                onClick={cancelGeneratedItems}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={confirmGeneratedItems}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center"
                disabled={generatedItems.filter((j) => j.selected).length === 0}
              >
                <Check className="mr-2" size={16} />
                {t('ai_modal.confirm_add_count', {
                  count: generatedItems.filter((j) => j.selected).length,
                })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const Interfaces = ({ project, setProject }) => {
  const { t } = useTranslation()
  // inspection states
  const [inspectionId, setInspectionId] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  // A lista de todas as classes disponíveis para o formulário.
  const allClassModels = project.overall_model_classes || []
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  //ia states
  const [aiGeneratedInterfaces, setAiGeneratedInterfaces] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)

  const MAX_LIMIT = 50
  const internalInterfaces =
    project?.system_interfaces?.filter((i) => i.type === 'internal') || []
  const externalInterfaces =
    project?.system_interfaces?.filter((i) => i.type === 'external') || []

  // Hook `useForm` do Inertia para gerenciar o estado completo do formulário.
  const {
    data,
    setData,
    post,
    patch,

    processing,
    errors,
    reset,
    clearErrors,
  } = useForm({
    id: null, // O 'id' diferencia se estamos criando (null) ou editando (number).
    title: '',
    type: 'internal',
    input: '',
    output: '',
    project_id: project.id,
    overall_model_class_ids: [],
  })

  // inspection function
  const inspectInterface = (interfaceId) => {
    if (inspectionId === interfaceId) {
      setInspectionId(null)
      setAnchorEl(null)
    } else {
      const element = document.querySelector(
        `[data-card-interface-id="${interfaceId}"]`,
      )
      setAnchorEl(element)
      setInspectionId(interfaceId)
    }
  }

  // Abre o dialog para criar uma NOVA interface.
  const handleOpenForCreate = () => {
    clearErrors()
    reset() // Limpa o formulário para os valores iniciais.
    setData('project_id', project.id)
    setIsDialogOpen(true)
  }

  // Abre o dialog para EDITAR uma interface existente.
  const handleOpenForEdit = (interfaceData) => {
    clearErrors()
    // Preenche o formulário com os dados do card que foi clicado.
    setData({
      id: interfaceData.id,
      title: interfaceData.title,
      type: interfaceData.type,
      input: interfaceData.input,
      output: interfaceData.output,
      project_id: project.id,
      overall_model_class_ids: interfaceData.overall_model_class_ids || [],
    })
    setIsDialogOpen(true)
  }

  // Lida com a seleção (check/uncheck) de classes no formulário.
  const handleMultiSelectChange = (selectedId) => {
    const currentIds = data.overall_model_class_ids
    const newIds = currentIds.includes(selectedId)
      ? currentIds.filter((id) => id !== selectedId)
      : [...currentIds, selectedId]
    setData('overall_model_class_ids', newIds)
  }

  // Submete o formulário, decidindo entre POST (criar) ou PUT (atualizar).
  const handleSubmit = (e) => {
    e.preventDefault()
    const onSuccess = () => setIsDialogOpen(false)

    if (data.id) {
      patch(route('system-interface.update', { interface: data.id }), {
        preserveScroll: true, // Mantém a posição do scroll na página após a resposta.
        onSuccess,
      })
      setProject((prevProject) => ({
        ...prevProject,
        system_interfaces: prevProject.system_interfaces.map((item) =>
          item.id === data.id ? data : item,
        ),
      }))
    } else {
      // MODO CRIAÇÃO: Envia uma requisição POST para a rota de store.
      post(route('system-interface.store'), {
        preserveScroll: true,
        onSuccess,
      })
      setProject((prevProject) => ({
        ...prevProject,
        system_interfaces: [...prevProject.system_interfaces, data],
      }))
    }
    setData({
      id: null, // O 'id' diferencia se estamos criando (null) ou editando (number).
      title: '',
      type: 'internal',
      input: '',
      output: '',
      project_id: project.id,
      overall_model_class_ids: [],
    })
  }

  const handleDelete = (interfaceData) => {
    if (!interfaceData.id) return

    router.delete(
      route('system-interface.destroy', { interface: interfaceData.id }),
      {
        preserveScroll: true,
      },
    )
  }

  const InterfaceCard = ({ data, onClick, onDelete, onInspect }) => {
    const [isHovered, setIsHovered] = useState(false)

    const relatedIds = data.overall_model_class_ids || []
    const idsToString = relatedIds.length > 0 ? `C${relatedIds.join('-C')}` : ''
    // Busca os dados completos das classes relacionadas usando a lista `allClassModels`
    const relatedClasses = relatedIds
      .map((id) => allClassModels.find((model) => model.id === id))
      .filter(Boolean) // .filter(Boolean) remove quaisquer resultados nulos se um ID não for encontrado
    return (
      <div
        className="relative group border border-border bg-card text-card-foreground rounded-lg shadow-md p-4 flex flex-col justify-between text-left transition-all duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* O componente com os botões de editar/excluir que aparece no hover */}
        <MotionDivOptions
          isHovered={isHovered}
          onDelete={onDelete}
          onInspect={onInspect}
        />

        {/* Área principal do card, que também pode ser usada para edição */}
        <div
          data-card-interface-id={data.id}
          className="cursor-pointer"
          onClick={() => onClick(data)}
        >
          <h4 className="font-bold text-sm mb-2">{data.title}</h4>
          <p>
            <span className="font-bold text-sm">{t('system_interfaces.input')}: </span>
            <span className="text-sm text-muted-foreground">{data.input}</span>
          </p>
          <p>
            <span className="font-bold text-sm">{t('system_interfaces.output')}: </span>
            <span className="text-sm text-muted-foreground">{data.output}</span>
          </p>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button
            variant="secondary"
            className="pointer-events-none text-xs size-8"
          >
            {data.id}
          </Button>
          {idsToString && (
            // MUDANÇA: Envolvemos o botão em um componente Dialog
            <Dialog>
              <DialogTrigger asChild>
                {/* MUDANÇA: O botão agora é clicável (removido pointer-events-none) */}
                <Button
                  variant="outline"
                  className="text-sm font-semibold h-8 z-10"
                >
                  {idsToString}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('system_interfaces.related_classes')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  {relatedClasses.map((classData) => (
                    <div
                      key={classData.id}
                      className="border p-3 rounded-lg bg-muted/50"
                    >
                      <h4 className="font-semibold text-sm">
                        {/* Usando a propriedade 'name' como no seu código anterior */}
                        {classData.id}: {classData.name}
                      </h4>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    )
  }

  const generateInterfaces = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('system-interface.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const interfacesWithSelection = data.system_interfaces.map((item) => ({
          ...item,
          selected: true,
        }))

        if (interfacesWithSelection.length === 0) {
          toast.info(t('system_interfaces.empty'))
          return
        }

        setAiGeneratedInterfaces(interfacesWithSelection)
        setShowAiModal(true)
        toast.success(
          `${interfacesWithSelection.length} interface(s) foram sugeridas.`,
        )
      } else {
        toast[data.status]
          ? toast[data.status](data.message)
          : toast.error(data.message)
      }
    } catch (error) {
      console.error('Erro ao gerar interfaces:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmGeneratedInterfaces = () => {
    const selectedInterfaces = aiGeneratedInterfaces.filter(
      (item) => item.selected,
    )
    const remainingInterfaces = aiGeneratedInterfaces.filter(
      (item) => !item.selected,
    )

    if (selectedInterfaces.length === 0) {
      toast.warning(t('common.select_at_least_one'))
      return
    }

    const interfacesForBackend = selectedInterfaces.map(
      ({ title, input, output, type, overall_model_class_ids }) => ({
        title,
        input,
        output,
        type,
        project_id: project.id, // Adiciona o project_id
        overall_model_class_ids,
      }),
    )

    router.post(
      route('system-interface.bulk-store'),
      { system_interfaces: interfacesForBackend },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedInterfaces.length} interface(s) adicionada(s) com sucesso!`,
          )
          setAiGeneratedInterfaces(remainingInterfaces)

          if (remainingInterfaces.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error(t('common.error'))
          console.error('Erro do backend:', errors)
        },
      },
    )
  }

  const cancelGeneratedInterfaces = () => {
    setShowAiModal(false)
    setAiGeneratedInterfaces([])
    setIsModalMinimized(false)
  }

  const toggleInterfaceSelection = (index) => {
    setAiGeneratedInterfaces((prev) =>
      prev.map((ai_interface, i) =>
        i === index
          ? { ...ai_interface, selected: !ai_interface.selected }
          : ai_interface,
      ),
    )
  }

  const toggleAllInterfaces = () => {
    const allSelected = aiGeneratedInterfaces.every(
      (ai_interface) => ai_interface.selected,
    )
    setAiGeneratedInterfaces((prev) =>
      prev.map((ai_interface) => ({ ...ai_interface, selected: !allSelected })),
    )
  }

  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="mx-auto gap-2">
        {showAiModal && (
          <GeneratedItemsModal
            allClassModels={allClassModels}
            isModalMinimized={isModalMinimized}
            changeModalState={() => setIsModalMinimized(!isModalMinimized)}
            cancelGeneratedItems={cancelGeneratedInterfaces}
            generatedItems={aiGeneratedInterfaces}
            toggleItemSelection={toggleInterfaceSelection}
            confirmGeneratedItems={confirmGeneratedInterfaces}
            toggleAllItems={toggleAllInterfaces}
          />
        )}
        {inspectionId && (
          <InvestCard
            itemCategory={'system_interfaces'}
            itemId={inspectionId}
            anchorEl={anchorEl}
            project={project}
            setProject={setProject}
            setInspectionId={setInspectionId}
          />
        )}
        {/* dialog for adding interface*/}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button variant="secondary" onClick={handleOpenForCreate}>
            {t('system_interfaces.add_interface')}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {data.id ? t('system_interfaces.edit_interface') : t('system_interfaces.add_new_interface')}
              </DialogTitle>
              <DialogDescription>
                {data.id
                  ? t('system_interfaces.form_description_update')
                  : t('system_interfaces.form_description_create')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-2 py-2 ">
                
                {/* --- TÍTULO --- */}
                <div className="grid grid-cols-5 items-start gap-4">
                  <Label htmlFor="title" className="text-right pt-2">
                    {t('common.title')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="col-span-4 flex flex-col gap-1">
                      <Input
                        id="title"
                        maxLength={MAX_LIMIT}
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className={cn(
                            (errors.title || !data.title.trim()) 
                                ? "border-destructive focus-visible:ring-destructive placeholder:text-destructive" 
                                : ""
                        )}
                      />
                      <div className="flex justify-between px-1">
                         <span className="text-[10px] text-destructive font-bold min-h-[15px] block">
                            {errors.title || (!data.title.trim() ? t('system_interfaces.title_required') : "")}
                         </span>
                         <span className={cn(
                             "text-[10px]",
                             data.title.length >= MAX_LIMIT ? "text-destructive font-bold" : "text-muted-foreground"
                         )}>
                            {data.title.length}/{MAX_LIMIT}
                         </span>
                      </div>
                  </div>
                </div>

                {/* --- TIPO --- */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    {t('common.type')}
                  </Label>
                  <Select
                    value={data.type}
                    onValueChange={(value) => setData('type', value)}
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder={t('common.select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">{t('system_interfaces.internal')}</SelectItem>
                      <SelectItem value="external">{t('system_interfaces.external')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* --- INPUT --- */}
                <div className="grid grid-cols-5 items-start gap-4">
                  <Label htmlFor="input" className="text-right pt-2">
                    {t('system_interfaces.input')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="col-span-4 flex flex-col gap-1">
                      <Input
                        id="input"
                        maxLength={MAX_LIMIT}
                        value={data.input}
                        onChange={(e) => setData('input', e.target.value)}
                        className={cn(
                            (errors.input || !data.input.trim()) 
                                ? "border-destructive focus-visible:ring-destructive placeholder:text-destructive" 
                                : ""
                        )}
                      />
                      <div className="flex justify-between px-1">
                         <span className="text-[10px] text-destructive font-bold min-h-[15px] block">
                            {errors.input || (!data.input.trim() ? t('system_interfaces.input_required') : "")}
                         </span>
                         <span className={cn(
                             "text-[10px]",
                             data.input.length >= MAX_LIMIT ? "text-destructive font-bold" : "text-muted-foreground"
                         )}>
                            {data.input.length}/{MAX_LIMIT}
                         </span>
                      </div>
                  </div>
                </div>

                {/* --- OUTPUT --- */}
                <div className="grid grid-cols-5 items-start gap-4">
                  <Label htmlFor="output" className="text-right pt-2">
                    {t('system_interfaces.output')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="col-span-4 flex flex-col gap-1">
                      <Input
                        id="output"
                        maxLength={MAX_LIMIT}
                        value={data.output}
                        onChange={(e) => setData('output', e.target.value)}
                        className={cn(
                            (errors.output || !data.output.trim()) 
                                ? "border-destructive focus-visible:ring-destructive placeholder:text-destructive" 
                                : ""
                        )}
                      />
                      <div className="flex justify-between px-1">
                         <span className="text-[10px] text-destructive font-bold min-h-[15px] block">
                            {errors.output || (!data.output.trim() ? t('system_interfaces.output_required') : "")}
                         </span>
                         <span className={cn(
                             "text-[10px]",
                             data.output.length >= MAX_LIMIT ? "text-destructive font-bold" : "text-muted-foreground"
                         )}>
                            {data.output.length}/{MAX_LIMIT}
                         </span>
                      </div>
                  </div>
                </div>

                {/* --- CLASSES RELACIONADAS --- */}
                {data.type === 'internal' && (
                  <div className="grid grid-cols-5 items-start gap-4">
                    <Label className="text-right pt-2">{t('overall_model.classes')}</Label>
                    <div className={cn(
                        "col-span-4 border rounded-md p-2",
                        data.overall_model_class_ids.length === 0 ? "border-destructive" : ""
                    )}>
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                          {allClassModels.map((model) => (
                            <div
                              key={model.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`rel-${model.id}`}
                                checked={data.overall_model_class_ids.includes(model.id)}
                                onCheckedChange={() => handleMultiSelectChange(model.id)}
                                className="form-checkbox h-4 w-4"
                              />
                              <label
                                htmlFor={`rel-${model.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {model.name}
                              </label>
                            </div>
                          ))}
                      </div>
                      {errors.overall_model_class_ids && (
                        <p className="mt-2 text-destructive text-xs">
                          {errors.overall_model_class_ids}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                    type="submit" 
                    disabled={
                        processing || 
                        !data.title.trim() || 
                        !data.input.trim() || 
                        !data.output.trim() ||
                        (data.type === 'internal' && data.overall_model_class_ids.length === 0)
                    }
                >
                  {processing ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex w-full gap-2">
        <section className="flex flex-col items-center gap-2 w-1/2">
          <h3 className="text-2xl font-bold mb-4">{t('system_interfaces.internal_title')}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* ADICIONADO: Verificação de Empty State para Internas */}
            {internalInterfaces.length > 0 ? (
              internalInterfaces.map((item) => (
                <InterfaceCard
                  key={`internal-${item.id}`}
                  data={item}
                  onDelete={() => handleDelete(item)}
                  onClick={() => handleOpenForEdit(item)}
                  onInspect={() => inspectInterface(item.id)}
                />
              ))
            ) : (
              <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[150px]">
                <Network
                  size={40}
                  className="mb-4 text-primary flex-shrink-0" // Adicionado flex-shrink-0
                  strokeWidth={1.5}
                />
                <p className="mb-2 font-medium text-foreground">
                  {t('system_interfaces.empty_internal')}
                </p>
                <p className="text-sm text-center max-w-xs">
                  {t('system_interfaces.empty_internal_hint')}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col items-center gap-2 border-l border-border pl-2 w-1/2">
          <h3 className="text-2xl font-bold mb-4">{t('system_interfaces.external_title')}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {externalInterfaces.length > 0 ? (
              externalInterfaces.map((item) => (
                <InterfaceCard
                  key={`external-${item.id}`}
                  data={item}
                  onDelete={() => handleDelete(item)}
                  onClick={() => handleOpenForEdit(item)}
                  onInspect={() => inspectInterface(item.id)}
                />
              ))
            ) : (
              <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-6 bg-card rounded-lg text-muted-foreground border-2 border-dashed border-border min-h-[150px]">
                <Network
                  size={40}
                  className="mb-4 text-primary flex-shrink-0" // Adicionado flex-shrink-0
                  strokeWidth={1.5}
                />
                <p className="mb-2 font-medium text-foreground">
                  {t('system_interfaces.empty_external')}
                </p>
                <p className="text-sm text-center max-w-xs">
                  {t('system_interfaces.empty_external_hint')}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      <GenerateAIButton
        isGenerating={isGenerating}
        onClick={generateInterfaces}
        tooltip={tooltipInfo.aiGeneratedInterface}
        className="md:col-span-2 w-1/2"
      />
    </div>
  )
}

export default Interfaces
