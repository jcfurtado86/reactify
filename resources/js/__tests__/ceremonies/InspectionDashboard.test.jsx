import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { ROLE_PERMISSIONS, mockProject, renderWithRole } from '../helpers/testUtils'

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: { auth: { user: { id: 1, name: 'T', email: 't@t.com' }, permissions: ROLE_PERMISSIONS[globalThis.__testRole] || [], currentProjectRole: globalThis.__testRole, projects: [], notifications: [] }, flash: { message: null, status: null, flash_key: '1' }, errors: {}, pending_generations: [] } }),
  router: { post: vi.fn(), patch: vi.fn(), delete: vi.fn(), get: vi.fn(), reload: vi.fn() },
  Link: ({ children }) => <a>{children}</a>, Head: () => null,
}))
vi.mock('react-i18next', async (i) => { const a = await i(); return { ...a, useTranslation: () => ({ t: (k, d) => d || k, i18n: { language: 'pt', changeLanguage: vi.fn() } }) } })
vi.mock('framer-motion', async (i) => { const a = await i(); return { ...a, AnimatePresence: ({ children }) => <>{children}</>, motion: { div: ({ children }) => <div>{children}</div> } } })
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

import InspectionDashboard from '@/Pages/projects/project-ceremonies/Inspection/InspectionDashboard'

const project = {
  ...mockProject,
  stories: [
    { id: 1, title: 'Story aprovada', type: 'user', invest_card: { independent: 'yes', negotiable: 'yes', valuable: 'yes', estimable: 'yes', small: 'yes', testable: 'yes' }, epic_id: null, project_id: 1 },
    { id: 2, title: 'Story com problema', type: 'user', invest_card: { independent: 'no', negotiable: 'yes', valuable: 'yes', estimable: 'yes', small: 'yes', testable: 'yes' }, epic_id: null, project_id: 1 },
    { id: 3, title: 'Story pendente', type: 'system', invest_card: null, epic_id: null, project_id: 1 },
  ],
}

describe('InspectionDashboard', () => {
  it('renderiza tabela com todas as stories', () => {
    renderWithRole(<InspectionDashboard project={project} setProject={vi.fn()} />, 'admin')
    expect(screen.getByText('Story aprovada')).toBeInTheDocument()
    expect(screen.getByText('Story com problema')).toBeInTheDocument()
    expect(screen.getByText('Story pendente')).toBeInTheDocument()
  })

  it('mostra botoes de filtro', () => {
    renderWithRole(<InspectionDashboard project={project} setProject={vi.fn()} />, 'admin')
    expect(screen.getByText(/all/i)).toBeInTheDocument()
    expect(screen.getByText(/issues/i)).toBeInTheDocument()
  })

  it('renderiza celulas INVEST clicaveis pra team', () => {
    renderWithRole(<InspectionDashboard project={project} setProject={vi.fn()} />, 'team')
    const cells = screen.getAllByTitle(/independent/i)
    expect(cells.length).toBeGreaterThan(0)
    cells.forEach((cell) => expect(cell).not.toBeDisabled())
  })

  it('celulas INVEST disabled pra customer', () => {
    renderWithRole(<InspectionDashboard project={project} setProject={vi.fn()} />, 'customer')
    const cells = screen.getAllByTitle(/independent/i)
    cells.forEach((cell) => expect(cell).toBeDisabled())
  })
})
