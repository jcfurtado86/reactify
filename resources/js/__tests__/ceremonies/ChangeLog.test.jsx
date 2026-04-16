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

import ChangeLog from '@/Pages/projects/project-ceremonies/StoryDiscovery/ChangeLog'

describe('ChangeLog', () => {
  it('renders for admin', () => {
    renderWithRole(<ChangeLog project={mockProject} />, 'admin')
    expect(screen.getByText('change_log.new_request')).toBeInTheDocument()
  })

  it('customer button enabled', () => {
    renderWithRole(<ChangeLog project={mockProject} />, 'customer')
    const btn = screen.getByText('change_log.new_request')
    expect(btn).not.toBeDisabled()
  })

  it('team button enabled', () => {
    renderWithRole(<ChangeLog project={mockProject} />, 'team')
    const btn = screen.getByText('change_log.new_request')
    expect(btn).not.toBeDisabled()
  })
})
