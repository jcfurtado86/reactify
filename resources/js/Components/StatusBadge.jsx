import { X, Check, LoaderCircle } from 'lucide-react'
import SpanButton from './SpanButton'
const StatusBadge = ({ status }) => {
  let message = ''
  let element = null

  switch (status) {
    case 'validated':
      message = 'Critérios aceitos'
      element = <Check className="text-green-500" />
      break
    case 'pending':
      message = 'Avaliação pendente'
      element = <LoaderCircle className="text-blue-500" />
      break
    case 'rejected':
      message = 'Critérios recusados'
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
