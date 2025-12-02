import React, { useState, useRef } from 'react'
import MainLayout from '@/Layouts/MainLayout'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { Transition } from '@headlessui/react'
// Componentes de UI (Assumindo que estes caminhos existem no seu projeto)
import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import Modal from '@/Components/Modal'
import SecondaryButton from '@/Components/SecondaryButton'

// --- COMPONENTES FILHOS ---

const FormularioEditarPerfil = ({
  mustVerifyEmail,
  status,
  className = '',
  user,
}) => {
  // Para upload de arquivos em atualizações, usamos POST com _method: PATCH
  const { data, setData, post, errors, processing, recentlySuccessful } =
    useForm({
      _method: 'PATCH',
      name: user.name,
      email: user.email,
      avatar: null, // Novo campo para o avatar
    })

  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || null)

  const submit = (e) => {
    e.preventDefault()
    // A rota deve apontar para onde você processa a atualização (ex: profile.update)
    post(route('profile.update'), {
      preserveScroll: true,
    })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setData('avatar', file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  return (
    <section
      className={`p-6 bg-card text-card-foreground rounded-lg ${className}`}
    >
      <header>
        <h2 className="text-lg font-medium">Informações do Perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize as informações do seu perfil, endereço de e-mail e foto.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6"
        encType="multipart/form-data"
      >
        {/* Campo de Avatar */}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar atual"
                className="h-16 w-16 object-cover rounded-full border border-gray-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <span className="text-xs">Sem foto</span>
              </div>
            )}
          </div>
          <div>
            <InputLabel htmlFor="avatar" value="Foto de Perfil" />
            <Input
              id="avatar"
              type="file"
              // className="mt-1 block w-full text-sm text-slate-500
              //           file:mr-4 file:py-2 file:px-4
              //           file:rounded-full file:border-0
              //           file:text-sm file:font-semibold
              //           file:bg-primary file:text-primary-foreground
              //           hover:file:bg-primary/90"
              onChange={handleAvatarChange}
              accept="image/*"
            />
            <InputError className="mt-2" message={errors.avatar} />
          </div>
        </div>

        <div>
          <InputLabel htmlFor="name" value="Nome" />
          <Input
            id="name"
            className="mt-1 block w-full"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            required
            autoComplete="name"
          />
          <InputError className="mt-2" message={errors.name} />
        </div>

        <div>
          <InputLabel htmlFor="email" value="E-mail" />
          <Input
            id="email"
            type="email"
            className="mt-1 block w-full"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            required
            autoComplete="username"
          />
          <InputError className="mt-2" message={errors.email} />
        </div>

        {mustVerifyEmail && user.email_verified_at === null && (
          <div>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu endereço de e-mail não foi verificado.
              <Link
                href={route('verification.send')}
                method="post"
                as="button"
                className="ml-1 rounded-md text-sm underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Clique aqui para reenviar o e-mail de verificação.
              </Link>
            </p>

            {status === 'verification-link-sent' && (
              <div className="mt-2 text-sm font-medium text-green-600">
                Um novo link de verificação foi enviado para o seu e-mail.
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button disabled={processing}>Salvar</Button>

          <Transition
            show={recentlySuccessful}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-sm text-muted-foreground">Salvo.</p>
          </Transition>
        </div>
      </form>
    </section>
  )
}

const FormularioAlterarSenha = ({ className = '' }) => {
  const passwordInput = useRef()
  const currentPasswordInput = useRef()

  const { data, setData, errors, put, reset, processing, recentlySuccessful } =
    useForm({
      current_password: '',
      password: '',
      password_confirmation: '',
    })

  const updatePassword = (e) => {
    e.preventDefault()

    put(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errors) => {
        if (errors.password) {
          reset('password', 'password_confirmation')
          passwordInput.current.focus()
        }

        if (errors.current_password) {
          reset('current_password')
          currentPasswordInput.current.focus()
        }
      },
    })
  }

  return (
    <section
      className={`p-6 bg-card text-card-foreground rounded-lg ${className}`}
    >
      <header>
        <h2 className="text-lg font-medium">Alterar Senha</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Certifique-se de que sua conta esteja usando uma senha longa e
          aleatória para permanecer segura.
        </p>
      </header>

      <form onSubmit={updatePassword} className="mt-6 space-y-6">
        <div>
          <InputLabel htmlFor="current_password" value="Senha Atual" />
          <Input
            id="current_password"
            ref={currentPasswordInput}
            value={data.current_password}
            onChange={(e) => setData('current_password', e.target.value)}
            type="password"
            className="mt-1 block w-full"
            autoComplete="current-password"
          />
          <InputError message={errors.current_password} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="password" value="Nova Senha" />
          <Input
            id="password"
            ref={passwordInput}
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            type="password"
            className="mt-1 block w-full"
            autoComplete="new-password"
          />
          <InputError message={errors.password} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="password_confirmation" value="Confirmar Senha" />
          <Input
            id="password_confirmation"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
            type="password"
            className="mt-1 block w-full"
            autoComplete="new-password"
          />
          <InputError message={errors.password_confirmation} className="mt-2" />
        </div>

        <div className="flex items-center gap-4">
          <Button disabled={processing}>Salvar</Button>

          <Transition
            show={recentlySuccessful}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-sm text-muted-foreground">Salvo.</p>
          </Transition>
        </div>
      </form>
    </section>
  )
}

const FormularioDeletarConta = ({ className = '' }) => {
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false)
  const passwordInput = useRef()

  const {
    data,
    setData,
    delete: destroy,
    processing,
    reset,
    errors,
    clearErrors,
  } = useForm({
    password: '',
  })

  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true)
  }

  const deleteUser = (e) => {
    e.preventDefault()

    destroy(route('profile.destroy'), {
      preserveScroll: true,
      onSuccess: () => closeModal(),
      onError: () => passwordInput.current.focus(),
      onFinish: () => reset(),
    })
  }

  const closeModal = () => {
    setConfirmingUserDeletion(false)
    clearErrors()
    reset()
  }

  return (
    <section className={`space-y-6 ${className}`}>
      <header>
        <h2 className="text-lg font-medium">Deletar Conta</h2>
        <p className="mt-1 text-sm">
          Depois que sua conta for excluída, todos os seus recursos e dados
          serão excluídos permanentemente. Antes de excluir sua conta, baixe
          quaisquer dados ou informações que deseja reter.
        </p>
      </header>

      <Button variant="destructive" onClick={confirmUserDeletion}>
        Deletar Conta
      </Button>

      <Modal show={confirmingUserDeletion} onClose={closeModal}>
        <form onSubmit={deleteUser} className="p-6">
          <h2 className="text-lg font-medium">
            Tem certeza de que deseja excluir sua conta?
          </h2>

          <p className="mt-1 text-sm">
            Depois que sua conta for excluída, todos os seus recursos e dados
            serão excluídos permanentemente. Por favor, digite sua senha para
            confirmar que você deseja excluir permanentemente sua conta.
          </p>

          <div className="mt-6">
            <InputLabel htmlFor="password" value="Senha" className="sr-only" />

            <Input
              id="password"
              type="password"
              name="password"
              ref={passwordInput}
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              className="mt-1 block w-3/4"
              isFocused
              placeholder="Senha"
            />

            <InputError message={errors.password} className="mt-2" />
          </div>

          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>Cancelar</SecondaryButton>

            <Button
              variant="destructive"
              className="ms-3"
              disabled={processing}
            >
              Deletar Conta
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

// --- COMPONENTE PRINCIPAL ---

const Edit = ({ mustVerifyEmail, status }) => {
  // Pega o usuário do contexto global para passar aos filhos
  const user = usePage().props.auth.user

  return (
    <>
      <Head title="Perfil" />
      <div className="py-0">
        <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
          <div className="p-4 sm:rounded-lg sm:p-8">
            <FormularioEditarPerfil
              mustVerifyEmail={mustVerifyEmail}
              status={status}
              className="max-w-xl"
              user={user}
            />
          </div>

          <div className="bg-transparent text-foreground p-4 sm:rounded-lg sm:p-8">
            <FormularioAlterarSenha className="max-w-xl" />
          </div>

          <div className="bg-transparent text-foreground p-4 sm:rounded-lg sm:p-8">
            <FormularioDeletarConta className="max-w-xl" />
          </div>
        </div>
      </div>
    </>
  )
}

Edit.layout = (page) => <MainLayout children={page} />
export default Edit
