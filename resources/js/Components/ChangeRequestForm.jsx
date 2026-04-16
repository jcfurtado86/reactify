import { useForm, usePage, router } from '@inertiajs/react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn, currentDateFnsLocale } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from 'react-i18next'
const ChangeRequestForm = ({ project, stories = [], onClose }) => {
  const { t } = useTranslation()
  const [selectedStories, setSelectedStories] = useState({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const { auth } = usePage().props
  const MAX_DESCRIPTION_CHARS = 1000
  const { data, setData, post, processing, errors, reset } = useForm({
    project_id: project.id,
    requester_name: auth?.user?.name || '',
    description: '',
    // effort: '',
    request_date: new Date().toISOString().split('T')[0],
    impacted_stories: [],
    new_stories: [],
  })
  const storyVariants = project.system_colors?.stories || {}
  const handleStorySelection = (storyId, impactType, checked) => {
    setSelectedStories((prev) => {
      const updated = { ...prev }
      if (checked) {
        updated[storyId] = impactType
      } else {
        delete updated[storyId]
      }
      return updated
    })

    // Atualizar os dados do formulário
    const impacted = []
    const newStories = []

    Object.entries({
      ...selectedStories,
      [storyId]: checked ? impactType : undefined,
    }).forEach(([id, type]) => {
      if (type === 'IMPACTADA') {
        impacted.push(id)
      } else if (type === 'NOVA') {
        newStories.push(id)
      }
    })

    setData((prev) => ({
      ...prev,
      impacted_stories: impacted,
      new_stories: newStories,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const storyIds = Object.keys(selectedStories).map((id) => parseInt(id))

    router.post(route('change-request.store'), {
      ...data,
      story_ids: storyIds,
    }, {
      onSuccess: () => {
        reset()
        setSelectedStories({})
        if (onClose) onClose()
      },
    })
  }

  return (
    <Card className="w-full max-w-4xl ">
      <CardHeader>
        <CardTitle>{t('change_log.new_request_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description" className="flex justify-between">
              <span>{t('change_request.description')}</span>
            </Label>

            <Textarea
              id="description"
              placeholder={t('change_request.description')}
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              required
              maxLength={MAX_DESCRIPTION_CHARS} // Impede digitar além do limite
              rows={4}
            />
            
            {/* Contador de 'Restam X caracteres' no canto inferior direito */}
            <div className="flex justify-end">
              <span className={cn(
                "text-xs font-normal",
                data.description.length >= MAX_DESCRIPTION_CHARS ? "text-red-500" : "text-muted-foreground"
              )}>
                {data.description.length} / {MAX_DESCRIPTION_CHARS}
              </span>
            </div>

            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Data da Solicitação */}
          <div className="space-y-2">
          
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP', { locale: currentDateFnsLocale() }) : <span>{t('change_request.set_deadline')}</span>}

            <div className="space-y-2">
              <Label htmlFor="requester_name">{t('change_request.requester')}</Label>
                <Input
                    id="requester_name"
                    value={data.requester_name}
                    onChange={(e) => setData('requester_name', e.target.value)}
                    required
                    disabled
                />
                {errors.requester_name && <p className="text-red-500 text-sm">{errors.requester_name}</p>}
            </div>
          </div>

          {stories.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {t('change_request.related_stories', 'Stories impactadas')}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto rounded p-2">
                {stories.map((story) => {
                  const selectedVariant = storyVariants[story.type] || '#f97316'
                  const realStoryId = story.epic_id
                    ? `${story.epic_id}.${story.epic_index || 0}`
                    : `${story.id}`
                  return (
                    <label
                      key={story.id}
                      className="flex items-start gap-2 p-2 border border-border rounded text-sm cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={!!selectedStories[story.id]}
                        onCheckedChange={(checked) =>
                          handleStorySelection(story.id, 'IMPACTADA', checked)
                        }
                      />
                      <div className="flex flex-col gap-1">
                        <Badge
                          style={{ backgroundColor: selectedVariant }}
                          variant="badge"
                          className="w-fit"
                        >
                          {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`.toUpperCase()}
                        </Badge>
                        <span className="text-left text-foreground">{story?.title}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={processing} className="flex-1">
              {processing ? t('common.processing') : t('change_log.new_request')}
            </Button>

            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={processing}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangeRequestForm
