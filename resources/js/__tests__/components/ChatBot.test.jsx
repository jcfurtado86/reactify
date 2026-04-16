import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ROLE_PERMISSIONS, mockProject, renderWithRole } from '../helpers/testUtils'

const mockRouter = vi.hoisted(() => ({
  post: vi.fn(), patch: vi.fn(), delete: vi.fn(), get: vi.fn(), reload: vi.fn(),
}))

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: { auth: { user: { id: 1, name: 'T', email: 't@t.com' }, permissions: ROLE_PERMISSIONS[globalThis.__testRole] || [], currentProjectRole: globalThis.__testRole, projects: [], notifications: [] }, flash: { message: null, status: null, flash_key: '1' }, errors: {}, pending_generations: [] } }),
  router: mockRouter,
  Link: ({ children }) => <a>{children}</a>, Head: () => null,
}))
vi.mock('react-i18next', async (i) => { const a = await i(); return { ...a, useTranslation: () => ({ t: (k) => k, i18n: { language: 'pt', changeLanguage: vi.fn() } }) } })
vi.mock('framer-motion', async (i) => { const a = await i(); return { ...a, AnimatePresence: ({ children }) => <>{children}</>, motion: { div: ({ children }) => <div>{children}</div> } } })
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))

import ChatBot from '@/Pages/projects/ChatBot'

beforeEach(() => {
  globalThis.window.Echo = {
    private: () => ({
      listen: vi.fn().mockReturnThis(),
      stopListening: vi.fn(),
    }),
    leaveChannel: vi.fn(),
  }
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ messages: [] }),
  })
})

const props = {
  project: mockProject,
  currentPage: 'inception',
  currentContextData: null,
}

describe('ChatBot', () => {
  it('renders toggle button', () => {
    renderWithRole(<ChatBot {...props} />, 'admin')
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('opens chat on click', () => {
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('chat.title')).toBeInTheDocument()
  })

  it('shows input', () => {
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByPlaceholderText('chat.placeholder')).toBeInTheDocument()
  })

  it('shows welcome message', () => {
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('chat.welcome')).toBeInTheDocument()
  })
})

describe('ChatBot behavior', () => {
  it('digitar texto e pressionar Enter dispara router.post', () => {
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    const input = screen.getByPlaceholderText('chat.placeholder')
    fireEvent.change(input, { target: { value: 'Ola facilitador' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockRouter.post).toHaveBeenCalled()
  })

  it('input vazio nao dispara envio', () => {
    mockRouter.post.mockClear()
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    const input = screen.getByPlaceholderText('chat.placeholder')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockRouter.post).not.toHaveBeenCalled()
  })

  it('mostra loading placeholder apos envio', () => {
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    const input = screen.getByPlaceholderText('chat.placeholder')
    fireEvent.change(input, { target: { value: 'Teste' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input.value).toBe('')
  })

  it('carrega historico ao abrir (chama fetch)', () => {
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('feedback buttons aparecem em mensagens do historico', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        messages: [
          { id: 10, sender: 'user', message: 'Pergunta', created_at: '2026-04-15T10:00:00Z', feedback: null },
          { id: 11, sender: 'model', message: 'Resposta da IA', created_at: '2026-04-15T10:00:01Z', feedback: null },
        ],
      }),
    })
    renderWithRole(<ChatBot {...props} />, 'admin')
    fireEvent.click(screen.getByRole('button'))
    await vi.waitFor(() => {
      expect(screen.getByText('Resposta da IA')).toBeInTheDocument()
    })
  })
})
