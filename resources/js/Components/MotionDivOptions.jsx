import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash, ChartArea } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const MotionDivOptions = ({
  isHovered,
  isEditing,
  isTemporary = false,
  disabled = false,
  onAdd,
  onEdit,
  onInspect,
  onDelete,
}) => {
  const { t } = useTranslation()
  return (
    <TooltipProvider delayDuration={100}>
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
                    className="text-muted-foreground hover:text-foreground"
                    onClick={onInspect}
                  >
                    <ChartArea className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('motion_div.inspect_invest')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onAdd && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="motiondiv"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={onAdd}
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('motion_div.add')}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="motiondiv"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={onEdit}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('motion_div.edit')}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="motiondiv"
                    className="text-destructive/80 hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('motion_div.delete')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}

export default MotionDivOptions
