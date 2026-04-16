import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ROLE_PERMISSIONS, renderWithRole } from '../helpers/testUtils'

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: { auth: { user: { id: 1, name: 'T', email: 't@t.com' }, permissions: ROLE_PERMISSIONS[globalThis.__testRole] || [], currentProjectRole: globalThis.__testRole, projects: [], notifications: [] }, flash: { message: null, status: null, flash_key: '1' }, errors: {}, pending_generations: [] } }),
  router: { post: vi.fn(), patch: vi.fn(), delete: vi.fn(), get: vi.fn(), reload: vi.fn() },
  Link: ({ children }) => <a>{children}</a>, Head: () => null,
}))
vi.mock('react-i18next', async (i) => { const a = await i(); return { ...a, useTranslation: () => ({ t: (k) => k, i18n: { language: 'pt', changeLanguage: vi.fn() } }) } })
vi.mock('framer-motion', async (i) => { const a = await i(); return { ...a, AnimatePresence: ({ children }) => <>{children}</>, motion: { div: ({ children }) => <div>{children}</div> } } })
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

import GenerateAIButton from '@/Components/GenerateAIButton'

describe('GenerateAIButton permission gating', () => {
  it('team sees AI button for personas (persona.manage)', () => {
    renderWithRole(<GenerateAIButton type="personas" onClick={vi.fn()} />, 'team')
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('customer does NOT see AI button for personas', () => {
    renderWithRole(<GenerateAIButton type="personas" onClick={vi.fn()} />, 'customer')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('customer does NOT see for goals (goal.manage)', () => {
    renderWithRole(<GenerateAIButton type="goals" onClick={vi.fn()} />, 'customer')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('domain_expert sees for goals', () => {
    renderWithRole(<GenerateAIButton type="goals" onClick={vi.fn()} />, 'domain_expert')
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('domain_expert does NOT see for overall_model (overallModel.manage)', () => {
    renderWithRole(<GenerateAIButton type="overall_model" onClick={vi.fn()} />, 'domain_expert')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('team sees for overall_model', () => {
    renderWithRole(<GenerateAIButton type="overall_model" onClick={vi.fn()} />, 'team')
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('renders without type (no gate, always shows)', () => {
    renderWithRole(<GenerateAIButton onClick={vi.fn()} />, 'customer')
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('click abre dialog de confirmacao (nao dispara onClick direto)', () => {
    const onClick = vi.fn()
    renderWithRole(<GenerateAIButton type="personas" onClick={onClick} />, 'admin')
    fireEvent.click(screen.getByText('AI'))
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByText('ai.confirm.title')).toBeInTheDocument()
  })

  it('customer nao ve botao de stories (userStory.manage)', () => {
    renderWithRole(<GenerateAIButton type="stories" onClick={vi.fn()} />, 'customer')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('customer nao ve botao de business_rules', () => {
    renderWithRole(<GenerateAIButton type="business_rules" onClick={vi.fn()} />, 'customer')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('team ve botao de system_interfaces (interface.manage)', () => {
    renderWithRole(<GenerateAIButton type="system_interfaces" onClick={vi.fn()} />, 'team')
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('domain_expert nao ve botao de system_interfaces', () => {
    renderWithRole(<GenerateAIButton type="system_interfaces" onClick={vi.fn()} />, 'domain_expert')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })
})
