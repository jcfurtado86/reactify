import { usePage, Link, router } from '@inertiajs/react'
import { cn, capitalizeFirstLetter } from '@/lib/utils'
import {
  User,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Check,
  Dot,
} from 'lucide-react'
import RaccoonIcon from '/resources/images/raccoonIconHeadTransparent.png'
import { useTheme } from '@/Context/ThemeContext'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/Components/LanguageSwitcher'

const TopMenu = ({ isOpen, setIsOpen }) => {
  const { props } = usePage()
  const { user, notifications } = props.auth
  const { t } = useTranslation()
  const themes = [
    { name: 'zinc', label: 'Default (Zinc)', color: 'oklch(0.922 0 0)' },
    { name: 'doom64', label: 'Doom 64', color: '#e53935' },
    { name: 'neobrutalism', label: 'Neo Brutalism', color: '#ff6666' },
    { name: 'retroarcade', label: 'Retro Arcade', color: '#d33682' },
    { name: 'coffee', label: 'Coffee', color: '#ffe0c2' },
    { name: 'supabase', label: 'Supabase', color: '#006239' },
    { name: 'violetbloom', label: 'Violet Bloom', color: '#8c5cff' },
  ]

  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const { themeColor, setThemeColor } = useTheme()

  const handleThemeToggle = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    const newTheme = isDark ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  return (
    <div
      id="top-menu"
      className="flex justify-between items-center bg-background text-foreground p-1 border-b border-border"
    >
      <div className="flex items-center gap-4 ml-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? t('top_menu.close_side_menu') : t('top_menu.open_side_menu')}
          title={isOpen ? t('top_menu.close_side_menu') : t('top_menu.open_side_menu')}
        >
          {isOpen ? (
            <PanelLeftClose className="!size-5" />
          ) : (
            <PanelLeftOpen className="!size-5" />
          )}
        </Button>
        {/* link para dasboard */}
        <Link
          as="div"
          className="flex items-center gap-3 cursor-pointer text-2xl font-bold"
          href={route('dashboard')}
        >
          {/* raccoon*/}
          <img
            src={RaccoonIcon}
            alt="Raccoon"
            className="object-contain bg-muted rounded-full p-1 size-11"
          />
          Reactify
        </Link>
      </div>
      <div className=" z-10 flex items-center gap-2 justify-center">
        <div className="flex items-center gap-2">
          <Select
            value={themeColor}
            defaultValue="zinc"
            onValueChange={(value) => setThemeColor(value)}
          >
            <SelectTrigger title={t('top_menu.theme_selector')}>
              <SelectValue placeholder={t('top_menu.theme_selector')} />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem
                  value={theme.name}
                  key={theme.name}
                  title={theme.name}
                >
                  <section className="flex items-center gap-1">
                    <div
                      style={{ background: theme.color }}
                      className={cn('flex size-4 rounded-lg shadow')}
                    />
                    {theme.label}
                  </section>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          aria-label={t('top_menu.toggle_theme')}
          title={t('top_menu.toggle_theme')}
        >
          {theme === 'dark' ? (
            <Moon className="!size-5" />
          ) : (
            <Sun className="!size-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.get(route('notifications.index'))}
          aria-label={t('nav.notifications')}
          title={t('nav.notifications')}
        >
          <Bell className="!size-5" />
          <Badge
            className={`absolute translate-x-1/2 -translate-y-1/2 size-4 justify-center `}
          >
            {notifications.filter((n) => !n.read_at).length}
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={t('nav.profile')}
              title={t('nav.profile')}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="User Avatar"
                  className="size-7 rounded-full object-contain"
                />
              ) : (
                <User className="size-7 text-foreground" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>
              {t('nav.profile')}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => router.get(route('profile.edit'))}
              >
                {t('profile.title')}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.post(route('logout'))}>
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default TopMenu
