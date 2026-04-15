import { usePage, router } from '@inertiajs/react'
import { Grid, Milestone, BadgeCheckIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Item,
  ItemTitle,
  ItemMedia,
  ItemContent,
  ItemActions,
} from '@/components/ui/item'
import ButtonWithTooltip from './ButtonWithTooltip'
const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      // Não faz nada se o clique for dentro do elemento referenciado
      if (!ref.current || ref.current.contains(event.target)) {
        return
      }
      // Executa o handler se o clique for fora
      handler(event)
    }

    // Adiciona o event listener para mousedown
    document.addEventListener('mousedown', listener)
    // Adiciona o event listener para touchstart (suporte mobile)
    document.addEventListener('touchstart', listener)

    // Função de limpeza: remove os event listeners quando o componente for desmontado
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler]) // Recria o efeito se a ref ou o handler mudarem
}

const LeftMenu = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation()
  const { props } = usePage()
  const projects = props.auth.projects || []

  const menuRef = useRef(null)

  const cardVariants = {
    hidden: {
      opacity: 0,
      x: -90,
    },
    visible: {
      opacity: 1,
      x: 0,
    },
    transition: {
      duration: 0.22,
    },
  }

  const currentRouteName = route().current()
  const currentProjectId = route().params.project

  return (
    <AnimatePresence>
      <motion.aside
        ref={menuRef}
        animate={{ opacity: 1, width: isOpen ? '14rem' : '3.5rem' }}
        transition={{ duration: 0.3 }}
        id="left-menu"
        className={
          'bg-background text-foreground border-r border-border flex flex-col z-50  overflow-y-auto h-full'
        }
      >
        {/* Navigation */}

        <motion.nav
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={cardVariants.transition}
          className="flex-1 flex flex-col p-2 gap-2"
        >
          {isOpen && (
            <span className="font-medium text-center hidden md:inline truncate">
              {t('nav.projects')}
            </span>
          )}

          <section className=" flex flex-col gap-2">
            {/* Mapeando cada projeto para um Accordion aninhado */}
            {projects.map((project) => {
              const isCurrentProject = Number(currentProjectId) === project.id
              return (
                <ButtonWithTooltip
                  key={project.id}
                  variant={`${isCurrentProject ? 'secondary' : 'outline'}`}
                  onClick={() =>
                    router.get(route('project.show', { id: project.id }))
                  }
                  tooltipContent={isOpen ? null : project.title}
                  side="right"
                >
                  <div>
                    {!project.emoji ? (
                      <BadgeCheckIcon className="size-5" />
                    ) : (
                      <p> {project.emoji}</p>
                    )}
                  </div>
                  {isOpen && (
                    <>
                      <ItemContent>
                        <ItemTitle>{project.title}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <ChevronRightIcon className="size-4" />
                      </ItemActions>
                    </>
                  )}
                </ButtonWithTooltip>
              )
            })}
          </section>
        </motion.nav>
      </motion.aside>
    </AnimatePresence>
  )
}

export default LeftMenu
