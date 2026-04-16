import { usePermissions } from '@/Context/PermissionContext'
import { usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

// Hook central de gating no frontend. Dado um slot do PermissionEnum
// (ex: 'persona.manage'), devolve:
//
//   {
//     allowed: boolean,   // o usuário atual pode executar essa ação?
//     reason: string|null // mensagem pronta pra tooltip quando !allowed
//     role: string|null   // papel corrente no projeto (valor do enum)
//   }
//
// Padrão de uso:
//   const { allowed, reason } = usePermissionGate('persona.manage')
//   <Button disabled={!allowed} title={reason || ''}>Criar</Button>
//
// Para esconder em vez de desabilitar (regra: criações caras como "Gerar
// com IA"), inverte: `if (!allowed) return null`.
export function usePermissionGate(slot) {
  const { can } = usePermissions()
  const { t } = useTranslation()
  const role = usePage().props.auth?.currentProjectRole || null

  // Slot vazio/null = sem gate — comporta como "liberado".
  // Útil para componentes que aceitam slot opcional.
  if (!slot) {
    return { allowed: true, reason: null, role }
  }

  const allowed = can(slot)

  if (allowed) {
    return { allowed: true, reason: null, role }
  }

  const roleLabel = role
    ? t(`project_permissions.roles.${role}`)
    : null

  const actionLabel = t(`permission_gate.actions.${slot}`, { defaultValue: slot })

  const reason = roleLabel
    ? t('permission_gate.disabled_with_role', {
        role: roleLabel,
        action: actionLabel,
      })
    : t('permission_gate.disabled_no_role', {
        action: actionLabel,
      })

  return { allowed: false, reason, role }
}
