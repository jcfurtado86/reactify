import { Info, Sparkles, Loader2 } from 'lucide-react'
import ButtonWithTooltip from './ButtonWithTooltip'
const GenerateAIButton = ({
  isGenerating,
  onClick,
  tooltip,

  className = '',
}) => {
  return (
    <div
      className={`fixed w-20 z-20 bottom-16 right-2 flex items-center justify-center rounded-full shadow-md transition-colors hover:bg-accent ${className} ${
        isGenerating
          ? 'bg-muted text-muted-foreground'
          : 'bg-card text-foreground'
      }`}
    >
      <ButtonWithTooltip
        onClick={onClick}
        disabled={isGenerating}
        variant="hollow"
        className="flex flex-1 items-center justify-center py-2"
        tooltipContent={tooltip?.description || null}
      >
        {isGenerating ? (
          <Loader2 size={18} className="mr-2 animate-spin" />
        ) : (
          <Sparkles size={18} className="mr-2" />
        )}
        <span>AI</span>
      </ButtonWithTooltip>

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
