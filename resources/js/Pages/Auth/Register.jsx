import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import MainLayout from '@/Layouts/MainLayout'
import { Head, Link, useForm } from '@inertiajs/react'

export default function Register() {
  const currentRoute = route()

  const invitationToken = currentRoute.params.invitation_token || ''

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    invitation_token: invitationToken,
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    })
  }
  return (
    <>
      <Head title="Register" />

      <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
        <form onSubmit={submit} className="space-y-6">
          <div>
            <InputLabel
              htmlFor="name"
              value="Name"
              className="text-foreground font-medium"
            />
            <TextInput
              id="name"
              name="name"
              value={data.name}
              className="mt-2 block w-full"
              autoComplete="name"
              isFocused={true}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Seu nome"
              required
            />
            <InputError message={errors.name} className="mt-2 text-destructive" />
          </div>

          <div>
            <InputLabel
              htmlFor="email"
              value="Email"
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
              placeholder="seu@email.com"
              required
            />
            <InputError message={errors.email} className="mt-2 text-destructive" />
          </div>

          <div>
            <InputLabel
              htmlFor="password"
              value="Password"
              className="text-foreground font-medium"
            />
            <TextInput
              id="password"
              type="password"
              name="password"
              value={data.password}
              className="mt-2 block w-full"
              autoComplete="new-password"
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Senha"
              required
            />
            <InputError message={errors.password} className="mt-2 text-destructive" />
          </div>

          <div>
            <InputLabel
              htmlFor="password_confirmation"
              value="Confirm Password"
              className="text-foreground font-medium"
            />
            <TextInput
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              value={data.password_confirmation}
              className="mt-2 block w-full"
              autoComplete="new-password"
              onChange={(e) => setData('password_confirmation', e.target.value)}
              placeholder="Confirme a senha"
              required
            />
            <InputError
              message={errors.password_confirmation}
              className="mt-2 text-destructive"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href={route('login')}
              className="text-sm text-foreground hover:text-primary transition-colors duration-200"
            >
              Already registered?
            </Link>
            <PrimaryButton disabled={processing}>Register</PrimaryButton>
          </div>
        </form>
      </div>
    </>
  )
}
Register.layout = (page) => <MainLayout children={page} />
