import { forwardRef } from 'react'

/**
 * Botão wrapped num Tooltip do shadcn/ui.
 *
 * IMPORTANTE: usa forwardRef e spread de `...rest` no Button interno
 * porque é commumente usado como filho de Radix triggers (Popover,
 * Dropdown, etc) com `asChild`. Sem o forward, os handlers e refs que
 * o Radix injeta se perdem e o trigger não funciona — ex: clicar no
 * trash não abria o popover de confirmação de delete em Journeys.
 */
const ButtonWithTooltip = forwardRef(function ButtonWithTooltip(
  {
    children,
    className,
    size,
    side = 'top',
    variant,
    tooltipContent,
    onClick,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            className={className}
            onClick={onClick}
            disabled={disabled}
            {...rest}
          >
            {children}
          </Button>
        </TooltipTrigger>
        {tooltipContent && (
          <TooltipContent side={side} className="max-w-64">
            {tooltipContent}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
})

export default ButtonWithTooltip
