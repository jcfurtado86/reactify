//exemplo
// nomeDoElemento : {
// title: 'NomeDoElemento',
// description: 'Descrição do elemento',
// classNames: {
//   badge: 'bg-purple-600 ',
// },
// }

const tooltipInfo = {
  // tooltips do navMenu
  // all ceremonies/tools
  inception: {
    title: 'Inception',
    link: 'inception',
    description:
      'É a primeira grande conversa para entender a ideia geral do projeto. O objetivo é que todos (clientes e equipe) concordem sobre o que é o produto e qual problema ele resolve.',
  },
  storyDiscovery: {
    title: 'Story Discovery',
    link: 'storyDiscovery',
    description:
      'Depois de entender a ideia geral, é preciso listar tudo o que o sistema fará. O resultado é uma lista inicial de "funcionalidades" ou "tarefas", conhecido como Backlog.',
  },
  refining: {
    title: 'Refining',
    link: 'refining',
    description:
      'Aqui, a equipe seleciona os itens mais importantes daquela lista de tarefas e faz uma análise profunda. O objetivo é adicionar detalhes.',
  },
  modeling: {
    title: 'Modeling',
    link: 'modeling',
    description:
      'Aqui a equipe técnica detalha como as telas vão parecer ou como as partes internas do sistema vão funcionar para cada tarefa.',
  },
  inspection: {
    title: 'Inspection',
    description:
      'Nessa cerimônia a equipe para e verifica se a tarefa (o requisito) está pronta. É aqui também que eles estimam o esforço: "Isso vai ser rápido ou vai dar muito trabalho?".',
  },
  productBacklog: {
    title: 'Product Backlog',
    link: 'productBacklog',
    description:
      'Lista priorizada de estórias de usuário e sistema levantadas, gerenciada para garantir entrega incremental de valor. Utiliza-se a priorização para definir a ordem de entrega.',
  },
  sprint: {
    title: 'Sprint',
    link: 'sprint',
    description:
      'Conjunto de estórias do Product Backlog selecionadas para implementação no ciclo atual.',
  },
  // inception
  productCanvas: {
    title: 'Product Canvas',
    link: 'productCanvas',
    description:
      'Visualize todos os itens do projeto, incluindo personas, objetivos e jornadas.',
  },
  goals: {
    title: 'Goals',
    link: 'goals',
    description:
      'Objetivos principais do projeto, indicando metas e resultados esperados.',
  },
  personas: {
    title: 'Personas',
    link: 'personas',
    description:
      'Perfis representativos dos usuários do sistema, com expectativas, restrições e objetivos.',
  },
  journeys: {
    title: 'Journeys',
    link: 'journeys',
    description:
      'Sequências de etapas (jornadas) que descrevem o caminho do usuário ou do administrador para atingir um objetivo no sistema.',
  },
  aiGeneratedJourney: {
    title: 'AI Generated Journeys',
    description:
      ' This function uses AI to generate journeys based on the Goals defined in the Personas.',
  },
  //story discovery
  stories: {
    title: 'Stories',
    link: 'stories',
    description:
      'Histórias de usuários e requisitos do sistema que detalham funcionalidades e necessidades do projeto.',
  },
  prioritizationMatrix: {
    title: 'Prioritization Matrix',
    link: 'prioritizationMatrix',
    description: 'Matriz para priorizar as histórias de usuário.',
  },
  changeLog: {
    title: 'Change Log',
    link: 'changeLog',
    description: 'Registro de mudanças.',
  },

  //
  // refining
  epicStories: {
    title: 'Epic Stories',
    link: 'epicStories',
    description:
      'As histórias épicas são histórias de complexas o bastante que necessitam ser divididas em várias histórias de usuário para serem implementadas.',
  },
  businessRules: {
    title: 'Business Rules',
    link: 'businessRules',
    description:
      'As regras de negócio são instruções que definem as regras e restrições que devem ser seguidas para garantir a integridade e a consistência do sistema.',
  },
  usageScenarios: {
    title: 'Usage Scenarios',
    link: 'usageScenarios',
    description:
      'Os casos de uso são relatos de eventos que ocorrem em um contexto específico, como a criação de contas para acessar o sistema, a gestão de playlists para organizar músicas e outras funcionalidades voltadas para a experiência do usuário.',
    classNames: {
      badge: 'bg-purple-600 ',
    },
  },
  //modeling
  overallModel: {
    title: 'Overall Model',
    link: 'overallModel',
    description:
      'O modelo geral é uma visão abrangente do sistema, que inclui todas as funcionalidades e requisitos do aplicativo.',
    classNames: {
      badge: 'bg-purple-600 ',
    },
  },
  interfaces: {
    title: 'Interfaces',
    link: 'interfaces',
    description:
      'As interfaces são as formas como os usuários interagem com o sistema, como a interface de usuário para acessar o aplicativo e a interface de API para integrar com outros sistemas.',
    classNames: {
      badge: 'bg-purple-600 ',
    },
  },
  storyboards: {
    title: 'Storyboards',
    link: 'storyboards',
    description:
      'Os storyboards são visões detalhadas das interfaces do aplicativo, que mostram como os usuários interagem com o sistema em diferentes cenários.',
    classNames: {
      badge: 'bg-purple-600 ',
    },
  },
  //inspection
  inspection: {
    title: 'Inspection',
    description:
      'As inspeções são atividades de avaliação e melhoria do sistema, como a análise de usabilidade, a revisão de código e outras tarefas que garantem a qualidade e a eficiência do sistema.',
    classNames: {
      badge: 'bg-purple-600 ',
    },
  },
  // tooltips internos
  userStory: {
    title: 'User Stories',
    description:
      'As histórias de usuário focam nas necessidades dos usuários do aplicativo, como a criação de contas para acessar o sistema, a gestão de playlists para organizar músicas e outras funcionalidades voltadas para a experiência do usuário.',
    classNames: {
      badge: 'bg-purple-600 ',
    },
  },
  systemStory: {
    title: 'System Stories',
    description:
      'As histórias de sistema abordam funcionalidades administrativas e técnicas, como o gerenciamento de usuários para controle de acesso e      outras tarefas que garantem o funcionamento e a manutenção do sistema ',
    classNames: {
      badge: 'bg-orange-600 ',
    },
  },
  aiGeneratedStory: {
    title: 'Gerar com IA',
    description:
      'Esta função utiliza IA para gerar Users Stories baseadas nos Objetivos das Personas e Journeys do Produto e gerar System Stories baseadas nas do e Goals do tipo Constraint(CG).',
  },
  epicStory: {
    title: 'O que é uma História Epica?',
    description:
      'As histórias épicas são histórias de complexas o bastante que necessitam ser divididas em várias histórias de usuário para serem implementadas.',
    classNames: {
      badge: 'bg-orange-600 ',
      // button: 'max-w-md md:max-w-2xl',
    },
  },
  businessRule: {
    title: 'O que é uma Business Rule (regra de negócio)?',
    description:
      'As regras de negócio são regras que o aplicativo deve seguir, como garantir que os usuários tenham acesso a recursos apenas se estiverem autenticados ou garantir que os usuários não possam acessar recursos que não estão disponíveis.',
    classNames: {
      button: 'max-w-md md:max-w-2xl',
    },
  },
  businessGoal: {
    title: 'Business Goals',
    description:
      'Os objetivos de negócios são metas específicas que o aplicativo busca alcançar, como aumentar a taxa de conversão de usuários para clientes pagantes ou aumentar a frequência de uso do aplicativo.',
    classNames: {
      badge: 'bg-orange-600 ',
    },
  },

  constraintGoal: {
    title: 'Constraint Goals',
    description:
      'Os objetivos de restrição são metas específicas que o aplicativo busca alcançar, como aumentar a taxa de conversão de usuários para clientes pagantes ou aumentar a frequência de uso do aplicativo.',
    classNames: {
      badge: 'bg-purple-600 ',
    },
  },
}

export { tooltipInfo }
