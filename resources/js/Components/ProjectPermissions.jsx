import { Plus, LoaderCircle, X } from 'lucide-react'
import { usePage, router } from '@inertiajs/react'
import axios from 'axios'

export function ProjectPermissions({ project }) {
  const { auth, errors } = usePage().props
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [newUserRole, setNewUserRole] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')

  // Variável de controle de permissão
  const canManagePermissions = currentUserRole === 'admin'

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
        onError: (error) => {
          // console.error('Failed to update permissions:', error)
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
          setNewUserEmail('') // Limpa o input
          // fetchPermissions() // Recarrega a lista de usuários
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
        onSuccess: () => {
          // fetchPermissions() // Recarrega a lista de usuários
        },
        onError: (error) => {
          // toast.error('Failed to remove user')
        },
      },
    )
    setIsLoading(false)
    // await fetchPermissions() // Recarrega a lista de usuários
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
        <Button variant="outline">Permissões</Button>
      </SheetTrigger>
      <SheetContent className="w-[370px] sm:w-[450px] md:w-[470px]">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            Gerenciar Permissões : {currentUserRole?.toUpperCase()}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {canManagePermissions
              ? 'Adicione, remova ou edite o acesso dos membros a este projeto.'
              : 'Você pode visualizar os membros do projeto.'}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          {isLoading && <p className="text-muted-foreground">Carregando...</p>}
          {!isLoading &&
            users
              .filter((user) => user.id !== auth.user.id)
              .map((user) => {
                const isOwner = user.id == auth.user.id && user.role === 'admin'
                return (
                  <div
                    key={user.id}
                    className="flex w-full items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) =>
                          handleRoleChange(user.id, newRole)
                        }
                        disabled={!canManagePermissions || isOwner}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="domain_expert">
                            Domain Expert
                          </SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                          <SelectItem value="facilitator">
                            Facilitator
                          </SelectItem>
                          <SelectItem value="administrator">
                            Administrator
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
                  </div>
                )
              })}
          {/* Seção de ações principais */}
          <div className="flex flex-col w-full gap-2 pt-4">
            <SheetClose asChild>
              <Button variant="outline" className="text-muted-foreground">
                Cancelar
              </Button>
            </SheetClose>
            <Button
              variant="default"
              onClick={handleSaveChanges}
              disabled={isLoading || isAddingUser}
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
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
                  Adicionar novo membro
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
                    placeholder="Insira o email"
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
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Observador</SelectItem>
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
