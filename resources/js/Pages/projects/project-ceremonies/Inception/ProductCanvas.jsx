import { usePermissions } from '@/Context/PermissionContext'
import {
  AlertCircle,
  Users,
  Slash,
  CheckCircle,
  ChevronUp,
  PenLine as EditIcon,
  Save,
  Plus,
  Minus,
  Check,
  X,
  LoaderCircle,
  ChevronDown,
  ChevronsUp,
} from 'lucide-react'
import GenerateAIButton from '@/Components/GenerateAIButton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import TextareaAutosize from 'react-textarea-autosize'
import { router } from '@inertiajs/react'
import { tooltipInfo } from '@/lib/projectData'
import { usePage } from '@inertiajs/react'

const cardVariants = {
  destructive: 'border-t-destructive text-destructive',
  warning: 'border-t-orange-400 text-orange-400',
  chart_1: 'border-t-chart-1 text-chart-1',
  chart_2: 'border-t-chart-2 text-chart-2',
  chart_3: 'border-t-chart-3 text-chart-3',
  chart_4: 'border-t-chart-4 text-chart-4',
  chart_5: 'border-t-chart-5 text-chart-5',
  secondary: 'border-t-rose-500 text-rose-500',
  primary: 'border-t-primary text-primary',
  main: '',
}

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
            {!isModalMinimized && 'Definições Geradas por IA'}
            {isModalMinimized && 'Definições Geradas'}
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
              <span className="text-foreground font-medium text-lg">
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

            <div className="flex-1 overflow-y-auto px-6 min-h-0">
              <div className="space-y-2 pb-4">
                {generatedItems.map((item, index) => (
                  <div
                    key={'temp-' + index}
                    className={`rounded-lg p-3 border-2 transition-colors flex items-center gap-4 ${
                      item.selected
                        ? 'bg-muted border-primary'
                        : 'bg-muted/50 border-border hover:border-muted-foreground'
                    }`}
                  >
                    <label className="flex items-center justify-between cursor-pointer flex-1 gap-4 text-xs">
                      <Badge
                        variant="none"
                        className={`${Object.values(cardVariants)[index]}`}
                      >
                        {item.label}
                      </Badge>
                      <div className="flex items-center gap-2 flex-1 text-left">
                        {item.value}
                      </div>
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(index)}
                      />
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
                disabled={
                  Object.values(generatedItems).filter((j) => j.selected)
                    .length === 0
                }
              >
                <Check className="mr-2" size={16} />
                Confirmar e Adicionar (
                {Object.values(generatedItems).filter((j) => j.selected).length}
                )
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const ExpandableCard = ({
  title,
  content,
  className = '',
  variant = 'primary',
  icon: IconComponent = CheckCircle,
  col = 1,
  editable = true,
  defaultExpanded = false,
  onContentUpdate,
  placeholder = 'Click to add content...',
  maxLength = 2000, // Limite padrão seguro
  error = null,     // Mensagem de erro específica para este card
}) => {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editableContent, setEditableContent] = useState(content || '')
  const [isHovered, setIsHovered] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    setEditableContent(content || '')
  }, [content])

  useEffect(() => {
    if (error) {
      setIsEditing(true)
    }
  }, [error])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const length = editableContent.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editableContent.trim() === (content || '').trim()) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onContentUpdate(editableContent.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditableContent(content || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleCancel()
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const needsExpansion = typeof content === 'string' && content.length > 150
  const hasContent = content && content.trim().length > 0
  const variantClasses = cardVariants[variant] || cardVariants.primary

  return (
    <div
      className={cn(
        className,
        'bg-card rounded-lg border-t-4 transition-all duration-300 shadow-lg hover:shadow-xl h-full flex flex-col',
        col === 2 ? 'col-span-2' : '',
        expanded ? 'row-span-2' : '',
        // Visualmente indicamos erro na borda do card inteiro também
        error ? 'ring-2 ring-destructive' : (isEditing ? 'ring-2 ring-ring' : ''),
        variantClasses.split(' ')[0],
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Card Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center w-full">
            <IconComponent
              size={20}
              className={cn('mr-2 flex-shrink-0', variantClasses.split(' ')[1])}
            />
            <h3 className="text-card-foreground font-bold text-lg m-0 truncate w-full">
              {title}
            </h3>
          </div>
          {/* Action Buttons */}
          {editable && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-success hover:text-success/90 transition-colors disabled:opacity-50"
                    title="Save (Ctrl+Enter)"
                  >
                    <Save
                      size={16}
                      className={isSaving ? 'animate-pulse' : ''}
                    />
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="text-destructive hover:text-destructive/90 transition-colors disabled:opacity-50"
                    title="Cancel (Esc)"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors',
                    isHovered || !hasContent ? 'opacity-100' : 'opacity-0',
                  )}
                  title="Edit content"
                >
                  <EditIcon size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col min-h-0 font-normal relative">
          <div className="text-muted-foreground text-sm text-left transition-all duration-300 flex-1">
            {isEditing ? (
              <div className="h-full flex flex-col gap-1">
                <div className="relative w-full">
                    <TextareaAutosize
                    ref={textareaRef}
                    maxLength={maxLength} 
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={cn(
                        "w-full resize-none bg-background text-sm text-foreground rounded-md p-3 border transition-colors focus:outline-none focus:ring-1",
                        // Muda a cor da borda baseado no erro
                        error 
                        ? "border-destructive focus:border-destructive focus:ring-destructive" 
                        : "border-border focus:border-primary focus:ring-ring"
                    )}
                    disabled={isSaving}
                    />
                </div>
                
                {/* Rodapé do Editor: Erro e Contador */}
                <div className="flex justify-between items-start text-xs mt-1 min-h-[20px]">
                    <div className="flex-1 mr-2">
                        {error ? (
                             <span className="text-destructive font-medium animate-in fade-in slide-in-from-top-1 block">
                                {error}
                             </span>
                        ) : (
                            <span className="text-muted-foreground/80">
                                Ctrl+Enter to save
                            </span>
                        )}
                    </div>
                    
                    {/* Contador de Caracteres */}
                    <span className={cn(
                        "font-mono whitespace-nowrap transition-colors",
                        editableContent.length >= maxLength ? "text-destructive font-bold" : "text-muted-foreground"
                    )}>
                        {editableContent.length}/{maxLength}
                    </span>
                </div>
              </div>
            ) : (
              <>
                {hasContent ? (
                  <div
                    className={cn(
                      'whitespace-pre-wrap break-words leading-relaxed',
                      !expanded && needsExpansion && 'overflow-hidden',
                    )}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp:
                        !expanded && needsExpansion && !defaultExpanded
                          ? 4
                          : 'none',
                      WebkitBoxOrient: 'vertical',
                      overflow:
                        !expanded && needsExpansion ? 'hidden' : 'visible',
                    }}
                  >
                    {content}
                  </div>
                ) : (
                  <div
                    className={cn(
                        "text-muted-foreground italic cursor-pointer hover:text-foreground/80 transition-colors py-8 text-center border-2 border-dashed rounded-lg",
                        error ? "border-destructive/50 bg-destructive/5 text-destructive" : "border-border hover:border-border/80"
                    )}
                    onClick={() => setIsEditing(true)}
                  >
                    {error ? error : placeholder}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Expand Button */}
          {!isEditing && hasContent && needsExpansion && !defaultExpanded && (
            <div className="mt-3 pt-2 border-t border-border">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-end w-full transition-colors"
              >
                {!expanded ? (
                  <>
                    Mostrar mais <ChevronDown size={14} className="ml-1" />
                  </>
                ) : (
                  <>
                    Mostrar menos <ChevronUp size={14} className="ml-1" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MainView = ({ project = {}, setProject }) => {
  //ia states
  const [aiGeneratedProductCanvas, setAiGeneratedProductCanvas] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  const { errors } = usePage().props
  const { can } = usePermissions()
  const TEXT_LIMIT = 2000;
  
  const updateProductCanvas = async (prop, newContent) => {
    const productCanvasId = project.product_canvas.id
    if (!productCanvasId) return

    router.patch(
      route('product-canvas.update', productCanvasId),
      {
        [prop]: newContent,
      },
      {
        onSuccess: () => {
          setProject((prev) => ({
            ...prev,
            product_canvas: { ...prev.product_canvas, [prop]: newContent },
          }))
        },
      },
    )
  }

  const generateProductCanvas = async () => {
    setIsGenerating(true)
    setIsModalMinimized(false)

    try {
      const response = await axios.post(route('product-canvas.generate'), {
        project_id: project.id,
      })

      const data = response.data

      if (data.status === 'sucesso') {
        const productCanvasWithSelection = data.product_canvas.map(
          (canvas) => ({
            ...canvas,
            selected: true,
          }),
        )

        if (productCanvasWithSelection.length === 0) {
          toast.info('A IA não gerou sugestões para o Product Canvas.')
          return
        }

        setAiGeneratedProductCanvas(productCanvasWithSelection)
        setShowAiModal(true)
        toast.success(
          'Sugestões para o Product Canvas foram geradas com sucesso.',
        )
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
      console.error('Erro ao gerar Product Canvas:', error)
      toast.error(
        error.response?.data?.message ||
          'Não foi possível conectar ao servidor.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const confirmGeneratedProductCanvas = () => {
    const selectedProductCanvas = aiGeneratedProductCanvas.filter(
      (canvas) => canvas.selected,
    )
    const remainingProductCanvas = aiGeneratedProductCanvas.filter(
      (canvas) => !canvas.selected,
    )

    if (selectedProductCanvas.length === 0) {
      toast.warning('Selecione pelo menos um item para adicionar.')
      return
    }

    const productCanvasForBackend = selectedProductCanvas.reduce(
      (acc, currentItem) => {
        acc[currentItem.key] = currentItem.value
        return acc
      },
      {},
    )
    setProject((prevProject) => ({
      ...prevProject,
      product_canvas: prevProject?.product_canvas
        ? { ...prevProject.product_canvas, ...productCanvasForBackend }
        : productCanvasForBackend,
    }))

    console.log(selectedProductCanvas, productCanvasForBackend)
    const productCanvasId = project.product_canvas.id
    router.patch(
      route('product-canvas.update', productCanvasId),
      productCanvasForBackend,
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            `${selectedProductCanvas.length} item(s) adicionado(s) com sucesso!`,
          )
          setAiGeneratedProductCanvas(remainingProductCanvas)
          if (remainingProductCanvas.length === 0) {
            setShowAiModal(false)
            setIsModalMinimized(false)
          }
        },
        onError: (errors) => {
          toast.error('Ocorreu um erro ao salvar as goals.')
          console.error('Erro do backend:', errors)
        },
      },
    )
  }

  const cancelGeneratedtedProductCanvas = () => {
    setShowAiModal(false)
    setAiGeneratedProductCanvas([])
    setIsModalMinimized(false)
  }

  const toggleProductCanvasSelection = (index) => {
    setAiGeneratedProductCanvas((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item,
      ),
    )
  }

  const toggleAllProductCanvas = () => {
    const allSelected = aiGeneratedProductCanvas.every((item) => item.selected)
    setAiGeneratedProductCanvas((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected })),
    )
  }

  return (
    <div className="w-full text-foreground p-4">
      {showAiModal && (
        <GeneratedItemsModal
          isModalMinimized={isModalMinimized}
          changeModalState={() => setIsModalMinimized(!isModalMinimized)}
          cancelGeneratedItems={cancelGeneratedtedProductCanvas}
          generatedItems={aiGeneratedProductCanvas}
          toggleItemSelection={toggleProductCanvasSelection}
          confirmGeneratedItems={confirmGeneratedProductCanvas}
          toggleAllItems={toggleAllProductCanvas}
        />
      )}
      {/* Main Dashboard - Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
        <ExpandableCard
          editable={can('productCanvas.manage')}
          title="Problems"
          content={project?.product_canvas?.issues}
          variant="destructive"
          icon={AlertCircle}
          placeholder="What problems does this project solve?"
          onContentUpdate={(content) => updateProductCanvas('issues', content)}
          maxLength={TEXT_LIMIT}
          error={errors.issues}
        />
        <ExpandableCard
          editable={can('productCanvas.manage')}
          title="Solutions"
          content={project?.product_canvas?.solutions}
          variant="chart_1"
          icon={CheckCircle}
          placeholder="How does the project solve the problems?"
          onContentUpdate={(content) =>
            updateProductCanvas('solutions', content)
          }
          maxLength={TEXT_LIMIT}
          error={errors.solutions}
        />
        <ExpandableCard
          editable={can('productCanvas.manage')}
          title="Involved Personas"
          content={project?.product_canvas?.personas}
          variant="chart_2"
          icon={Users}
          placeholder="Who are the main users?"
          onContentUpdate={(content) =>
            updateProductCanvas('personas', content)
          }
          maxLength={TEXT_LIMIT}
          error={errors.personas}
        />
        <ExpandableCard
          editable={can('productCanvas.manage')}
          title="Restrictions"
          content={project?.product_canvas?.restrictions}
          variant="chart_3"
          icon={X}
          placeholder="What are the project's limitations?"
          onContentUpdate={(content) =>
            updateProductCanvas('restrictions', content)
          }
          maxLength={TEXT_LIMIT}
          error={errors.restrictions}
        />
        <ExpandableCard
          editable={can('productCanvas.manage')}
          title="Is"
          content={project?.product_canvas?.product_is}
          variant="chart_4"
          icon={Check}
          placeholder="What this product IS..."
          onContentUpdate={(content) =>
            updateProductCanvas('product_is', content)
          }
          maxLength={TEXT_LIMIT}
          error={errors.product_is}
        />
        <ExpandableCard
          editable={can('productCanvas.manage')}
          title="Is Not"
          content={project?.product_canvas?.product_is_not}
          variant="chart_5"
          icon={X}
          placeholder="What this product IS NOT..."
          onContentUpdate={(content) =>
            updateProductCanvas('product_is_not', content)
          }
          maxLength={TEXT_LIMIT}
          error={errors.product_is_not}
        />
      </div>
      {can('productCanvas.manage') && (
        <GenerateAIButton
          isGenerating={isGenerating}
          onClick={generateProductCanvas}
          tooltip={tooltipInfo.aiGeneratedProductCanvas}
          className="w-1/2"
        />
      )}
    </div>
  )
}
export { ExpandableCard }
export default MainView
