import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash, ChartArea } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePermissionGate } from '@/lib/usePermissionGate'

// MotionDiv com botões de add/edit/delete/inspect que aparecem no hover
// de um card de artefato. Se receber prop `slot` (ex: 'persona.manage'),
// checa permissão do usuário via usePermissionGate:
//
//  - permitido: comportamento normal, tooltip padrão em cada botão.
//  - bloqueado: botões aparecem mas em estado disabled, tooltip mostra
//    o motivo específico ("Seu papel (Customer) não permite gerenciar
//    personas. Fale com um administrador."). O usuário entende que a
//    ação existe, por que não pode, e o que fazer.
//
// Fica transparente pras chamadas existentes que não passam `slot`.
const MotionDivOptions = ({
  isHovered,
  isEditing,
  isTemporary = false,
  disabled = false,
  slot = null,
  onAdd,
  onEdit,
  onInspect,
  onDelete,
}) => {
  const { t } = useTranslation()
  const gate = usePermissionGate(slot || '')
  const gated = slot && !gate.allowed
  const deniedReason = gated ? gate.reason : null

  const tipFor = (defaultKey) => (gated ? deniedReason : t(defaultKey))

  const handle = (fn) => (e) => {
    if (gated) {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      return
    }
    fn?.(e)
  }

  return (
    <>
      <AnimatePresence>
        {isHovered && !isEditing && !isTemporary && !disabled && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="z-50 absolute right-0 top-0 flex items-center rounded-md bg-card border border-border shadow-lg"
          >
            {onInspect && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="motiondiv"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handle(onInspect)}
                    disabled={gated}
                  >
                    <ChartArea className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tipFor('motion_div.inspect_invest')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onAdd && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="motiondiv"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handle(onAdd)}
                    disabled={gated}
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tipFor('motion_div.add')}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="motiondiv"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handle(onEdit)}
                    disabled={gated}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tipFor('motion_div.edit')}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="motiondiv"
                    className="text-destructive/80 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handle(onDelete)}
                    disabled={gated}
                  >
                    <Trash className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tipFor('motion_div.delete')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MotionDivOptions
