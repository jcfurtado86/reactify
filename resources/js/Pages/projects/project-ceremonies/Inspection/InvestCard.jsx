import React, { useState, useEffect, useRef } from 'react'
import { X, Check, LoaderCircle, ChevronRight, Info } from 'lucide-react'
import { router } from '@inertiajs/react'
import { isTemporary, cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from '@/Components/StatusBadge'

const routerNames = {
  // local state name -> route name
  stories: 'story',
  goal_sketches: 'goal',
  journeys: 'journey',
  personas: 'persona',
  crc_cards: 'overall',
  business_rules: 'business-rule',
  usage_scenarios: 'usage-scenario',
  system_interfaces: 'system-interface',
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
    independent: item?.invest_card?.independent || 'na',
    negotiable: item?.invest_card?.negotiable || 'na',
    valuable: item?.invest_card?.valuable || 'na',
    estimable: item?.invest_card?.estimable || 'na',
    small: item?.invest_card?.small || 'na',
    testable: item?.invest_card?.testable || 'na',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
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

  const investDescriptions = {
    independent: 'O item pode ser desenvolvido de forma independente?',
    negotiable: 'O escopo do item é flexível e pode ser ajustado?',
    valuable: 'O item traz valor para o cliente ou usuário final?',
    estimable: 'É possível estimar o esforço necessário para completar o item?',
    small:
      'O item é pequeno o suficiente para ser concluído em um único sprint?',
    testable: 'Existem critérios claros para testar o item?',
  }

  // Sincroniza o estado interno se a prop externa mudar
  useEffect(() => {
    // Pega todos os valores do objeto
    const values = Object.values(investState)

    if (values.length === 0) {
      setInvestStatus('pending') // ou 'idle'
      return
    }
    const allAreYes = values.every((value) => value === 'yes' || value === 'na')
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
        onSuccess: () => {
          setInspectionId(null)
        },

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
    <Popover open={true}>
      <PopoverAnchor virtualRef={{ current: anchorEl }}></PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="end"
        sticky="always"
        sideOffset={5}
        className={cn(
          'bg-card border border-border rounded-md shadow-sm max-w-3xl',
          isExpanded ? 'w-96 lg:w-auto' : 'w-72 lg:w-80',
        )}
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
            <StatusBadge status={investStatus} />
            <LoaderCircle
              className={`${isLoading ? 'animate-spin' : 'hidden'} text-foreground`}
            />
          </section>

          <div className="flex flex-col w-full gap-4 text-normal font-normal text-foreground ">
            {/* Cabeçalho */}

            <div
              className={cn(
                'grid items-center text-normal font-semibold  text-muted-foreground gap-x-2',
                isExpanded
                  ? 'grid-cols-[1fr_auto_auto_auto_3fr]'
                  : 'grid-cols-[1fr_auto_auto_auto]',
              )}
            >
              <h3 className="font-bold uppercase text-foreground">
                Check Card
              </h3>

              <span className=" ">SIM</span>
              <span className="">NÃO</span>
              <span className="">N/A</span>
              {isExpanded && <Info />}
            </div>

            {/* Linhas de Opções (renderizadas dinamicamente) */}
            {investOptions.map((option) => (
              <div
                key={option}
                className={cn(
                  'grid items-center gap-x-4',
                  isExpanded
                    ? 'grid-cols-[1fr_auto_auto_auto_3fr]'
                    : 'grid-cols-[1fr_auto_auto_auto]',
                )}
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
                {isExpanded && <div>{investDescriptions[option]}</div>}
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="success"
              size="icon"
              onClick={handleSubmit}
              title="Salvar"
            >
              <Check />
            </Button>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Reduzir' : 'Expandir'}
              variant="secondary"
              size="icon"
            >
              <ChevronRight />
            </Button>
          </div>
        </section>
      </PopoverContent>
    </Popover>
  )
}

export default InvestCard
