const ButtonWithTooltip = ({
  children,
  className,
  size,
  side = 'top',
  variant,
  tooltipContent,
  onClick,
}) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={onClick}
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
}

export default ButtonWithTooltip
