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
        'flex items-center gap-2 w-fit rounded border border-border px-2 hover:bg-accent',
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
