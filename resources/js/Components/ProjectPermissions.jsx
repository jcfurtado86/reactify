import { Plus, LoaderCircle, X, UserCog } from 'lucide-react'
import { usePage, router } from '@inertiajs/react'
import axios from 'axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
export function ProjectPermissions({ project }) {
  const { t } = useTranslation()
  const { auth, errors } = usePage().props
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [newUserRole, setNewUserRole] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')

  // Variável de controle de permissão
  const canManagePermissions = currentUserRole === 'administrator'

  useEffect(() => {
    if (isOpen) {
      if (!project) return
      const currentUsers = normalizeProjectUsers(project?.users)
      setUsers(currentUsers)
      const currentUserId = auth?.user?.id
      setCurrentUserRole(
        currentUsers.find((user) => user.id === currentUserId)?.role || '',
      )
    }
  }, [isOpen, project])

  const normalizeProjectUsers = (projectUsers) => {
    // Uma verificação de segurança para garantir que estamos recebendo um array.
    if (!Array.isArray(projectUsers)) {
      console.error('A entrada fornecida não é um array.')
      return []
    }

    return projectUsers.map((user) => {
      // Para cada usuário, separamos o objeto 'pivot' do 'resto das propriedades'.
      const { pivot, user_id, ...restOfUser } = user

      // Retornamos um novo objeto contendo:
      // 1. Todas as propriedades originais do usuário (exceto 'pivot').
      // 2. A nova propriedade 'role', extraída de 'pivot'.
      return {
        ...restOfUser,
        role: pivot?.role, // Usamos optional chaining (?.) para evitar erros se 'pivot' não existir.
        id: user_id,
      }
    })
  }

  // Função para salvar as alterações de roles
  const handleSaveChanges = async () => {
    setIsLoading(true)
    router.post(
      route('project.permissions.update', project.id),
      { users },
      {
        onSuccess: () => {
          setIsOpen(false)
        },
        onError: (currentError) => {
          const errorKeys = Object.keys(currentError)
          const hasRoleError = errorKeys.some((key) => key.includes('.role'))
          if (hasRoleError) {
            toast.error('Função inválida! Verifique e tente novamente.')
            console.error('Função inválida! Verifique e tente novamente.')
          }
        },
      },
    )
    setIsLoading(false)
  }
  // Função para adicionar um novo usuário ao projeto
  const handleAddUser = async () => {
    if (!newUserEmail) return
    setIsAddingUser(true)

    router.post(
      route('projects.invitations.store', project.id),
      {
        email: newUserEmail,
        role: newUserRole,
      },
      {
        onSuccess: () => {
          normalizeProjectUsers(project?.users)
        },
        onError: (error) => {
          // toast.error('Failed to add user')
        },
      },
    )
    setIsAddingUser(false)
    setNewUserEmail('') // Limpa o input
  }

  const handleRemoveUser = async (memberId) => {
    setIsLoading(true)
    router.post(
      route('project.permissions.removeMember', project.id),
      {
        id: memberId,
      },
      {
        onSuccess: () => {},
        onError: (error) => {
          // toast.error('Failed to remove user')
        },
      },
    )
    setIsLoading(false)
  }

  // Função para alterar o papel de um usuário
  const handleRoleChange = (userId, newRole) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user,
      ),
    )
  }

  // Efeito para buscar os dados quando o sheet for aberto

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" title={t('project_permissions.title')} size="icon">
          <UserCog className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="max-w-[370px] sm:max-w-[450px] md:max-w-[470px]">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {t('project_permissions.title')}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {canManagePermissions
              ? t('project_permissions.invite_user')
              : t('project_permissions.cannot_manage_permissions')}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
          {!isLoading &&
            users
              // .filter((user) => user.id !== auth.user.id)
              .map((user) => {
                const isOwner =
                  user.id == auth.user.id && user.role === 'administrator'
                return (
                  <div
                    key={user.id}
                    className="flex w-full items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <p className="font-medium text-foreground">
                        {user.name}
                        {isOwner ? ' ' + t('project_permissions.you') : ''}
                      </p>
                    </div>
                    {!isOwner ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) =>
                            handleRoleChange(user.id, newRole)
                          }
                          disabled={!canManagePermissions || isOwner}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder={t('project_permissions.role')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">
                              {t('project_permissions.roles.customer')}
                            </SelectItem>
                            <SelectItem value="domain_expert">
                              {t('project_permissions.roles.domain_expert')}
                            </SelectItem>
                            <SelectItem value="team">
                              {t('project_permissions.roles.team')}
                            </SelectItem>
                            <SelectItem value="administrator">
                              {t('project_permissions.roles.administrator')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={!canManagePermissions || isOwner}
                        >
                          <X className="size-4 text-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mr-12">
                        {user.role.toUpperCase()}
                      </p>
                    )}
                  </div>
                )
              })}
          {/* Seção de ações principais */}
          <div className="flex flex-col w-full gap-2 pt-4">
            <Button
              variant="default"
              onClick={handleSaveChanges}
              disabled={isLoading || isAddingUser}
            >
              {isLoading ? t('common.processing') : t('common.save')}
            </Button>
          </div>
        </div>
        {canManagePermissions && (
          <SheetFooter>
            <div className="flex flex-col w-full gap-2 pt-4">
              <Separator />
              {/* Seção para adicionar novo usuário */}
              <div className="flex flex-col gap-2 text-left ">
                <div className="text-foreground flex justify-between w-full">
                  {t('project_permissions.invite_user')}
                  <Button
                    variant="default"
                    className="p-0 z-20 size-8"
                    onClick={handleAddUser}
                    disabled={isAddingUser || !newUserEmail}
                  >
                    {isAddingUser ? (
                      <LoaderCircle className="!size-5 animate-spin" />
                    ) : (
                      <Plus className="!size-5" />
                    )}
                  </Button>
                </div>
                <span className="text-destructive text-xs">{errors.email}</span>
                <span className="text-destructive text-xs">{errors.role}</span>
                <div className="flex gap-1">
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('project_permissions.email_placeholder')}
                    className="text-foreground"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    disabled={isAddingUser}
                  />
                  <Select
                    value={newUserRole}
                    onValueChange={(e) => setNewUserRole(e)}
                  >
                    <SelectTrigger className="max-w-[30%]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="domain_expert">
                        Domain Expert
                      </SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="administrator">
                        Administrator
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
