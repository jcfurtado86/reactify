import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import MainLayout from '@/Layouts/MainLayout'
import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

export default function ConfirmPassword() {
  const { t } = useTranslation()
  const { data, setData, post, processing, errors, reset } = useForm({
    password: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('password.confirm'), {
      onFinish: () => reset('password'),
    })
  }

  return (
    <>
      <Head title={t('auth.confirm_password_title')} />

      <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          {t('auth.confirm_password_title')}
        </h1>

        <p className="mb-4 text-sm text-muted-foreground">
          {t('auth.confirm_password_body')}
        </p>

        <form onSubmit={submit} className="space-y-4">
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
              isFocused={true}
              onChange={(e) => setData('password', e.target.value)}
            />
            <InputError
              message={errors.password}
              className="mt-2 text-destructive"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <PrimaryButton disabled={processing}>
              {t('common.confirm')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  )
}

ConfirmPassword.layout = (page) => <MainLayout children={page} />
