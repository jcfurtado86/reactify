import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SpanButton from './SpanButton'
const StatusBadge = ({ status }) => {
  const { t } = useTranslation()
  let message = ''
  let element = null

  switch (status) {
    case 'validated':
      message = t('status_badge.criteria_accepted')
      element = <ShieldCheck className="size-4 text-green-500" />
      break
    case 'pending':
      message = t('status_badge.criteria_pending')
      element = <Clock className="size-4 text-blue-500" />
      break
    case 'rejected':
      message = t('status_badge.criteria_rejected')
      element = <ShieldAlert className="size-4 text-red-500" />
      break
    default:
      return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SpanButton variant={'ghost'} className="hover:bg-transparent">
          {element}
        </SpanButton>
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  )
}
export default StatusBadge
