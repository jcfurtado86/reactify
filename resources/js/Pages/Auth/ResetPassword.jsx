import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import MainLayout from '@/Layouts/MainLayout'
import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

export default function ResetPassword({ token, email }) {
  const { t } = useTranslation()
  const { data, setData, post, processing, errors, reset } = useForm({
    token: token,
    email: email,
    password: '',
    password_confirmation: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('password.store'), {
      onFinish: () => reset('password', 'password_confirmation'),
    })
  }

  return (
    <>
      <Head title={t('auth.reset_password_title')} />

      <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          {t('auth.reset_password_title')}
        </h1>

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
              autoComplete="username"
              onChange={(e) => setData('email', e.target.value)}
            />
            <InputError
              message={errors.email}
              className="mt-2 text-destructive"
            />
          </div>

          <div>
            <InputLabel
              htmlFor="password"
              value={t('auth.password')}
              className="text-foreground font-medium"
            />
            <TextInput
              id="password"
              type="password"
              name="password"
              value={data.password}
              className="mt-2 block w-full"
              autoComplete="new-password"
              isFocused={true}
              onChange={(e) => setData('password', e.target.value)}
            />
            <InputError
              message={errors.password}
              className="mt-2 text-destructive"
            />
          </div>

          <div>
            <InputLabel
              htmlFor="password_confirmation"
              value={t('auth.confirm_password')}
              className="text-foreground font-medium"
            />
            <TextInput
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              value={data.password_confirmation}
              className="mt-2 block w-full"
              autoComplete="new-password"
              onChange={(e) => setData('password_confirmation', e.target.value)}
            />
            <InputError
              message={errors.password_confirmation}
              className="mt-2 text-destructive"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <PrimaryButton disabled={processing}>
              {t('auth.reset_password_title')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  )
}

ResetPassword.layout = (page) => <MainLayout children={page} />
