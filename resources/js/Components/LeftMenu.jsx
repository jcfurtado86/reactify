import { useState, useEffect } from 'react'
import { usePage, router } from '@inertiajs/react'
import { Grid, Milestone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [isHovered, setIsHovered] = useState(false)
  const { props } = usePage()
  const { user, notifications } = props.auth
  const projects = props.auth.projects || []
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

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
  const handleThemeToggle = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    const newTheme = isDark ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light'
      setTheme(newTheme)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    console.log(props?.project)
  }, [props])

  const currentRouteName = route().current()
  const currentProjectId = route().params.project

  const isProjectsSectionActive =
    currentRouteName &&
    currentRouteName.startsWith('project') &&
    !route().current('projects.index')

  useOnClickOutside(menuRef, () => setIsHovered(false))
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
          {/* Accordion Principal para "My Projects" */}
          <Accordion
            type="single"
            collapsible
            defaultValue={isProjectsSectionActive ? 'projects' : undefined}
            title="My Projects"
          >
            <AccordionItem value="projects" className="border-b-0">
              {isOpen ? (
                <AccordionTrigger
                  className={cn(
                    'flex items-center p-2 rounded transition-colors hover:no-underline hover:bg-accent',
                    isProjectsSectionActive &&
                      'bg-accent text-accent-foreground',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="size-5" />
                    {isOpen && (
                      <span className="font-medium hidden md:inline truncate">
                        My Projects
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    isProjectsSectionActive &&
                    'bg-accent text-accent-foreground'
                  }
                >
                  <Grid className="!size-5" />
                </Button>
              )}
              {isOpen && (
                <AccordionContent className="pt-1 pl-4">
                  {/* Mapeando cada projeto para um Accordion aninhado */}
                  {projects.map((project) => {
                    const isCurrentProject =
                      Number(currentProjectId) === project.id
                    return (
                      <AccordionItem
                        key={project.id}
                        value={
                          isCurrentProject ? `project-${project.id}` : undefined
                        }
                        className="border-b-0"
                      >
                        <Button
                          variant={`${isCurrentProject ? 'secondary' : 'link'}`}
                          className="w-full justify-start"
                          onClick={() =>
                            router.get(
                              route('project.show', { id: project.id }),
                            )
                          }
                        >
                          {isCurrentProject ? <Milestone /> : null}
                          {project.title}
                        </Button>
                      </AccordionItem>
                    )
                  })}
                </AccordionContent>
              )}
            </AccordionItem>
          </Accordion>
        </motion.nav>
      </motion.aside>
    </AnimatePresence>
  )
}

export default LeftMenu
