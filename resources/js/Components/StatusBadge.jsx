import { X, Check, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SpanButton from './SpanButton'
const StatusBadge = ({ status }) => {
  const { t } = useTranslation()
  let message = ''
  let element = null

  switch (status) {
    case 'validated':
      message = t('status_badge.criteria_accepted')
      element = <Check className="text-green-500" />
      break
    case 'pending':
      message = t('status_badge.criteria_pending')
      element = <LoaderCircle className="text-blue-500" />
      break
    case 'rejected':
      message = t('status_badge.criteria_rejected')
      element = <X className="text-red-500" />
      break
    default:
      return null
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SpanButton variant={'ghost'} className="hover:bg-transparent ">
            {element}
          </SpanButton>
        </TooltipTrigger>
        <TooltipContent>{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
export default StatusBadge
