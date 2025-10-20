import { Info, Sparkles, Loader2 } from 'lucide-react'
const GenerateAIButton = ({
  isGenerating,
  onClick,
  tooltip,

  className = '',
}) => {
  return (
    <div
      className={`fixed w-20 bottom-16 right-2 flex items-center justify-center rounded-full shadow-md transition-colors hover:bg-accent ${className} ${
        isGenerating
          ? 'bg-muted text-muted-foreground'
          : 'bg-card text-foreground'
      }`}
    >
      <Button
        onClick={onClick}
        disabled={isGenerating}
        variant="hollow"
        className="flex flex-1 items-center justify-center py-2"
      >
        {isGenerating ? (
          <Loader2 size={18} className="mr-2 animate-spin" />
        ) : (
          <Sparkles size={18} className="mr-2" />
        )}
        <span>AI</span>
      </Button>

      {/* <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center justify-center h-full px-2">
            <Info size={15} />
          </div>
        </PopoverTrigger>
        <PopoverContent className="bg-popover text-popover-foreground">
          <PopoverArrow className="fill-popover" />
          {tooltip.description}
        </PopoverContent>
      </Popover>*/}
      <ShineBorder
        borderWidth={2}
        shineColor={[
          'oklch(0.5497 0.2143 285.2157)',
          'oklch(0.6861 0.2061 14.9941)',
        ]}
      />
    </div>
  )
}

export default GenerateAIButton
