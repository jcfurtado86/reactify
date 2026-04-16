import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermissionProvider, usePermissions } from '@/Context/PermissionContext'

const TestConsumer = ({ slot }) => {
  const { can, permissions } = usePermissions()
  return (
    <div>
      <span data-testid="result">{can(slot) ? 'allowed' : 'denied'}</span>
      <span data-testid="count">{permissions.length}</span>
    </div>
  )
}

describe('PermissionContext', () => {
  it('can() retorna true pra permissao presente', () => {
    render(
      <PermissionProvider permissions={['persona.manage', 'goal.view']}>
        <TestConsumer slot="persona.manage" />
      </PermissionProvider>,
    )
    expect(screen.getByTestId('result')).toHaveTextContent('allowed')
  })

  it('can() retorna false pra permissao ausente', () => {
    render(
      <PermissionProvider permissions={['goal.view']}>
        <TestConsumer slot="persona.manage" />
      </PermissionProvider>,
    )
    expect(screen.getByTestId('result')).toHaveTextContent('denied')
  })

  it('can() retorna false com array vazio', () => {
    render(
      <PermissionProvider permissions={[]}>
        <TestConsumer slot="persona.manage" />
      </PermissionProvider>,
    )
    expect(screen.getByTestId('result')).toHaveTextContent('denied')
  })

  it('funciona sem Provider (fallback seguro)', () => {
    render(<TestConsumer slot="persona.manage" />)
    expect(screen.getByTestId('result')).toHaveTextContent('denied')
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('expoe o array completo de permissions', () => {
    render(
      <PermissionProvider permissions={['a.view', 'b.manage', 'c.view']}>
        <TestConsumer slot="a.view" />
      </PermissionProvider>,
    )
    expect(screen.getByTestId('count')).toHaveTextContent('3')
  })
})
