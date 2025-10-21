import Checkbox from '@/Components/Checkbox'
import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import MainLayout from '@/Layouts/MainLayout'
import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import { Computer } from 'lucide-react'

const Login = ({ status, canResetPassword }) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('login'), {
      onFinish: () => reset('password'),
    })
  }
  return (
    <>
      <Head title="Log in" />
      <div className="bg-card border border-border p-8 rounded-xl w-full max-w-md shadow-lg">
        {status && (
          <div className="mb-4 text-sm font-medium text-success-foreground bg-success p-3 rounded-lg border border-success-border">
            {status}
          </div>
        )}
        <div className="mb-6 text-center flex flex-col gap-4">
          <Button className="w-full">
            <img
              alt="Google Logo"
              src="https://img.icons8.com/?size=100&id=Mhl1TfJLdkh5&format=png&color=000000"
              className="size-8"
            />

            <a disabled={processing} href={'/auth/github/redirect'}>
              Continue with GitHub
            </a>
          </Button>
          <Button className="w-full">
            <img
              alt="Google Logo"
              src="https://img.icons8.com/?size=100&id=V5cGWnc9R4xj&format=png&color=000000"
              className="size-8"
            />
            <a disabled={processing} href={'/auth/google/redirect'}>
              Continue with Google
            </a>
          </Button>

          <div className="flex items-center justify-between w-full">
            <Separator className="w-[45%]" />
            <p className="flex items-center justify-center">or</p>
            <Separator className="w-[45%]" />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
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
              className="mt-2 block w-full bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary rounded-lg px-3 py-2 text-sm transition-colors"
              autoComplete="username"
              isFocused={true}
              onChange={(e) => setData('email', e.target.value)}
              placeholder="Enter your email"
            />
            <InputError
              message={errors.email}
              className="mt-2 text-destructive"
            />
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
              className="mt-2 block w-full bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary rounded-lg px-3 py-2 text-sm transition-colors"
              autoComplete="current-password"
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Enter your password"
            />
            <InputError
              message={errors.password}
              className="mt-2 text-destructive"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <Checkbox
                name="remember"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
                className="border-input text-primary focus:ring-primary focus:ring-offset-0 rounded"
              />
              <span className="ml-2 text-sm text-foreground select-none">
                Remember me
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4">
            {canResetPassword && (
              <Link
                href={route('password.request')}
                className="text-sm !text-foreground hover:text-primary transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            )}
            <PrimaryButton
              className="bg-primary hover:bg-primary/90 !text-background font-semibold px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={processing}
              id="login-button"
            >
              {processing ? 'Signing in...' : 'Log in'}
            </PrimaryButton>
          </div>
        </form>

        <div className="mt-6 text-center flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href={route('register')}
              className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}

Login.layout = (page) => <MainLayout children={page} />

export default Login
