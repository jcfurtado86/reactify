import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MotionDivOptions from '@/Components/MotionDivOptions'
import { PermissionProvider } from '@/Context/PermissionContext'
import { TooltipProvider } from '@/components/ui/tooltip'

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({
    props: {
      auth: {
        permissions: ['persona.manage', 'persona.view'],
        currentProjectRole: 'domain_expert',
      },
    },
  }),
}))

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => key,
      i18n: { language: 'pt' },
    }),
  }
})

// framer-motion: renderiza sem animacao pra testes
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
  }
})

const renderWithPermissions = (permissions, props) =>
  render(
    <TooltipProvider>
      <PermissionProvider permissions={permissions}>
        <MotionDivOptions
          isHovered={true}
          isEditing={false}
          isTemporary={false}
          disabled={false}
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          {...props}
        />
      </PermissionProvider>
    </TooltipProvider>,
  )

describe('MotionDivOptions com slot', () => {
  it('botoes habilitados quando usuario tem permissao', () => {
    renderWithPermissions(['persona.manage'], { slot: 'persona.manage' })
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled()
    })
  })

  it('botoes desabilitados quando usuario NAO tem permissao', () => {
    renderWithPermissions(['persona.view'], { slot: 'persona.manage' })
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('botoes habilitados quando slot nao e passado (sem gate)', () => {
    renderWithPermissions([], {})
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled()
    })
  })

  it('click em add NAO dispara handler quando gated', () => {
    const onAdd = vi.fn()
    renderWithPermissions(['persona.view'], { slot: 'persona.manage', onAdd })
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => fireEvent.click(btn))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('click em add DISPARA handler quando permitido', () => {
    const onAdd = vi.fn()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    renderWithPermissions(['persona.manage'], { slot: 'persona.manage', onAdd, onEdit, onDelete })
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => fireEvent.click(btn))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('3 botoes renderizados quando onAdd+onEdit+onDelete passados', () => {
    renderWithPermissions(['persona.manage'], {
      slot: 'persona.manage',
      onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(),
    })
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })
})
