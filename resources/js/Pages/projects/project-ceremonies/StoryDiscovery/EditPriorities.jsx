import { router } from '@inertiajs/react'
import { Trash2, Check, Bookmark, Info } from 'lucide-react'
import { darkenColor, PREDEFINED_COLORS } from '@/lib/utils'
import { ColorOptions, ColorPickerPopover } from '@/Components/ColorComponents'

const PriorityEditPopover = ({ priority, children, setProject }) => {
  const [name, setName] = useState(priority.name)
  const [color, setColor] = useState(priority.color)
  const [isProcessing, setIsProcessing] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setIsProcessing(true)
    router.patch(
      route('matrix-priority.update', { priority: priority.id }),
      { name, color },
      {
        preserveScroll: true,
        onFinish: () => setIsProcessing(false),
      },
    )
  }

  function handleDelete() {
    setIsProcessing(true)
    router.delete(route('matrix-priority.destroy', { priority: priority.id }), {
      preserveScroll: true,
      onFinish: () => {
        setIsProcessing(false)
        setProject((prev) => ({
          ...prev,
          matrix_priorities: prev.matrix_priorities.filter(
            (p) => p.id !== priority.id,
          ),
        }))
      },
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Campo de edição de nome */}
          <div className="relative">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pr-8"
              disabled={isProcessing}
            />
            <Info className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Ações */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                type="button"
                className="w-full justify-start text-red-500 hover:text-red-500"
                disabled={isProcessing}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Tem certeza que deseja excluir?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Isso excluirá permanentemente
                  a prioridade.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" className="w-full justify-start" disabled>
            <Bookmark className="mr-2 h-4 w-4" /> Definir como padrão
          </Button>
          <Separator />

          {/* Seletor de Cor */}
          <div className="p-2 space-y-1">
            <h4 className="font-medium text-sm">Cores</h4>
            <ColorOptions handleColorSelect={setColor} selectedValue={color} />
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing}>
            Salvar Alterações
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

const EditPriorities = ({ project, setProject, priorities, projectId }) => {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#ffffff')
  const [isStoring, setIsStoring] = useState(false)
  const [menuBottomPosition, setMenuBottomPosition] = useState('auto')

  useEffect(() => {
    // Função para medir e definir a posição
    const measurePosition = () => {
      const element = document.getElementById('tab-menu')
      if (element) {
        // Usa getBoundingClientRect() para obter a posição relativa à viewport
        const rect = element.getBoundingClientRect()

        // a propriedade 'bottom' nos dá a posição exata da borda inferior
        setMenuBottomPosition(rect.bottom)
      }
    }

    // Mede a posição assim que o componente é montado
    measurePosition()

    window.addEventListener('resize', measurePosition)
    window.addEventListener('scroll', measurePosition)

    // funcao de limpeza
    return () => {
      window.removeEventListener('resize', measurePosition)
      window.removeEventListener('scroll', measurePosition)
    }
  }, [])
  function handleStore(e) {
    e.preventDefault()
    setIsStoring(true)
    router.post(
      route('matrix-priority.store'),
      { name: newName, color: newColor, project_id: projectId },
      {
        preserveScroll: true,
        onSuccess: () => {
          setNewName('')
          setNewColor('#ffffff')
          setProject((prev) => ({
            ...prev,
            matrix_priorities: [
              ...prev.matrix_priorities,
              {
                id: `temp-${new Date().getTime()}`,
                order_column: prev.matrix_priorities.length + 1,
                name: newName,
                color: newColor,
                project_id: projectId,
              },
            ],
          }))
        },
        onFinish: () => setIsStoring(false),
      },
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Editar Prioridades</Button>
      </SheetTrigger>
      <SheetContent
        style={{
          top: `${menuBottomPosition}px`,
        }}
        className="top-auto bottom-0 overflow-y-auto" // A classe h-[85%] foi removida pois o style a substitui
      >
        <SheetHeader>
          <SheetTitle>Gerenciar Prioridades da Matriz</SheetTitle>
          <SheetDescription>
            Adicione, edite ou remova as prioridades que são usadas em todos os
            projetos.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground px-1">
              Prioridades Existentes
            </h4>
            {/* Mapeia as prioridades para botões que abrem o popover */}
            {priorities.map((p) => (
              <PriorityEditPopover
                key={p.id}
                priority={p}
                setProject={setProject}
              >
                <Button
                  style={{
                    '--priority-color': darkenColor(p.color, 0.3),
                    '--priority-color-hover': darkenColor(p.color, 0.5),
                  }}
                  variant="ghost"
                  className={`w-full justify-start h-7 text-slate-100 bg-[var(--priority-color)] hover:bg-[var(--priority-color-hover)]`}
                >
                  <div
                    className="size-3 rounded-full mr-2"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </Button>
              </PriorityEditPopover>
            ))}
          </div>

          <Separator />

          {/* Formulário para adicionar nova prioridade (sem alterações) */}
          <form onSubmit={handleStore} className="gap-4">
            <h4 className="font-medium text-foreground">
              Adicionar Prioridade
            </h4>
            <div className="flex items-end gap-2 mb-4">
              <div className="grid gap-1.5 flex-1">
                <Input
                  id="new-name"
                  placeholder="Digite o nome da prioridade"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isStoring}
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <Label>Cor</Label>
                <ColorPickerPopover
                  value={newColor}
                  onChange={setNewColor}
                  disabled={isStoring}
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit" disabled={isStoring}>
                Adicionar
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default EditPriorities
