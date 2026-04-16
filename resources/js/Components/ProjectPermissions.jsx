import { Plus, LoaderCircle, X, UserCog, Mail } from 'lucide-react'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'
import { usePage, router } from '@inertiajs/react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toastSuccess, toastApiError } from '@/lib/toastHelpers'
export function ProjectPermissions({ project }) {
  const { t } = useTranslation()
  const { auth, errors } = usePage().props
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [inviteRows, setInviteRows] = useState([{ email: '', role: '' }])
  const [rowErrors, setRowErrors] = useState({})

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
          toastSuccess('project_permissions.toast_saved')
          setIsOpen(false)
        },
        onError: (currentError) => {
          const hasRoleError = Object.keys(currentError).some((key) =>
            key.includes('.role'),
          )
          toastApiError(
            currentError,
            hasRoleError
              ? 'project_permissions.invalid_role'
              : 'common.toast.error_save',
          )
        },
      },
    )
    setIsLoading(false)
  }
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleAddRow = () => {
    setInviteRows([...inviteRows, { email: '', role: '' }])
  }

  const handleRemoveRow = (index) => {
    const next = inviteRows.filter((_, i) => i !== index)
    setInviteRows(next.length === 0 ? [{ email: '', role: '' }] : next)
    setRowErrors({})
  }

  const handleRowChange = (index, field, value) => {
    setInviteRows(
      inviteRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    )
    if (rowErrors[index]) {
      const { [index]: _, ...rest } = rowErrors
      setRowErrors(rest)
    }
  }

  const validateRows = () => {
    const errs = {}
    const seen = new Set()

    inviteRows.forEach((row, i) => {
      const email = row.email.trim().toLowerCase()

      if (!email || !row.role) {
        errs[i] = t('project_permissions.draft_missing_fields')
        return
      }
      if (!isValidEmail(email)) {
        errs[i] = t('project_permissions.draft_invalid_email')
        return
      }
      if (users.some((u) => u.email?.toLowerCase() === email)) {
        errs[i] = t('project_permissions.draft_already_member')
        return
      }
      if (
        project?.invitations?.some((inv) => inv.email?.toLowerCase() === email)
      ) {
        errs[i] = t('project_permissions.draft_already_pending')
        return
      }
      if (seen.has(email)) {
        errs[i] = t('project_permissions.draft_duplicate')
        return
      }
      seen.add(email)
    })

    return errs
  }

  const handleSendInvites = () => {
    const errs = validateRows()
    if (Object.keys(errs).length > 0) {
      setRowErrors(errs)
      return
    }

    const invites = inviteRows.map((row) => ({
      email: row.email.trim().toLowerCase(),
      role: row.role,
    }))
    const count = invites.length
    setIsSendingInvites(true)

    router.post(
      route('projects.invitations.store', project.id),
      { invites },
      {
        preserveScroll: true,
        onSuccess: () => {
          toastSuccess('project_permissions.toast_invites_sent', { count })
          setInviteRows([{ email: '', role: '' }])
          setRowErrors({})
        },
        onError: (error) =>
          toastApiError(error, 'project_permissions.toast_invite_error'),
        onFinish: () => setIsSendingInvites(false),
      },
    )
  }

  const handleCancelInvite = (invitationId) => {
    router.delete(
      route('projects.invitations.cancel', [project.id, invitationId]),
      {
        preserveScroll: true,
        onSuccess: () => toastSuccess('project_permissions.toast_invite_cancelled'),
        onError: (error) =>
          toastApiError(error, 'project_permissions.toast_cancel_invite_error'),
      },
    )
  }

  const handleRemoveUser = async (memberId) => {
    setIsLoading(true)
    router.post(
      route('project.permissions.removeMember', project.id),
      {
        id: memberId,
      },
      {
        onSuccess: () => toastSuccess('project_permissions.toast_removed'),
        onError: (error) =>
          toastApiError(error, 'project_permissions.toast_remove_error'),
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
        <ButtonWithTooltip
          variant="secondary"
          size="icon"
          tooltipContent={t('project_permissions.title')}
          side="bottom"
        >
          <UserCog className="size-4" />
        </ButtonWithTooltip>
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
          {project?.invitations?.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              <Separator />
              <p className="text-foreground text-sm font-medium pt-2">
                {t('project_permissions.pending_invites_title')}
              </p>
              {project.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {inv.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`project_permissions.roles.${inv.role}`)} ·{' '}
                        {t('project_permissions.pending_invite_hint')}
                      </p>
                    </div>
                  </div>
                  {canManagePermissions && (
                    <ButtonWithTooltip
                      variant="ghost"
                      size="icon"
                      tooltipContent={t('project_permissions.cancel_invite')}
                      side="left"
                      onClick={() => handleCancelInvite(inv.id)}
                    >
                      <X className="size-4 text-foreground" />
                    </ButtonWithTooltip>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Seção de ações principais */}
          <div className="flex flex-col w-full gap-2 pt-4">
            <Button
              variant="default"
              onClick={handleSaveChanges}
              disabled={isLoading || isSendingInvites}
            >
              {isLoading ? t('common.processing') : t('common.save')}
            </Button>
          </div>
        </div>
        {canManagePermissions && (
          <SheetFooter>
            <div className="flex flex-col w-full gap-2 pt-4">
              <Separator />
              <div className="flex flex-col gap-2 text-left">
                <div className="text-foreground flex justify-between w-full items-center">
                  <span>{t('project_permissions.invite_user')}</span>
                  <ButtonWithTooltip
                    variant="default"
                    className="p-0 z-20 size-8"
                    tooltipContent={t('project_permissions.add_row')}
                    side="left"
                    onClick={handleAddRow}
                    disabled={isSendingInvites}
                  >
                    <Plus className="!size-5" />
                  </ButtonWithTooltip>
                </div>

                <div className="flex flex-col gap-2">
                  {inviteRows.map((row, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex gap-1 items-center">
                        <Input
                          type="email"
                          placeholder={t('project_permissions.email_placeholder')}
                          className="text-foreground"
                          value={row.email}
                          onChange={(e) =>
                            handleRowChange(index, 'email', e.target.value)
                          }
                          disabled={isSendingInvites}
                        />
                        <Select
                          value={row.role}
                          onValueChange={(v) => handleRowChange(index, 'role', v)}
                          disabled={isSendingInvites}
                        >
                          <SelectTrigger className="max-w-[30%]">
                            <SelectValue placeholder={t('project_permissions.role')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">{t('project_permissions.roles.customer')}</SelectItem>
                            <SelectItem value="domain_expert">
                              {t('project_permissions.roles.domain_expert')}
                            </SelectItem>
                            <SelectItem value="team">{t('project_permissions.roles.team')}</SelectItem>
                            <SelectItem value="administrator">
                              {t('project_permissions.roles.administrator')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(index)}
                          disabled={isSendingInvites}
                        >
                          <X className="size-4 text-foreground" />
                        </Button>
                      </div>
                      {rowErrors[index] && (
                        <span className="text-destructive text-xs">
                          {rowErrors[index]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="default"
                  className="mt-2"
                  onClick={handleSendInvites}
                  disabled={isSendingInvites}
                >
                  {isSendingInvites ? (
                    <LoaderCircle className="!size-5 animate-spin" />
                  ) : (
                    t('project_permissions.send_invites', {
                      count: inviteRows.length,
                    })
                  )}
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
