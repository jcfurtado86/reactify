// Bloco de vi.mock pra copiar no topo de cada arquivo de teste.
// NÃO pode ser importado como função — vi.mock é hoisted. Cada
// test file precisa ter uma cópia desses mocks no top-level.
//
// Template:
//
// import { vi } from 'vitest'
// import { ROLE_PERMISSIONS, mockProject } from '../helpers/testUtils'
//
// vi.mock('@inertiajs/react', () => ({
//   usePage: () => ({
//     props: {
//       auth: {
//         user: { id: 1, name: 'Test', email: 'test@t.com' },
//         permissions: ROLE_PERMISSIONS[globalThis.__testRole] || [],
//         currentProjectRole: globalThis.__testRole,
//         projects: [],
//         notifications: [],
//       },
//       flash: { message: null, status: null, flash_key: '1' },
//       errors: {},
//       pending_generations: [],
//     },
//   }),
//   router: { post: vi.fn(), patch: vi.fn(), delete: vi.fn(), get: vi.fn(), reload: vi.fn() },
//   useForm: () => ({ data: {}, setData: vi.fn(), post: vi.fn(), processing: false, errors: {} }),
//   Link: ({ children, ...p }) => <a {...p}>{children}</a>,
//   Head: () => null,
// }))
//
// vi.mock('react-i18next', async (importOriginal) => {
//   const actual = await importOriginal()
//   return { ...actual, useTranslation: () => ({ t: (k) => k, i18n: { language: 'pt', changeLanguage: vi.fn() } }) }
// })
//
// vi.mock('framer-motion', async (importOriginal) => {
//   const actual = await importOriginal()
//   return {
//     ...actual,
//     AnimatePresence: ({ children }) => <>{children}</>,
//     motion: { div: ({ children, ...p }) => <div>{children}</div> },
//   }
// })
//
// vi.mock('sonner', () => ({
//   toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
// }))

export default 'Este arquivo é documentação. Veja os comentários acima.'
