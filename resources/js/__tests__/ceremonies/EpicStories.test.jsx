import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { ROLE_PERMISSIONS, mockProject, renderWithRole } from '../helpers/testUtils'

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: { auth: { user: { id: 1, name: 'T', email: 't@t.com' }, permissions: ROLE_PERMISSIONS[globalThis.__testRole] || [], currentProjectRole: globalThis.__testRole, projects: [], notifications: [] }, flash: { message: null, status: null, flash_key: '1' }, errors: {}, pending_generations: [] } }),
  router: { post: vi.fn(), patch: vi.fn(), delete: vi.fn(), get: vi.fn(), reload: vi.fn() },
  Link: ({ children }) => <a>{children}</a>, Head: () => null,
}))
vi.mock('react-i18next', async (i) => { const a = await i(); return { ...a, useTranslation: () => ({ t: (k) => k, i18n: { language: 'pt', changeLanguage: vi.fn() } }) } })
vi.mock('framer-motion', async (i) => { const a = await i(); return { ...a, AnimatePresence: ({ children }) => <>{children}</>, motion: { div: ({ children }) => <div>{children}</div> } } })
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

import EpicStories from '@/Pages/projects/project-ceremonies/Refining/EpicStories'

describe('EpicStories', () => {
  it('renders for admin', () => {
    renderWithRole(<EpicStories project={mockProject} setProject={vi.fn()} />, 'admin')
    expect(screen.getByText('Story A')).toBeInTheDocument()
  })

  it('renders for customer', () => {
    renderWithRole(<EpicStories project={mockProject} setProject={vi.fn()} />, 'customer')
    expect(screen.getByText('Story A')).toBeInTheDocument()
  })

  it('renders for team', () => {
    renderWithRole(<EpicStories project={mockProject} setProject={vi.fn()} />, 'team')
    expect(screen.getByText('Story A')).toBeInTheDocument()
  })
})

describe('EpicStories permission behavior', () => {
  it('customer: GenerateAIButton hidden', () => {
    renderWithRole(<EpicStories project={mockProject} setProject={vi.fn()} />, 'customer')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })
  it('team: GenerateAIButton visible', () => {
    renderWithRole(<EpicStories project={mockProject} setProject={vi.fn()} />, 'team')
    expect(screen.getByText('AI')).toBeInTheDocument()
  })
})
