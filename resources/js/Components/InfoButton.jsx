import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
const InfoButton = ({
  data = {
    title: 'Info',
    description: 'This is an info button',
    classNames: {
      badge: '',
      button: '',
      content: '',
    },
  },

  badgeContent = null,
  badgeStyle = {},
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-foreground bg-card hover:bg-muted transition-colors',
            data.classNames?.button,
          )}
        >
          {badgeContent !== null && (
            <Badge
              variant="outline"
              className={cn(`${data.classNames?.badge}`, 'border-0 text-black')}
              style={badgeStyle}
            >
              {badgeContent}
            </Badge>
          )}
          {data.title}
          <Info className="text-muted-foreground" size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'bg-popover text-popover-foreground ',
          data.classNames?.content,
        )}
      >
        {data.description}
        <PopoverArrow className="fill-popover" />
      </PopoverContent>
    </Popover>
  )
}

export default InfoButton
