import { Head, Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { Particles } from '@/components/magicui/particles'
import { useTranslation } from 'react-i18next'
import { Trans } from 'react-i18next'

export default function Welcome({ auth, laravelVersion, phpVersion }) {
  const { t } = useTranslation()
  return (
    <>
      <Head title={t('welcome.head_title')} />

      <div className="min-h-screen bg-background text-foreground">
        <Particles className="absolute inset-0 w-full h-full" />
        <div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-primary/20">
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
                components={{ brand: <span className="text-primary" /> }}
              />
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl">
              {t('welcome.hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                as={'button'}
                href={route('register')}
                className="px-8 py-4 bg-primary text-background hover:bg-primary/90 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t('welcome.register')}
              </Link>
              <Link
                href={route('login')}
                className="px-8 py-4 border-2 border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl font-bold text-lg transition-all duration-300"
              >
                {t('welcome.login')}
              </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-16 max-w-7xl">
              {[
                {
                  title: t('welcome.feature_components_title'),
                  description: t('welcome.feature_components_body'),
                },
                {
                  title: t('welcome.feature_realtime_title'),
                  description: t('welcome.feature_realtime_body'),
                },
                {
                  title: t('welcome.feature_cloud_title'),
                  description: t('welcome.feature_cloud_body'),
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-card text-card-foreground backdrop-blur-lg p-6 rounded-xl border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="text-primary text-2xl mb-4">✨</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="absolute bottom-0 py-6 text-center text-muted-foreground text-sm">
            {t('welcome.footer')}
          </footer>
        </div>
      </div>
    </>
  )
}
