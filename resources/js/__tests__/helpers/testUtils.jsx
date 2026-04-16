import { render } from '@testing-library/react'
import { PermissionProvider } from '@/Context/PermissionContext'
import { TooltipProvider } from '@/components/ui/tooltip'

// ============================================================
// Fixtures e helpers compartilhados por todos os testes de front.
//
// IMPORTANTE: vi.mock() é hoisted pro topo do arquivo pelo Vitest.
// Não pode ser chamado dentro de funções helper. Cada arquivo de
// teste precisa ter seus próprios vi.mock() no top-level. Este
// arquivo exporta apenas dados + helpers de render.
//
// Os mocks leem `globalThis.__testRole` dinamicamente em cada
// chamada de usePage(), permitindo trocar de papel entre testes.
// ============================================================

export const mockProject = {
  id: 1,
  title: 'Projeto Teste',
  description: 'Desc',
  emoji: '🧪',
  active: true,
  users: [
    { user_id: 1, name: 'Admin', email: 'admin@t.com', pivot: { role: 'administrator' } },
    { user_id: 2, name: 'Customer', email: 'customer@t.com', pivot: { role: 'customer' } },
    { user_id: 3, name: 'DE', email: 'de@t.com', pivot: { role: 'domain_expert' } },
    { user_id: 4, name: 'Team', email: 'team@t.com', pivot: { role: 'team' } },
  ],
  personas: [
    { id: 1, name: 'Persona A', profile: ['Dev'], expectations: ['Fast'], goals: ['Ship'], is_ai_generated: false, invest_card: null, project_id: 1 },
  ],
  goal_sketches: [
    { id: 1, title: 'Goal A', type: 'bg', priority: 'high', is_ai_generated: false, invest_card: null, project_id: 1 },
  ],
  journeys: [
    { id: 1, title: 'Journey A', steps: [{ id: 's1', step: 1, description: 'Step 1', is_touchpoint: false }], is_ai_generated: false, invest_card: null, project_id: 1 },
  ],
  product_canvas: { id: 1, issues: 'Issue 1', solutions: 'Solution 1', personas: 'Persona 1', restrictions: 'Restriction 1', product_is: 'Is X', product_is_not: 'Not Y', target_audience: 'All', project_id: 1 },
  stories: [
    { id: 1, title: 'Story A', type: 'user', status: 'draft', value: null, complexity: null, epic_id: null, invest_card: null, is_ai_generated: false, project_id: 1 },
  ],
  business_rules: [
    { id: 1, title: 'BR1', story_id: 1, is_ai_generated: false, invest_card: null, project_id: 1 },
  ],
  usage_scenarios: [
    { id: 1, description: { as: 'user', given: 'ctx', when: 'act', then_1: 'res' }, story_id: 1, is_ai_generated: false, invest_card: null, project_id: 1 },
  ],
  crc_cards: [
    { id: 1, class: 'User', collaborators: ['Order'], responsabilities: ['Login'], is_ai_generated: false, invest_card: null, project_id: 1 },
  ],
  overall_model_classes: [
    { id: 1, name: 'User', project_id: 1 },
  ],
  system_interfaces: [
    { id: 1, title: 'API', input: 'req', output: 'res', type: 'internal', is_ai_generated: false, invest_card: null, project_id: 1 },
  ],
  storyboards: [],
  matrix_priorities: [
    { id: 1, name: 'Alta', color: '#ff0000', order_column: 0, project_id: 1 },
  ],
  prioritizations: [],
  change_requests: [
    { id: 1, requester_name: 'User', description: 'Change', request_date: '2026-04-15', status: 'SOLICITADA', project_id: 1 },
  ],
  sprints: [
    { id: 1, name: 'Sprint 1', start_date: '2026-04-01', end_date: '2026-04-15', status: 'active', project_id: 1, stories: [] },
  ],
  interviews: [],
  system_colors: {
    stories: { user: '#f97316', system: '#3b82f6' },
    goals: { bg: '#22c55e', cg: '#3b82f6' },
    journeys: { default: '#8b5cf6' },
    personas: { default: '#ec4899' },
    interfaces: { internal: '#06b6d4', external: '#f59e0b' },
    business_rules: { default: '#f97316' },
    usage_scenarios: { default: '#14b8a6' },
  },
  invitations: [],
}

const ALL_PERMISSIONS = [
  'persona.view', 'persona.manage', 'goal.view', 'goal.manage',
  'journey.view', 'journey.manage', 'productCanvas.view', 'productCanvas.manage',
  'userStory.view', 'userStory.manage', 'businessRule.view', 'businessRule.manage',
  'usageScenario.view', 'usageScenario.manage', 'overallModel.view', 'overallModel.manage',
  'interface.view', 'interface.manage', 'storyboard.view', 'storyboard.manage',
  'prioritizationMatrix.view', 'prioritizationMatrix.manage',
  'changeLog.view', 'changeLog.manage', 'productBacklog.view', 'productBacklog.manage',
  'sprint.view', 'sprint.manage', 'inspectionCards.view', 'inspectionCards.manage',
]

export const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,
  administrator: ALL_PERMISSIONS,
  customer: [
    'persona.view', 'goal.view', 'journey.view', 'productCanvas.view',
    'userStory.view', 'businessRule.view', 'usageScenario.view',
    'overallModel.view', 'interface.view', 'storyboard.view',
    'prioritizationMatrix.view', 'prioritizationMatrix.manage',
    'changeLog.view', 'changeLog.manage',
    'productBacklog.view', 'sprint.view', 'inspectionCards.view',
  ],
  domain_expert: [
    'persona.view', 'persona.manage', 'goal.view', 'goal.manage',
    'journey.view', 'journey.manage', 'productCanvas.view', 'productCanvas.manage',
    'userStory.view', 'userStory.manage', 'businessRule.view', 'businessRule.manage',
    'usageScenario.view', 'usageScenario.manage',
    'overallModel.view', 'interface.view', 'storyboard.view',
    'prioritizationMatrix.view', 'prioritizationMatrix.manage',
    'changeLog.view', 'changeLog.manage',
    'productBacklog.view', 'productBacklog.manage',
    'sprint.view', 'inspectionCards.view',
  ],
  team: [
    'persona.view', 'persona.manage', 'goal.view', 'journey.view', 'productCanvas.view',
    'userStory.view', 'userStory.manage', 'businessRule.view', 'businessRule.manage',
    'usageScenario.view', 'usageScenario.manage',
    'overallModel.view', 'overallModel.manage',
    'interface.view', 'interface.manage', 'storyboard.view', 'storyboard.manage',
    'prioritizationMatrix.view', 'prioritizationMatrix.manage',
    'changeLog.view', 'changeLog.manage',
    'productBacklog.view', 'sprint.view', 'sprint.manage',
    'inspectionCards.view', 'inspectionCards.manage',
  ],
}

// Seta o papel pro proximo render. Os vi.mock de cada arquivo de teste
// leem de globalThis.__testRole.
export function setTestRole(role) {
  globalThis.__testRole = role
}

// Render helper: seta o papel e renderiza com PermissionProvider.
export function renderWithRole(ui, role = 'administrator') {
  setTestRole(role)
  const permissions = ROLE_PERMISSIONS[role] || []
  return render(
    <TooltipProvider>
      <PermissionProvider permissions={permissions}>
        {ui}
      </PermissionProvider>
    </TooltipProvider>,
  )
}

// Inicializa o role default.
globalThis.__testRole = 'administrator'
globalThis.route = (name, params) => `/mock/${name}`
