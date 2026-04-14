import { isTemporary, darkenColor, PREDEFINED_COLORS } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
const ColorOptions = ({ selectedValue, handleColorSelect }) => {
  const handleSelect = (e, color) => {
    e.preventDefault()
    handleColorSelect(color)
  }
  return (
    <>
      {PREDEFINED_COLORS.map((color) => (
        <Button
          key={color.name}
          variant="ghost"
          onClick={(e) => handleSelect(e, color.color)}
          className="w-full flex items-center justify-start"
        >
          <div
            className="size-4 rounded-sm"
            style={{ backgroundColor: color.color }}
          />
          <span className="ml-2">{color.name}</span>
          {selectedValue === color.color && (
            <Check className="ml-auto h-4 w-4" />
          )}
        </Button>
      ))}
    </>
  )
}
// Componente ColorPickerPopover (sem alterações)
const ColorPickerPopover = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const handleColorSelect = (colorValue) => {
    onChange(colorValue)
    setIsOpen(false)
  }
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="size-10 p-0 flex"
          disabled={disabled}
        >
          <div
            className="size-6 rounded-md"
            style={{ backgroundColor: value }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start">
        <div className="space-y-1">
          <h4 className="font-medium text-sm px-2 py-1.5">{t('color_components.title')}</h4>
          <ColorOptions
            handleColorSelect={handleColorSelect}
            selectedValue={value}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ColorOptions, ColorPickerPopover }
