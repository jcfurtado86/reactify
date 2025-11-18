import React, { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Settings, LoaderCircle, MousePointerClick, Trash2 } from 'lucide-react'
import ReactTextareaAutosize from 'react-textarea-autosize'

export function ProjectSettings({ project }) {
  const [isOpen, setIsOpen] = useState(false)

  // Usando o hook useForm do Inertia para gerenciar o formulário
  const { data, setData, patch, processing, errors, reset } = useForm({
    title: project.title || '',
    description: project.description || '',
    emoji: project.emoji || '',
  })

  // Efeito para resetar o formulário com os dados mais recentes
  // sempre que o sheet for aberto ou os dados do projeto mudarem.
  useEffect(() => {
    if (isOpen) {
      reset({
        title: project.title || '',
        description: project.description || '',
      })
    }
  }, [isOpen, project])

  // Função para lidar com o envio do formulário
  const handleSaveChanges = (e) => {
    e.preventDefault() // Previne o comportamento padrão de recarregar a página
    patch(route('project.update', project.id), {
      onSuccess: () => setIsOpen(false), // Fecha o sheet em caso de sucesso
      preserveScroll: true,
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="size-4" />
          <span className="sr-only">Configurações do Projeto</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[370px] sm:w-[450px] md:w-[470px]">
        <form onSubmit={handleSaveChanges}>
          <SheetHeader>
            <SheetTitle className="text-foreground">
              Configurações do Projeto
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Altere o nome e a descrição do seu projeto aqui. Clique em salvar
              quando terminar.
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-left">
                Título do Projeto
              </Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                className="text-foreground"
                disabled={processing}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="description">Emoji</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    {data.emoji || <MousePointerClick />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0">
                  <EmojiPicker
                    className="h-[342px]"
                    onEmojiSelect={({ emoji }) => {
                      setData('emoji', emoji)
                    }}
                  >
                    <EmojiPickerSearch />
                    <EmojiPickerContent />
                    <EmojiPickerFooter />
                  </EmojiPicker>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                title="Remover emoji"
                onClick={(e) => {
                  e.preventDefault()
                  setData('emoji', null)
                }}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-left">
                Descrição
              </Label>
              <ReactTextareaAutosize
                id="description"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                className="bg-transparent border-0  w-full rounded text-sm"
                disabled={processing}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
