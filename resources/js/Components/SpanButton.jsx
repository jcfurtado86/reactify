import { cn } from '@/lib/utils'
const SpanButton = ({ children, className, onClick, ...props }) => {
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
      className={cn(
        ' items-center gap-2 w-fit  border border-border px-2  bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 inline-flex  justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
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
