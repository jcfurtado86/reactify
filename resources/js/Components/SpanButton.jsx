import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const SpanButton = ({
  children,
  className,
  variant,
  size,
  onClick,
  ...props
}) => {
  const buttonVariants = cva(
    'inline-flex  px-2 py-1 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
      variants: {
        variant: {
          default:
            'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          destructive:
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
          outline:
            'border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
          secondary:
            'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          empty: '!p-0',
          link: 'text-primary underline-offset-4 hover:underline',
          success:
            'bg-green-600 text-green-100 shadow-sm hover:bg-green-700 dark:bg-green-700 dark:text-green-50 dark:hover:bg-green-800',
        },
        size: {
          default: 'h-auto',
          sm: 'h-8 rounded-md px-3 text-xs',
          lg: 'h-10 rounded-md px-8',
          icon: 'size-9',
          motiondiv: 'size-7',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  )
  const handleInteraction = (e) => {
    e.preventDefault()

    e.stopPropagation()

    if (onClick) {
      onClick(e)
    }
  }
  return (
    <span
      role="button"
      tabIndex={0}
      {...props}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleInteraction}
      onKeyDown={(e) => {
        // Botões devem funcionar com Enter E Espaço
        if (e.key === 'Enter' || e.key === ' ') {
          handleInteraction(e)
        }
      }}
    >
      {children}
    </span>
  )
}

export default SpanButton
