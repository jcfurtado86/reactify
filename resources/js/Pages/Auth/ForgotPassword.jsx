import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import MainLayout from '@/Layouts/MainLayout'
import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

export default function ForgotPassword({ status }) {
  const { t } = useTranslation()
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('password.email'))
  }

  return (
    <>
      <Head title={t('auth.forgot_password_title')} />

      <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          {t('auth.forgot_password_title')}
        </h1>

        <p className="mb-4 text-sm text-muted-foreground">
          {t('auth.forgot_password_body')}
        </p>

        {status && (
          <div className="mb-4 text-sm font-medium text-green-600">
            {status}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <InputLabel
              htmlFor="email"
              value={t('auth.email')}
              className="text-foreground font-medium"
            />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={data.email}
              className="mt-2 block w-full"
              isFocused={true}
              onChange={(e) => setData('email', e.target.value)}
              placeholder={t('auth.email_placeholder')}
            />
            <InputError
              message={errors.email}
              className="mt-2 text-destructive"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <PrimaryButton disabled={processing}>
              {t('auth.email_password_reset_link')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  )
}

ForgotPassword.layout = (page) => <MainLayout children={page} />
