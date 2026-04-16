import React from 'react'
import { usePermissionGate } from '@/lib/usePermissionGate'
import ButtonWithTooltip from '@/Components/ButtonWithTooltip'

// Wrapper declarativo para botões com gate de permissão.
//
//   <GatedButton slot="persona.manage" onClick={...}>Criar persona</GatedButton>
//
// Quando o usuário pode: renderiza um ButtonWithTooltip sem tooltip (ou com
// o tooltip passado via prop `tooltip`).
// Quando não pode: renderiza o mesmo botão desabilitado, com tooltip
// explicando o motivo (vindo do i18n).
//
// Se `hideWhenDenied` for true, esconde o botão inteiro em vez de
// desabilitar. Uso: criações caras (geração por IA), que já não fazem
// sentido tentar.
export function GatedButton({
  slot,
  hideWhenDenied = false,
  tooltip,
  disabled: extraDisabled = false,
  side = 'top',
  children,
  ...rest
}) {
  const { allowed, reason } = usePermissionGate(slot)

  if (!allowed && hideWhenDenied) {
    return null
  }

  return (
    <ButtonWithTooltip
      {...rest}
      disabled={!allowed || extraDisabled}
      tooltipContent={allowed ? tooltip || null : reason}
      side={side}
    >
      {children}
    </ButtonWithTooltip>
  )
}

// Wrapper mais genérico: usado quando o conteúdo não é um botão
// (ex: um input inline, um select). Renderiza children dentro de um
// ButtonWithTooltip wrapper só quando bloqueado; quando permitido, passa
// children transparentemente. Não força `disabled` — isso é responsabilidade
// do caller, via `gated.allowed` / `gated.reason`.
export function usePermissionProps(slot) {
  const { allowed, reason } = usePermissionGate(slot)
  return {
    allowed,
    reason,
    // Props prontos pra espalhar num Button/Input:
    //   <Button {...gated.buttonProps} onClick={...}>Editar</Button>
    buttonProps: {
      disabled: !allowed,
      title: allowed ? undefined : reason,
    },
  }
}

export default GatedButton
