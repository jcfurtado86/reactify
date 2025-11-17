import { Info } from 'lucide-react'
import { usePage } from '@inertiajs/react'
const NavMenu = ({ menuItems, setActiveMenu }) => {
  const [open, setOpen] = useState(false)
  // Calcula o número total de itens para distribuição do indicador
  const totalItems = menuItems.length
  // Função para lidar com o clique em um item
  const handleItemClick = (menuItem) => setActiveMenu(menuItem.link)
  const props = usePage().props
  const artifact = props.artifact || ''
  return (
    <>
      <div id="tab-menu" className="flex w-full">
        {menuItems.map((menuItem, index) => (
          <div
            key={index}
            className={`flex-1 z-20 h-9 flex items-center justify-evenly text-center font-medium text-base cursor-pointer
              border-primary border-b-2 slide-in
              ${index === 0 ? 'rounded-tl-md rounded-bl-md' : ''}
              ${
                index === menuItems.length - 1
                  ? 'rounded-tr-md rounded-br-md'
                  : ''
              }
              ${menuItem.link === artifact ? 'bg-primary text-background' : 'text-muted-foreground bg-card'}`}
            onClick={() => handleItemClick(menuItem)}
          >
            {menuItem.label}
            <Popover>
              <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                <Info
                  className={`${
                    menuItem.link !== artifact
                      ? 'text-foreground'
                      : 'text-background'
                  }`}
                  size={15}
                />
              </PopoverTrigger>
              <PopoverContent className="bg-background text-foreground ">
                {menuItem.tooltip.description || 'Description'}
                <PopoverArrow className="fill-background" />
              </PopoverContent>
            </Popover>
          </div>
        ))}
      </div>

      <div className="relative h-0 w-full ">
        {menuItems.map(
          (menuItem, index) =>
            menuItem.value && (
              <div
                key={`indicator-${index}`}
                className="absolute w-6 h-6 bg-primary transform -translate-y-5 rotate-45"
                style={{
                  left: `calc(${(index + 0.5) * (100 / totalItems)}% - 12px)`,
                }}
              />
            ),
        )}
      </div>
    </>
  )
}

export default NavMenu
