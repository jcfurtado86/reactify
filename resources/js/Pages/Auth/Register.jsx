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

      <div className="bg-gray-2 p-8 rounded-xl shadow-xl w-full max-w-md">
        <form onSubmit={submit}>
          <div>
            <InputLabel htmlFor="name" value="Name" className="text-white" />

            <TextInput
              id="name"
              name="name"
              value={data.name}
              className="mt-1 block w-full bg-gray-1 border-gray-2 text-white focus:border-purple-2 focus:ring-purple-2"
              autoComplete="name"
              isFocused={true}
              onChange={(e) => setData('name', e.target.value)}
              required
            />

            <InputError message={errors.name} className="mt-2" />
          </div>

          <div className="mt-4">
            <InputLabel htmlFor="email" value="Email" className="text-white" />

            <TextInput
              id="email"
              type="email"
              name="email"
              value={data.email}
              className="mt-1 block w-full bg-gray-1 border-gray-2 text-white focus:border-purple-2 focus:ring-purple-2"
              autoComplete="username"
              onChange={(e) => setData('email', e.target.value)}
              required
            />

            <InputError message={errors.email} className="mt-2" />
          </div>

          <div className="mt-4">
            <InputLabel
              htmlFor="password"
              value="Password"
              className="text-white"
            />

            <TextInput
              id="password"
              type="password"
              name="password"
              value={data.password}
              className="mt-1 block w-full bg-gray-1 border-gray-2 text-white focus:border-purple-2 focus:ring-purple-2"
              autoComplete="new-password"
              onChange={(e) => setData('password', e.target.value)}
              required
            />

            <InputError message={errors.password} className="mt-2" />
          </div>

          <div className="mt-4">
            <InputLabel
              htmlFor="password_confirmation"
              value="Confirm Password"
              className="text-white"
            />

            <TextInput
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              value={data.password_confirmation}
              className="mt-1 block w-full bg-gray-1 border-gray-2 text-white focus:border-purple-2 focus:ring-purple-2"
              autoComplete="new-password"
              onChange={(e) => setData('password_confirmation', e.target.value)}
              required
            />

            <InputError
              message={errors.password_confirmation}
              className="mt-2"
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Link
              href={route('login')}
              className="text-sm text-white hover:text-purple-2 transition-colors duration-200"
            >
              Already registered?
            </Link>

            <PrimaryButton
              className="bg-purple-2 hover:bg-purple-1 text-white"
              disabled={processing}
            >
              Register
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  )
}
Register.layout = (page) => <MainLayout children={page} />
