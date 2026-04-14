import { Button } from '@/components/ui/button'
import MainLayout from '@/Layouts/MainLayout'
import { Head, Link, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

export default function VerifyEmail({ status }) {
  const { t } = useTranslation()
  const { post, processing } = useForm({})

  const submit = (e) => {
    e.preventDefault()
    post(route('verification.send'))
  }

  return (
    <>
      <Head title={t('auth.verify_email_title')} />

      <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          {t('auth.verify_email_title')}
        </h1>

        <p className="text-sm text-muted-foreground mb-4">
          {t('auth.verify_email_body')}
        </p>

        {status === 'verification-link-sent' && (
          <div className="mb-4 text-sm font-medium text-green-600">
            {t('auth.verify_email_sent')}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="mt-6 flex items-center justify-between">
            <Button disabled={processing}>
              {t('auth.resend_verification')}
            </Button>

            <Link
              href={route('logout')}
              method="post"
              as="a"
              className="text-sm text-foreground hover:text-primary underline transition-colors"
            >
              {t('nav.logout')}
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}

VerifyEmail.layout = (page) => <MainLayout children={page} />
