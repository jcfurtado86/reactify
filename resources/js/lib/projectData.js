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
  aiGeneratedGoals: {
    title: 'Gerar Objetivos com IA',
    description:
      'Usa IA para analisar a descrição inicial do projeto e gerar Business Goals (metas) e Constraint Goals (restrições) com base na Entrevista de Requisitos fornecida.',
  },
  aiGeneratedPersonas: {
    title: 'Gerar Personas com IA',
    description:
      'Usa IA para criar perfis detalhados de usuários com base na Entrevista de Requisitos fornecida.',
  },
  aiGeneratedJourney: {
    title: 'Gerar Jornadas com IA',
    description:
      'Usa IA para estruturar as jornadas do usuário passo a passo, mapeando o caminho ideal dentro do sistema com base nas Goals das Personas.',
  },
  aiGeneratedProductCanvas: {
    title: 'Gerar Product Canvas com IA',
    description:
      'Usa IA para mapear Problemas, Soluções, Personas, Restrições e o escopo do projeto (É/Não É) a partir da Entrevista de Requisitos fornecida.',
  },  
  aiGeneratedStory: {
    title: 'Gerar Histórias com IA',
    description:
      'Usa IA para elaborar User Stories baseadas nas Goals das Personas e Journeys do Produto, além de System Stories baseadas nas Constraint Goals do Produto.',
  },

  aiGeneratedEpic: {
    title: 'Gerar Épicos com IA',
    description:
      'Usa IA para analisar Stories Épicos e separar os requisitos complexos.',
  },
  aiGeneratedBusinessRule: {
    title: 'Gerar Regras de Negócio com IA',
    description:
      'Usa IA para gerar novas regras analisando a Story do projeto, seus Goals e as Regras atuais.',
  },
  aiGeneratedUsageScenario: {
    title: 'Gerar Cenários com IA',
    description:
      'Usa IA para descrever narrativas detalhadas de interação (casos de uso), exemplificando como o usuário deve interagir para completar uma tarefa.',
  },

  aiGeneratedOverallModel: {
    title: 'Gerar Modelo Geral com IA',
    description:
      'Usa IA para sintetizar todo o escopo definido em uma visão arquitetural unificada, destacando os principais fluxos e componentes do sistema. Se baseia nas Stories do Projeto',
  },
  aiGeneratedInterface: {
    title: 'Sugerir Interfaces com IA',
    description:
      'Usa IA para propor a estrutura visual, campos necessários e a disposição dos elementos (wireframe textual). Se baseando nos CRC Cards e Stories.',
  },
  aiGeneratedStoryboard: {
    title: 'Gerar Storyboard com IA',
    description:
      'Usa IA para criar uma sequência narrativa que ilustra a navegação do usuário entre as interfaces sugeridas, validando o fluxo visual.',
  },
}

export { tooltipInfo }
