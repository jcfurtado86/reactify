import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissionGate } from '@/lib/usePermissionGate'
import { PermissionProvider } from '@/Context/PermissionContext'

// Mock do usePage — simula as props Inertia que HandleInertiaRequests injeta.
vi.mock('@inertiajs/react', () => ({
  usePage: () => ({
    props: {
      auth: {
        permissions: [
          'persona.manage',
          'persona.view',
          'goal.view',
          'sprint.manage',
        ],
        currentProjectRole: 'team',
      },
    },
  }),
}))

// Mock do i18n — retorna a chave como string pra facilitar assercoes.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (typeof opts === 'object' && opts.defaultValue) return opts.defaultValue
      if (typeof opts === 'object') {
        return Object.entries(opts).reduce(
          (s, [k, v]) => s.replace(`{{${k}}}`, v),
          key,
        )
      }
      return key
    },
  }),
}))

const wrapper = ({ children }) => (
  <PermissionProvider
    permissions={[
      'persona.manage',
      'persona.view',
      'goal.view',
      'sprint.manage',
    ]}
  >
    {children}
  </PermissionProvider>
)

describe('usePermissionGate', () => {
  it('retorna allowed=true para permissao presente', () => {
    const { result } = renderHook(() => usePermissionGate('persona.manage'), {
      wrapper,
    })
    expect(result.current.allowed).toBe(true)
    expect(result.current.reason).toBeNull()
    expect(result.current.role).toBe('team')
  })

  it('retorna allowed=false com reason para permissao ausente', () => {
    const { result } = renderHook(() => usePermissionGate('goal.manage'), {
      wrapper,
    })
    expect(result.current.allowed).toBe(false)
    expect(result.current.reason).toBeTruthy()
    expect(typeof result.current.reason).toBe('string')
    expect(result.current.reason.length).toBeGreaterThan(0)
  })

  it('retorna allowed=true quando slot e null/vazio (sem gate)', () => {
    const { result: r1 } = renderHook(() => usePermissionGate(null), {
      wrapper,
    })
    expect(r1.current.allowed).toBe(true)

    const { result: r2 } = renderHook(() => usePermissionGate(''), {
      wrapper,
    })
    expect(r2.current.allowed).toBe(true)
  })

  it('reason e string nao-vazia quando negado', () => {
    const { result } = renderHook(
      () => usePermissionGate('overallModel.manage'),
      { wrapper },
    )
    expect(result.current.allowed).toBe(false)
    expect(result.current.reason).toBeTruthy()
    expect(typeof result.current.reason).toBe('string')
  })

  it('funciona fora do PermissionProvider (tudo negado)', () => {
    const { result } = renderHook(() => usePermissionGate('persona.manage'))
    expect(result.current.allowed).toBe(false)
  })
})
