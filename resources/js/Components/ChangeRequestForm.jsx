import { useForm } from '@inertiajs/react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
const ChangeRequestForm = ({ project, stories = [], onClose }) => {
  const [selectedStories, setSelectedStories] = useState({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const { data, setData, post, processing, errors, reset } = useForm({
    project_id: project.id,
    description: '',
    effort: '',
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

    const formData = {
      ...data,
      stories: Object.entries(selectedStories).map(([storyId, impactType]) => ({
        story_id: parseInt(storyId),
        impact_type: impactType,
      })),
    }

    post(route('change-request.store'), {
      data: formData,
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
        <CardTitle>Nova Solicitação de Mudança</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição da Mudança *</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente a mudança solicitada..."
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              required
              rows={4}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Data da Solicitação */}
          <div className="space-y-2">
            <Button
              variant={'outline'}
              className={cn(
                ' justify-start text-left font-normal',
                !date && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Set deadline</span>}
            </Button>
            {/* <Label htmlFor="request_date">Data da Solicitação *</Label>
            <Input
              id="request_date"
              type="date"
              value={data.request_date}
              onChange={(e) => setData('request_date', e.target.value)}
              required
            />
            {errors.request_date && (
              <p className="text-red-500 text-sm">{errors.request_date}</p>
            )}*/}
          </div>

          {/* Seleção de Stories */}
          {stories.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                User Stories Relacionadas
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2  overflow-y-auto  rounded p-2">
                {stories.map((story) => {
                  const selectedVariant = storyVariants[story.type] || '#f97316'
                  const realStoryId = story.epic_id
                    ? `${story.epic_id}.${story.epic_index || 0}`
                    : `${story.id}`
                  return (
                    <div
                      key={story.id}
                      className="space-y-2 p-2 border border-border rounded text-sm"
                    >
                      <Badge
                        style={{ backgroundColor: selectedVariant }}
                        variant="badge"
                      >
                        {`${story.type === 'system' ? 'SS' : 'US'}${realStoryId}`.toUpperCase()}
                      </Badge>
                      <p className="text-left">{story?.title}</p>
                      <div
                        className="flex gap-2


                      "
                      >
                        <label className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedStories[story.id] === 'IMPACTADA'}
                            onCheckedChange={(checked) =>
                              handleStorySelection(
                                story.id,
                                'IMPACTADA',
                                checked,
                              )
                            }
                          />
                          <span>Impactada</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedStories[story.id] === 'NOVA'}
                            onCheckedChange={(checked) =>
                              handleStorySelection(story.id, 'NOVA', checked)
                            }
                          />
                          <span>Nova</span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={processing} className="flex-1">
              {processing ? 'Enviando...' : 'Criar Solicitação'}
            </Button>

            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={processing}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangeRequestForm
