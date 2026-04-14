import React from 'react'
import TopMenu from '@/Components/TopMenu'
import LeftMenu from '@/Components/LeftMenu'
import LanguageSwitcher from '@/Components/LanguageSwitcher'
import { usePage } from '@inertiajs/react'
import { toast } from 'sonner'
import { Link } from '@inertiajs/react'
import { Particles } from '@/components/magicui/particles'
import { ThemeProvider } from '@/Context/ThemeContext'

const GuestLayout = ({ children }) => {
  return (
    <div className="guestlayout flex min-h-screen w-full flex-col items-center bg-background pt-6 sm:justify-center sm:pt-0">
      <Particles className="absolute inset-0 w-full h-full" />
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="mb-12">
        <Link
          as={'button'}
          href="/"
          className="text-6xl font-bold text-primary mb-6 animate-fade-in-up"
        >
          Reactify
        </Link>
      </div>

      <div className="w-full overflow-hidden px-6 py-8 sm:max-w-md sm:rounded-xl  text-foreground">
        {children}
      </div>
    </div>
  )
}

const AuthenticatedLayout = ({ children }) => {
  const { message, status, flash_key } = usePage().props.flash
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    if (!message || !status) return

    switch (status) {
      case 'success':
        toast.success(message)
        break
      case 'error':
        toast.error(message)
        break
      case 'warning':
        toast.warning(message)
        break
      case 'info':
        toast.info(message)
        break
      default:
        toast(message)
        break
    }
  }, [flash_key])
  return (
    <ThemeProvider>
      <div className="flex flex-col justify-start min-h-screen bg-background min-w-full">
        <TopMenu isOpen={isOpen} setIsOpen={setIsOpen} />
        <main className="flex-1 grid grid-rows-[1fr] grid-cols-[auto_1fr] bg-background text-foreground items-start ">
          <LeftMenu isOpen={isOpen} setIsOpen={setIsOpen} />
          <section className="flex items-center justify-center pt-2">
            {children}
          </section>
        </main>
      </div>
    </ThemeProvider>
  )
}

const MainLayout = ({ children }) => {
  const user = usePage().props.auth.user
  return user ? (
    <AuthenticatedLayout>{children}</AuthenticatedLayout>
  ) : (
    <GuestLayout>{children}</GuestLayout>
  )
}

export default MainLayout
