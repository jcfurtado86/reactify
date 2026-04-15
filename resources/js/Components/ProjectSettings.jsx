import React, { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Settings, LoaderCircle, MousePointerClick, Trash2 } from 'lucide-react'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'
import ReactTextareaAutosize from 'react-textarea-autosize'
import { useTranslation } from 'react-i18next'
import { toastSuccess, toastApiError } from '@/lib/toastHelpers'

export function ProjectSettings({ project }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  // Usando o hook useForm do Inertia para gerenciar o formulário
  const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({
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
        emoji: project.emoji || '',
      })
      // Limpa erros residuais ao reabrir o modal
      clearErrors()
    }
  }, [isOpen, project])

  // Função para lidar com o envio do formulário
  const handleSaveChanges = (e) => {
    e.preventDefault()
    patch(route('project.update', project.id), {
      preserveScroll: true,
      onSuccess: () => {
        toastSuccess('project_settings.toast_saved')
        setIsOpen(false)
      },
      onError: (err) => toastApiError(err, 'common.toast.error_save'),
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <ButtonWithTooltip
          variant="secondary"
          size="icon"
          tooltipContent={t('project_settings.title')}
          side="bottom"
        >
          <Settings className="size-4" />
          <span className="sr-only">{t('project_settings.title')}</span>
        </ButtonWithTooltip>
      </SheetTrigger>
      <SheetContent className="w-[370px] sm:w-[450px] md:w-[470px]">
        <form onSubmit={handleSaveChanges}>
          <SheetHeader>
            <SheetTitle className="text-foreground">
              {t('project_settings.title')}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {t('project_settings.description_helper')}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="title" className="text-left">
                  {t('project_settings.project_title')}
                </Label>
                {/* Contador de caracteres (limite 50) */}
                <span className="text-xs text-muted-foreground">
                  {data.title.length}/50
                </span>
              </div>

              <Input
                id="title"
                value={data.title}
                maxLength={50} 
                onChange={(e) => {
                  setData('title', e.target.value)
                  if (errors.title) clearErrors('title') 
                }}
                className={`text-foreground ${errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                disabled={processing}
              />
              
              {errors.title && (
                <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="description">{t('home.project_emoji')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className={errors.emoji ? 'border-destructive' : ''}>
                    {data.emoji || <MousePointerClick />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0">
                  <EmojiPicker
                    className="h-[342px]"
                    onEmojiSelect={({ emoji }) => {
                      setData('emoji', emoji)
                      if (errors.emoji) clearErrors('emoji')
                    }}
                  >
                    <EmojiPickerSearch />
                    <EmojiPickerContent />
                    <EmojiPickerFooter />
                  </EmojiPicker>
                </PopoverContent>
              </Popover>
              <ButtonWithTooltip
                variant="outline"
                size="icon"
                tooltipContent={t('home.remove_emoji')}
                onClick={(e) => {
                  e.preventDefault()
                  setData('emoji', null)
                }}
              >
                <Trash2 />
              </ButtonWithTooltip>
            </div>
             {errors.emoji && (
                <p className="text-sm text-destructive">{errors.emoji}</p>
              )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description" className="text-left">
                  {t('common.description')}
                </Label>
                {/* Contador de caracteres (limite 1000) */}
                <span className="text-xs text-muted-foreground">
                  {data.description.length}/1000
                </span>
              </div>
              
              <ReactTextareaAutosize
                id="description"
                maxLength={1000}
                value={data.description}
                onChange={(e) => {
                  setData('description', e.target.value)
                  if (errors.description) clearErrors('description')
                }}
                className={`w-full rounded text-sm bg-transparent transition-colors disabled:opacity-50 resize-none
                  ${errors.description 
                    ? 'border border-destructive focus:outline-none p-2' 
                    : 'border-0 focus:ring-0 px-0' 
                  }`}
                placeholder={t('project_settings.describe_placeholder')}
                disabled={processing}
                minRows={3}
              />
              
              {errors.description && (
                <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                {t('common.cancel')}
              </Button>
            </SheetClose>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('project_settings.save_changes')
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
