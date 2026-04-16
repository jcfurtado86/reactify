import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ROLE_PERMISSIONS, mockProject, renderWithRole } from '../helpers/testUtils'

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: { auth: { user: { id: 1, name: 'T', email: 't@t.com' }, permissions: ROLE_PERMISSIONS[globalThis.__testRole] || [], currentProjectRole: globalThis.__testRole, projects: [], notifications: [] }, flash: { message: null, status: null, flash_key: '1' }, errors: {}, pending_generations: [] } }),
  router: { post: vi.fn(), patch: vi.fn(), delete: vi.fn(), get: vi.fn(), reload: vi.fn() },
  Link: ({ children }) => <a>{children}</a>, Head: () => null,
}))
vi.mock('react-i18next', async (i) => { const a = await i(); return { ...a, useTranslation: () => ({ t: (k) => k, i18n: { language: 'pt', changeLanguage: vi.fn() } }) } })
vi.mock('framer-motion', async (i) => { const a = await i(); return { ...a, AnimatePresence: ({ children }) => <>{children}</>, motion: { div: ({ children }) => <div>{children}</div> } } })
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

import { ProjectPermissions } from '@/Components/ProjectPermissions'

describe('ProjectPermissions', () => {
  it('renders button', () => {
    renderWithRole(<ProjectPermissions project={mockProject} />, 'admin')
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('facilitator not in roles after opening sheet', () => {
    renderWithRole(<ProjectPermissions project={mockProject} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('project_permissions.roles.facilitator')).not.toBeInTheDocument()
  })
})

describe('ProjectPermissions behavior', () => {
  it('mostra membros do projeto ao abrir sheet', () => {
    renderWithRole(<ProjectPermissions project={mockProject} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/Admin/)).toBeInTheDocument()
    expect(screen.getByText('ADMINISTRATOR')).toBeInTheDocument()
  })

  it('mostra titulo do sheet', () => {
    renderWithRole(<ProjectPermissions project={mockProject} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('project_permissions.title')).toBeInTheDocument()
  })

  it('mostra convites pendentes se existirem', () => {
    const projectWithInvites = {
      ...mockProject,
      invitations: [{ id: 99, email: 'convidado@test.com', role: 'team', expires_at: '2026-04-22' }],
    }
    renderWithRole(<ProjectPermissions project={projectWithInvites} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('convidado@test.com')).toBeInTheDocument()
  })

  it('mostra secao de convites', () => {
    renderWithRole(<ProjectPermissions project={mockProject} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getAllByText('project_permissions.invite_user').length).toBeGreaterThan(0)
  })
})
