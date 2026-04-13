import { Button } from '@/components/ui/button'
import MainLayout from '@/Layouts/MainLayout'
import { Head, Link, useForm } from '@inertiajs/react'

export default function VerifyEmail({ status }) {
  const { post, processing } = useForm({})

  const submit = (e) => {
    e.preventDefault()

    post(route('verification.send'))
  }

  return (
    <>
      <Head title="Email Verification" />

      <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          Verifique seu e-mail
        </h1>

        <p className="text-sm text-muted-foreground mb-4">
          Thanks for signing up! Before getting started, could you verify your
          email address by clicking on the link we just emailed to you? If you
          didn't receive the email, we will gladly send you another.
        </p>

        {status === 'verification-link-sent' && (
          <div className="mb-4 text-sm font-medium text-green-600">
            A new verification link has been sent to the email address you
            provided during registration.
          </div>
        )}

        <form onSubmit={submit}>
          <div className="mt-6 flex items-center justify-between">
            <Button disabled={processing}>Resend Verification Email</Button>

            <Link
              href={route('logout')}
              method="post"
              as="a"
              className="text-sm text-foreground hover:text-primary underline transition-colors"
            >
              Log Out
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}

VerifyEmail.layout = (page) => <MainLayout children={page} />
