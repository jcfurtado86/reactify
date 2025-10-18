import React, { useState, useEffect, useRef } from 'react'
import { X, Check, LoaderCircle } from 'lucide-react'
import { router } from '@inertiajs/react'
import { isTemporary } from '@/lib/utils'

const routerNames = {
  // local state name -> route name
  stories: 'story',
  goal_sketches: 'goal',
  system_interfaces: 'system_interface',
}

const IndicatorBadge = ({ status }) => {
  let message = ''
  let element = null

  switch (status) {
    case 'validated':
      message = 'Critérios aceitos'
      element = <Check className="text-green-500" />
      break
    case 'pending':
      message = 'Avaliação pendente'
      element = <LoaderCircle className="text-blue-500" />
      break
    case 'rejected':
      message = 'Critérios recusados'
      element = <X className="text-red-500" />
      break
    default:
      return null
      break
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger>{element}</TooltipTrigger>
        <TooltipContent>{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const InvestCard = ({
  itemId,
  itemCategory,
  anchorEl,
  project,
  setInspectionId,
}) => {
  const item = project[itemCategory]?.find((element) => element.id === itemId)
  const [investState, setInvestState] = useState({
    independent: item?.invest_card?.independent || 'no',
    negotiable: item?.invest_card?.negotiable || 'no',
    valuable: item?.invest_card?.valuable || 'no',
    estimable: item?.invest_card?.estimable || 'no',
    small: item?.invest_card?.small || 'no',
    testable: item?.invest_card?.testable || 'no',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [investStatus, setInvestStatus] = useState('rejected')
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
    // Pega todos os valores do objeto
    const values = Object.values(investState)

    if (values.length === 0) {
      setInvestStatus('pending') // ou 'idle'
      return
    }
    const allAreYes = values.every((value) => value === 'yes')
    if (allAreYes) {
      setInvestStatus('validated')
      return // A validação para aqui
    }

    const anyIsNo = values.some((value) => value === 'no')
    if (anyIsNo) {
      setInvestStatus('rejected')
      return // A validação para aqui
    }

    setInvestStatus('pending')
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
        <PopoverContent
          side="bottom"
          align="end"
          sticky="always" // 3. ✨ A MÁGICA: Impede que ele "flipe" para 'top'
          sideOffset={8}
          className="bg-card border border-border rounded-md shadow-sm max-w-3xl w-72 lg:w-80"
        >
          <Button
            variant="outline"
            className="size-3 absolute top-0 right-0 p-3"
            onClick={() => setInspectionId(null)}
          >
            <X />
          </Button>
          <section className="investCard flex flex-col flex-1 items-center justify-end gap-2 ">
            <section className="flex gap-2 w-full">
              <IndicatorBadge status={investStatus} />
              <LoaderCircle
                className={`${isLoading ? 'animate-spin' : 'hidden'} text-foreground`}
              />
            </section>
            <div className="flex flex-col w-full gap-4 text-normal font-normal text-foreground ">
              {/* Cabeçalho */}

              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center text-normal font-semibold  text-muted-foreground gap-x-2">
                <h3 className="font-bold uppercase text-foreground">
                  Check Card
                </h3>

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
