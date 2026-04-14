import { Head, Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { Particles } from '@/components/magicui/particles'
import { useTranslation } from 'react-i18next'
import { Trans } from 'react-i18next'
import LanguageSwitcher from '@/Components/LanguageSwitcher'
import {
  Mic,
  Sparkles,
  Users,
  Upload,
  LayoutDashboard,
  Rocket,
  ListChecks,
} from 'lucide-react'

export default function Welcome({ auth, currentYear }) {
  const { t } = useTranslation()
  return (
    <>
      <Head title={t('welcome.head_title')} />

      <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
        <Particles
          className="pointer-events-none absolute inset-0 h-full w-full"
          quantity={150}
          ease={80}
          refresh
        />
        <div className="absolute top-4 right-4 z-20">
          <LanguageSwitcher />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center selection:bg-primary/20">
          {/* Header */}
          {/* <header className="absolute top-0 w-full px-6 py-6 flex justify-between items-center">
            <div className="text-2xl font-bold text-primary">Reactify</div>
            <nav className="flex gap-4">
              {auth.user ? (
                <Link
                  href={route('dashboard')}
                  className="px-4 py-2 text-foreground hover:bg-primary hover:text-primary-foreground rounded-lg transition-all duration-300"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={route('login')}
                    className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    href={route('register')}
                    className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold transition-all duration-300"
                  >
                    Registre
                  </Link>
                </>
              )}
            </nav>
          </header>*/}

          {/* Hero Section */}
          <div className="flex flex-col items-center text-center py-32 px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Trans
                i18nKey="welcome.hero_title"
                components={{
                  brand: (
                    <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 via-rose-500 to-amber-500 bg-clip-text text-transparent" />
                  ),
                }}
              />
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl">
              {t('welcome.hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-16">
              <Link
                as={'button'}
                href={route('register')}
                className="px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t('welcome.register')}
              </Link>
              <Link
                href={route('login')}
                className="text-base font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
              >
                {t('welcome.login')}
              </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full mt-16 max-w-7xl">
              {[
                {
                  Icon: Mic,
                  title: t('welcome.feature_components_title'),
                  description: t('welcome.feature_components_body'),
                  iconBg: 'bg-violet-500/10 text-violet-500',
                  hoverBorder: 'hover:border-violet-500/50',
                },
                {
                  Icon: Sparkles,
                  title: t('welcome.feature_realtime_title'),
                  description: t('welcome.feature_realtime_body'),
                  iconBg: 'bg-fuchsia-500/10 text-fuchsia-500',
                  hoverBorder: 'hover:border-fuchsia-500/50',
                },
                {
                  Icon: Users,
                  title: t('welcome.feature_cloud_title'),
                  description: t('welcome.feature_cloud_body'),
                  iconBg: 'bg-rose-500/10 text-rose-500',
                  hoverBorder: 'hover:border-rose-500/50',
                },
                {
                  Icon: ListChecks,
                  title: t('welcome.feature_management_title'),
                  description: t('welcome.feature_management_body'),
                  iconBg: 'bg-amber-500/10 text-amber-500',
                  hoverBorder: 'hover:border-amber-500/50',
                },
              ].map(({ Icon, title, description, iconBg, hoverBorder }) => (
                <div
                  key={title}
                  className={`bg-card text-card-foreground backdrop-blur-lg p-6 rounded-xl border border-border transition-all duration-300 shadow-sm hover:shadow-md ${hoverBorder}`}
                >
                  <div
                    className={`mb-4 inline-flex items-center justify-center h-12 w-12 rounded-lg ${iconBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            {/* What is REACT-M */}
            <div className="w-full max-w-3xl mt-32 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <Trans
                  i18nKey="welcome.about_title"
                  components={{
                    brand: <span className="text-foreground" />,
                  }}
                />
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-4">
                {t('welcome.about_p1')}
              </p>
              <p className="text-base md:text-lg text-muted-foreground">
                {t('welcome.about_p2')}
              </p>
            </div>

            {/* How it works */}
            <div className="w-full max-w-7xl mt-32">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  {t('welcome.howitworks_title')}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {t('welcome.howitworks_subtitle')}
                </p>
              </div>

              <div className="flex flex-col gap-20 md:gap-28">
                {[
                  {
                    Icon: Upload,
                    title: t('welcome.step1_title'),
                    body: t('welcome.step1_body'),
                    img: '/img/landing/step-1-upload.png',
                    iconBg: 'bg-violet-500/10 text-violet-500',
                    stepLabel: 'text-violet-500',
                  },
                  {
                    Icon: Sparkles,
                    title: t('welcome.step2_title'),
                    body: t('welcome.step2_body'),
                    img: '/img/landing/step-2-ai.png',
                    iconBg: 'bg-fuchsia-500/10 text-fuchsia-500',
                    stepLabel: 'text-fuchsia-500',
                  },
                  {
                    Icon: LayoutDashboard,
                    title: t('welcome.step3_title'),
                    body: t('welcome.step3_body'),
                    img: '/img/landing/step-3-artifacts.png',
                    iconBg: 'bg-rose-500/10 text-rose-500',
                    stepLabel: 'text-rose-500',
                  },
                  {
                    Icon: Rocket,
                    title: t('welcome.step4_title'),
                    body: t('welcome.step4_body'),
                    img: '/img/landing/step-4-team.png',
                    iconBg: 'bg-amber-500/10 text-amber-500',
                    stepLabel: 'text-amber-500',
                  },
                ].map(
                  (
                    { Icon, title, body, img, iconBg, stepLabel },
                    idx,
                  ) => {
                    const reversed = idx % 2 === 1
                    return (
                      <div
                        key={title}
                        className={`flex flex-col gap-8 md:gap-12 items-center ${
                          reversed ? 'md:flex-row-reverse' : 'md:flex-row'
                        }`}
                      >
                        <div className="w-full md:w-3/5">
                          <div className="aspect-video w-full bg-muted rounded-2xl overflow-hidden border border-border shadow-lg">
                            <img
                              src={img}
                              alt={title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </div>
                        <div className="w-full md:w-2/5 text-left">
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className={`inline-flex items-center justify-center h-12 w-12 rounded-lg ${iconBg}`}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <span
                              className={`text-sm font-bold uppercase tracking-wider ${stepLabel}`}
                            >
                              {t('welcome.step_label', { n: idx + 1 })}
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-bold mb-3">
                            {title}
                          </h3>
                          <p className="text-base md:text-lg text-muted-foreground">
                            {body}
                          </p>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-auto py-6 text-center text-muted-foreground text-sm">
            {t('welcome.footer', { year: currentYear })}
          </footer>
        </div>
      </div>
    </>
  )
}
