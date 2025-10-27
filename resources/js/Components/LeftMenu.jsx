import { useState, useEffect } from 'react'
import { usePage, router, Link } from '@inertiajs/react'
import {
  Grid,
  User,
  Squirrel,
  LogOut,
  Sun,
  Moon,
  Home,
  Bell,
  ChevronsRight,
  Milestone,
} from 'lucide-react'
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

const LeftMenu = () => {
  const [isHovered, setIsHovered] = useState(false)
  const { props } = usePage()
  const user = props.auth.user
  const notifications = props.auth.notifications || []
  const projects = props.auth.projects || []
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  const menuRef = useRef(null)
  const menuItems = [
    {
      name: 'Notifications',
      url: 'notifications.index',
      icon: Bell,
      badge: notifications.filter((n) => !n.read_at).length,
    },
    { name: 'Profile', url: 'profile.edit', icon: User },
    { name: 'Logout', url: 'logout', icon: LogOut },
  ]

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
        animate={{ opacity: 1, width: isHovered ? '14rem' : '3.5rem' }}
        transition={{ duration: 0.3 }}
        className={
          'fixed bg-background text-foreground border-r border-border flex flex-col min-h-screen z-50'
        }
      >
        {/* Header */}
        {isHovered ? (
          <motion.header
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={cardVariants.transition}
            className="p-4 h-16"
          >
            <div
              className="flex items-center justify-between"
              onClick={() => setIsHovered(!isHovered)}
            >
              {/* link para dasboard */}
              <Link
                as="div"
                className="flex items-center gap-3 cursor-pointer"
                href={route('dashboard')}
              >
                <Squirrel className="size-8 text-primary" />
              </Link>
              <h1
                className={cn(
                  'text-xl font-bold my-0 mx-2 cursor-pointer',
                  isHovered ? '' : 'hidden',
                )}
              >
                Reactify
              </h1>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
              </Button>
            </div>
          </motion.header>
        ) : (
          <motion.div
            variants={cardVariants}
            initial="visible"
            animate="visible"
            exit="hidden"
            transition={cardVariants.transition}
            className="w-full p-4 h-16 flex items-center justify-center cursor-pointer"
            onClick={() => setIsHovered(!isHovered)}
          >
            <ChevronsRight className="size-5 text-foreground" />
          </motion.div>
        )}

        {/* User Info Section */}

        <section className="p-2 flex gap-3 items-center border-y border-border">
          <div className="size-10 z-10 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
            {user?.provider_avatar ? (
              <img
                src={user.provider_avatar}
                alt="User Avatar"
                className="size-full rounded-full object-contain"
              />
            ) : (
              <User className="size-8 text-primary-foreground" />
            )}
          </div>
          {isHovered && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={cardVariants.transition}
              className=""
            >
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </motion.div>
          )}
        </section>

        {/* Navigation */}
        {/* {isHovered && (*/}
        <motion.nav
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={cardVariants.transition}
          className="flex-1 p-2 space-y-1"
        >
          {/* Botão Home/Dashboard */}
          <Button
            variant="ghost"
            onClick={() => router.get(route('dashboard'))}
            className={cn(
              'flex items-center p-2 rounded transition-colors',
              isHovered ? 'w-full justify-start' : 'size-9',
              route().current('dashboard') &&
                'bg-accent text-accent-foreground',
            )}
          >
            <Home className="!size-5" />
            {isHovered && (
              <span className="font-medium hidden md:inline">Home</span>
            )}
          </Button>

          {/* Accordion Principal para "My Projects" */}
          <Accordion
            type="single"
            collapsible
            defaultValue={isProjectsSectionActive ? 'projects' : undefined}
          >
            <AccordionItem value="projects" className="border-b-0">
              {isHovered ? (
                <AccordionTrigger
                  className={cn(
                    'flex items-center p-2 rounded transition-colors hover:no-underline hover:bg-accent',
                    isProjectsSectionActive &&
                      'bg-accent text-accent-foreground',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="size-5" />
                    {isHovered && (
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
              {isHovered && (
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

          {/* Outros itens do menu */}
          {menuItems.map((item, index) => {
            const IconComponent = item.icon
            const isActive = currentRouteName === item.url
            return (
              <Button
                key={index}
                variant="ghost"
                onClick={() => {
                  if (item.url === 'logout') {
                    router.post(route('logout'))
                    return
                  }
                  router.get(route(item.url))
                }}
                className={cn(
                  'flex items-center p-2 rounded transition-colors ',
                  isActive && 'bg-accent text-accent-foreground',
                  isHovered ? 'w-full justify-start' : 'size-9 ',
                )}
              >
                <IconComponent className="size-5" />
                {isHovered && (
                  <span className="font-medium hidden md:inline">
                    {item.name}
                  </span>
                )}
                {item.badge && (
                  <Badge
                    className={`${isHovered ? '' : ' absolute translate-x-1/2 -translate-y-1/2'} size-4 justify-center `}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
        </motion.nav>
        {/* )}*/}
      </motion.aside>
    </AnimatePresence>
  )
}

export default LeftMenu
