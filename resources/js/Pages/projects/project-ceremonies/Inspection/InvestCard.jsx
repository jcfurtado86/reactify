import React, { useState, useEffect, useRef } from 'react'
import { X, Check, LoaderCircle } from 'lucide-react'
import { router } from '@inertiajs/react'
import { isTemporary } from '@/lib/utils'

const routerNames = {
  // local state name -> route name
  stories: 'story',
  system_interfaces: 'system_interface',
}

const InvestCard = ({
  itemId,
  itemCategory,
  anchorEl,
  project,
  setProject,
  setInspectionId,
}) => {
  const item = project[itemCategory]?.find((element) => element.id === itemId)
  const [investState, setInvestState] = useState({
    independent: item?.invest_card?.independent || 'na',
    negotiable: item?.invest_card?.negotiable || 'na',
    valuable: item?.invest_card?.valuable || 'na',
    estimable: item?.invest_card?.estimable || 'na',
    small: item?.invest_card?.small || 'na',
    testable: item?.invest_card?.testable || 'na',
  })
  const [isLoading, setIsLoading] = useState(false)

  // Lista de critérios para renderização dinâmica
  const investOptions = [
    'independent',
    'negotiable',
    'valuable',
    'estimable',
    'small',
    'testable',
  ]

  // Sincroniza o estado interno se a prop externa mudar
  useEffect(() => {
    console.log(investState)
  }, [investState])

  /**
   * Função para lidar com a mudança de valor e salvar automaticamente.
   * @param {string} field O campo que está sendo alterado (ex: 'independent')
   * @param {string} value O novo valor ('true', 'false', ou 'null')
   */
  const handleValueChange = (field, value) => {
    console.log(value)
    if (isTemporary(item.id)) return
    // 1. Atualização Otimista do Estado Local
    setInvestState((prevState) => ({
      ...prevState,
      [field]: value,
    }))
  }
  const handleSubmit = () => {
    const routeName = routerNames[itemCategory] || null
    if (!routeName) {
      console.error('Rota inválida')
      return
    }
    setIsLoading(true)
    router.patch(
      route(`${routeName}.update`, item.id),
      {
        invest_card: investState,
      },
      {
        onStart: () => {
          setIsLoading(true)
        },
        onFinish: () => {
          setIsLoading(false)
        },
      },
    )
  }
  return (
    <TooltipProvider delayDuration={100}>
      <Popover open={true}>
        <PopoverAnchor virtualRef={{ current: anchorEl }}></PopoverAnchor>
        <PopoverContent className="bg-card border border-border rounded-md shadow-sm max-w-3xl w-72 lg:w-80">
          <LoaderCircle
            className={`${isLoading ? 'animate-spin' : 'hidden'} text-foreground`}
          />
          <Button
            variant="outline"
            className="size-3 absolute top-0 right-0 p-3"
            onClick={() => setInspectionId(null)}
          >
            <X />
          </Button>
          <section className="investCard flex flex-col flex-1 items-center justify-end gap-2 ">
            <div className="flex flex-col flex-1 gap-4 text-normal font-normal text-foreground ">
              {/* Cabeçalho */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center text-normal font-semibold  text-muted-foreground gap-x-2">
                <h3 className="font-bold uppercase text-foreground">
                  Check Card
                </h3>
                {isTemporary(item.id) && (
                  <LoaderCircle className="animate-spin text-foreground" />
                )}
                <span className=" ">SIM</span>
                <span className="">NÃO</span>
                <span className="">N/A</span>
              </div>

              {/* Linhas de Opções (renderizadas dinamicamente) */}
              {investOptions.map((option) => (
                <div
                  key={option}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4"
                >
                  <Label
                    htmlFor={option}
                    className="uppercase font-medium text-xs"
                  >
                    {option}
                  </Label>
                  <RadioGroup
                    disabled={isLoading}
                    id={option}
                    value={String(investState[option])} // O valor precisa ser string
                    onValueChange={(value) => handleValueChange(option, value)}
                    className="flex items-center col-span-3 justify-self-end gap-4"
                  >
                    <RadioGroupItem value="yes" id={`${option}-yes`} />
                    <RadioGroupItem value="no" id={`${option}-no`} />
                    <RadioGroupItem value="na" id={`${option}-na`} />
                  </RadioGroup>
                </div>
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="success"
                  className="justify-self-end size-7"
                  onClick={handleSubmit}
                >
                  <Check />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar</p>
              </TooltipContent>
            </Tooltip>
          </section>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}

export default InvestCard
