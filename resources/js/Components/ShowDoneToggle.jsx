import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'

const ShowDoneToggle = ({ show, onToggle }) => {
  const { t } = useTranslation()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="text-xs text-muted-foreground gap-1.5"
    >
      {show ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      {show
        ? t('common.hide_done', 'Ocultar concluidas')
        : t('common.show_done', 'Mostrar concluidas')}
    </Button>
  )
}

export default ShowDoneToggle
