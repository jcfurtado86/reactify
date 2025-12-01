import { useForm, usePage } from '@inertiajs/react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
const ChangeRequestForm = ({ project, stories = [], onClose }) => {
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
          {/* Descrição com Limite e Contador */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex justify-between">
              <span>Descrição da Mudança</span>
            </Label>
            
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente a mudança solicitada..."
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
            {date ? format(date, 'PPP') : <span>Set deadline</span>}
          
            <div className="space-y-2">
              <Label htmlFor="requester_name">Solicitante (Pessoa ou Entidade)</Label>
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

          {/* Seleção de Stories */}
          {/* {stories.length > 0 && (
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
          )} */}

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
