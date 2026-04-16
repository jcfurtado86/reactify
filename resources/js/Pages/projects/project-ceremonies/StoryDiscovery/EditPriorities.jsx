import { router, usePage } from '@inertiajs/react'
import { Trash2, Check, Bookmark, Info } from 'lucide-react'
import { darkenColor, PREDEFINED_COLORS, cn } from '@/lib/utils'
import { ColorOptions, ColorPickerPopover } from '@/Components/ColorComponents'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { usePermissionGate } from '@/lib/usePermissionGate'

const NAME_MAX = 30;

const PriorityEditPopover = ({ priority, children, setProject, project }) => {
  const { t } = useTranslation()
  const [name, setName] = useState(priority.name)
  const [color, setColor] = useState(priority.color)
  const [isProcessing, setIsProcessing] = useState(false)
  const { errors } = usePage().props

  const nameError = errors?.name; 
  
  function handleSubmit(e) {
    e.preventDefault()
    if (name === priority.name && color === priority.color) {
      toast.error(t('common.toast.no_changes'))
      return
    }

    setIsProcessing(true)

    const oldPriorities = project.matrix_priorities

    const newPriorities = oldPriorities.map((p) =>
      p.id === priority.id ? { ...p, name, color } : p,
    )
    setProject((prev) => ({ ...prev, matrix_priorities: newPriorities }))

    router.patch(
      route('matrix-priority.update', { priority: priority.id }),
      { name, color },
      {
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => {
          setProject((prev) => ({ ...prev, matrix_priorities: oldPriorities }))
          setName(priority.name)
          setColor(priority.color)

          if (errors.name) {
            toast.error(errors.name)
          } else if (errors.error) {
            toast.error(errors.error)
          } else {
            toast.error(t('edit_priorities.toast_update_error'))
          }
        },
        onFinish: () => {
          setIsProcessing(false)
        },
      },
    )
  }

  function handleDelete() {
    setIsProcessing(true)

    const oldPriorities = project.matrix_priorities

    const newPriorities = oldPriorities.filter((p) => p.id !== priority.id)
    setProject((prev) => ({ ...prev, matrix_priorities: newPriorities }))

    router.delete(route('matrix-priority.destroy', { priority: priority.id }), {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success(t('edit_priorities.toast_deleted'))
      },
      onError: (errors) => {
        setProject((prev) => ({ ...prev, matrix_priorities: oldPriorities }))
        toast.error(errors.error || t('edit_priorities.toast_delete_error'))
      },
      onFinish: () => {
        setIsProcessing(false)
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
             <div className="flex flex-col gap-1">
                <Input
                  value={name}
                  maxLength={NAME_MAX} // Bloqueio físico
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                      "pr-8",
                      nameError ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                  disabled={isProcessing}
                />
                 {/* Contador e Erro */}
                 <div className="flex justify-between items-center px-1">
                     <span className="text-xs text-destructive font-medium h-4 block">
                        {/* Mostra erro apenas se houver */}
                        {/* Para evitar mostrar erro em todos os popovers, 
                            o ideal seria limpar erros ao abrir/fechar, 
                            mas aqui mostramos se existir */}
                        {nameError} 
                     </span>
                     <span className={cn(
                         "text-[10px]",
                         (name.length || 0) >= NAME_MAX ? "text-destructive font-bold" : "text-muted-foreground"
                     )}>
                        {name.length}/{NAME_MAX}
                     </span>
                 </div>
             </div>
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
                <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('edit_priorities.confirm_delete_title')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('edit_priorities.confirm_delete_body')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? t('edit_priorities.deleting') : t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" className="w-full justify-start" disabled>
            <Bookmark className="mr-2 h-4 w-4" /> {t('edit_priorities.set_default')}
          </Button>
          <Separator />

          {/* Seletor de Cor */}
          <div className="p-2 space-y-1">
            <h4 className="font-medium text-sm">{t('color_components.title')}</h4>
            <ColorOptions handleColorSelect={setColor} selectedValue={color} />
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? t('common.saving') : t('project_settings.save_changes')}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

const EditPriorities = ({ project, setProject, priorities, projectId }) => {
  const { t } = useTranslation()
  const { allowed: canManage, reason: gateReason } = usePermissionGate('prioritizationMatrix.manage')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#ffffff')
  const [isStoring, setIsStoring] = useState(false)
  const [menuBottomPosition, setMenuBottomPosition] = useState('auto')

  const { errors } = usePage().props
  const nameError = errors?.name; // Erro de criação (geralmente vem na chave 'name')

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

    const tempId = `temp-${Date.now()}`
    const tempPriority = {
      id: tempId,
      order_column: project.matrix_priorities.length + 1,
      name: newName,
      color: newColor,
      project_id: projectId,
    }

    const oldPriorities = project.matrix_priorities

    setProject((prev) => ({
      ...prev,
      matrix_priorities: [...prev.matrix_priorities, tempPriority],
    }))
    setNewName('')
    setNewColor('#ffffff')

    router.post(
      route('matrix-priority.store'),
      { name: newName, color: newColor, project_id: projectId },
      {
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => {
          setProject((prev) => ({
            ...prev,
            matrix_priorities: oldPriorities,
          }))

          if (errors.name) {
            toast.error(errors.name)
          } else if (errors.error) {
            toast.error(errors.error)
          } else {
            toast.error(t('edit_priorities.toast_create_error'))
          }
        },
        onFinish: () => {
          setIsStoring(false)
        },
      },
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" disabled={!canManage} title={gateReason || ''}>{t('edit_priorities.edit_button')}</Button>
      </SheetTrigger>
      <SheetContent
        style={{
          top: `${menuBottomPosition}px`,
        }}
        className="top-auto bottom-0 overflow-y-auto" // A classe h-[85%] foi removida pois o style a substitui
      >
        <SheetHeader>
          <SheetTitle>{t('edit_priorities.manage_title')}</SheetTitle>
          <SheetDescription>
            {t('edit_priorities.manage_description')}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground px-1">
              {t('edit_priorities.existing')}
            </h4>
            {/* Mapeia as prioridades para botões que abrem o popover */}
            {priorities.map((p) => (
              <PriorityEditPopover
                key={p.id}
                priority={p}
                project={project}
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
              {t('edit_priorities.add_title')}
            </h4>
            <div className="flex items-end gap-2 mb-4">
              <div className="grid gap-1.5 flex-1">
                <div className="flex flex-col gap-1">
                <Input
                  id="new-name"
                  placeholder={t('edit_priorities.name_placeholder')}
                  maxLength={NAME_MAX} // Bloqueio físico
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={cn(
                      nameError ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                  disabled={isStoring}
                />
                {/* Contador e Erro */}
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-destructive font-medium min-h-[1rem]">
                      {nameError}
                    </span>
                    <span className={cn(
                        "text-[10px]",
                        (newName.length || 0) >= NAME_MAX ? "text-destructive font-bold" : "text-muted-foreground"
                    )}>
                      {newName.length}/{NAME_MAX}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <Label>{t('edit_priorities.color_label')}</Label>
                <ColorPickerPopover
                  value={newColor}
                  onChange={setNewColor}
                  disabled={isStoring}
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit" disabled={isStoring}>
                {isStoring ? t('edit_priorities.adding') : t('common.add')}
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default EditPriorities
