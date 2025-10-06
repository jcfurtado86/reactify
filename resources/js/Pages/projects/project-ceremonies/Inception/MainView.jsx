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

const cardVariants = {
  primary: 'border-t-primary text-primary',
  destructive: 'border-t-destructive text-destructive',
  warning: 'border-t-orange-400 text-orange-400',
  success: 'border-t-emerald-500 text-emerald-500',
  info: 'border-t-cyan-500 text-cyan-500',
  secondary: 'border-t-rose-500 text-rose-500',
  accent: 'border-t-indigo-500 text-indigo-500',
  main: '',
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
        'bg-card rounded-lg border-t-4 transition-all duration-300 shadow-lg hover:shadow-xl h-full',
        col === 2 ? 'col-span-2' : '',
        expanded ? 'row-span-2' : '',
        isEditing ? 'ring-2 ring-ring' : '',
        variantClasses.split(' ')[0],
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Card Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <IconComponent
              size={20}
              className={cn('mr-2 flex-shrink-0', variantClasses.split(' ')[1])}
            />
            <h3 className="text-card-foreground font-bold text-lg m-0 truncate">
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
        <div className="flex-1 flex flex-col min-h-0 font-normal">
          <div className="text-muted-foreground text-sm text-left transition-all duration-300 flex-1">
            {isEditing ? (
              <div className="h-full">
                <TextareaAutosize
                  ref={textareaRef}
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full resize-none bg-background  text-sm text-foreground rounded-md p-3 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  disabled={isSaving}
                />
                <div className="text-xs text-muted-foreground/80 mt-2">
                  Ctrl+Enter to save • Esc to cancel
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
                    className="text-muted-foreground italic cursor-pointer hover:text-foreground/80 transition-colors py-8 text-center border-2 border-dashed border-border hover:border-border/80 rounded-lg"
                    onClick={() => setIsEditing(true)}
                  >
                    {placeholder}
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
                    Show more <ChevronDown size={14} className="ml-1" />
                  </>
                ) : (
                  <>
                    Show less <ChevronUp size={14} className="ml-1" />
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

  return (
    <div className="w-full text-foreground p-4">
      {/* Main Dashboard - Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ExpandableCard
          title="Problems"
          content={project?.product_canvas?.issues}
          variant="destructive"
          icon={AlertCircle}
          placeholder="What problems does this project solve?"
          onContentUpdate={(content) => updateProductCanvas('issues', content)}
        />
        <ExpandableCard
          title="Solutions"
          content={project?.product_canvas?.solutions}
          variant="warning"
          icon={CheckCircle}
          placeholder="How does the project solve the problems?"
          onContentUpdate={(content) =>
            updateProductCanvas('solutions', content)
          }
        />
        <ExpandableCard
          title="Involved Personas"
          content={project?.product_canvas?.personas}
          variant="accent"
          icon={Users}
          placeholder="Who are the main users?"
          onContentUpdate={(content) =>
            updateProductCanvas('personas', content)
          }
        />
        <ExpandableCard
          title="Restrictions"
          content={project?.product_canvas?.restrictions}
          variant="success"
          icon={Slash}
          placeholder="What are the project's limitations?"
          onContentUpdate={(content) =>
            updateProductCanvas('restrictions', content)
          }
        />
        <ExpandableCard
          title="Is"
          content={project?.product_canvas?.product_is}
          variant="info"
          icon={Check}
          placeholder="What this product IS..."
          onContentUpdate={(content) =>
            updateProductCanvas('product_is', content)
          }
        />
        <ExpandableCard
          title="Is Not"
          content={project?.product_canvas?.product_is_not}
          variant="secondary"
          icon={X}
          placeholder="What this product IS NOT..."
          onContentUpdate={(content) =>
            updateProductCanvas('product_is_not', content)
          }
        />
      </div>
    </div>
  )
}
export { ExpandableCard }
export default MainView
