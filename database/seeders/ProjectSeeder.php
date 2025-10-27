<?php

namespace Database\Seeders;

use App\Notifications\UserInvitedToProject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Project;
use App\Models\ProjectInvitation;

class ProjectSeeder extends Seeder
{
  public function run(): void
  {
    // Criar Usuário Admin (evitar duplicação de email)
    $user1 = DB::table('users')->where('email', 'admin@example.com')->first();

    $userId1 = !$user1
      ? DB::table('users')->insertGetId([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => Hash::make('senha123'),
        'provider_avatar' =>
          'https://www.allthingswild.co.uk/wp-content/uploads/2022/01/IMG_4702.jpg',
        'active' => true,
        'email_verified_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
      ])
      : $user1->id;

    // Criar Usuário
    $user2 = DB::table('users')
      ->where('email', 'lumagabriela1333@gmail.com')
      ->first();

    $userId2 = !$user2
      ? DB::table('users')->insertGetId([
        'name' => 'Luma',
        'email' => 'lumagabriela1333@gmail.com',
        'password' => Hash::make('senha123'),
        'active' => true,
        'email_verified_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
      ])
      : $user2->id;

    // Criar Usuário luma
    $user3 = DB::table('users')
      ->where('email', 'lumagabriela1333@gmail.com')
      ->first();

    $user3 = !$user3
      ? DB::table('users')->insertGetId([
        'name' => 'luma',
        'email' => 'lumagabriela1333@gmail.com',
        'password' => Hash::make('senha123'),
        'active' => true,
        'email_verified_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
      ])
      : $user3->id;

    // Criar Projeto
    $project = Project::create([
      'title' => 'Projeto ClassicFlix',
      'description' => "O ClassicFlix é uma plataforma de streaming dedicada exclusivamente a filmes em domínio público, com o objetivo de democratizar o acesso a obras clássicas e históricas. A plataforma oferece um catálogo diversificado de títulos legendados em português, voltado tanto para fins educacionais quanto para entretenimento.
    Com uma proposta acessível, o ClassicFlix pratica preços de assinatura reduzidos em comparação às plataformas tradicionais de streaming, incentivando a preservação e valorização cultural dos filmes clássicos.
    Além do acesso ao catálogo, a plataforma conta com uma comunidade interativa, permitindo que os usuários compartilhem experiências, troquem recomendações e participem ativamente da valorização do cinema histórico.
    O ClassicFlix funciona diretamente em navegadores desktop e mobile, garantindo praticidade e acessibilidade sem a necessidade de instalar aplicativos ou programas adicionais..",
    ]);

    $project2 = Project::create([
      'title' => 'Projeto Exemplo 2',
      'description' => 'Testes...',
      'active' => true,
    ]);

    $projectId = $project->id;
    $projectId2 = $project2->id;

    $invitation = ProjectInvitation::create([
      'email' => 'admin@example.com',
      'project_id' => $projectId2,
      'inviter_id' => $userId1,
      'role' => 'admin',
      'status' => 'pending',
      'token' => Str::uuid(),
      'expires_at' => now()->addDays(7),
    ]);

    $invitedUser = User::where('email', 'admin@example.com')->first();

    Notification::send($invitedUser, new UserInvitedToProject($invitation));

    //criar prioridades para matriz
    DB::table('matrix_priorities')->insert([
      [
        'name' => 'Baixa',
        'color' => '#00FF00',
        'project_id' => $projectId,
        'order_column' => 1,
      ],
      [
        'name' => 'Média',
        'color' => '#FFFF00',
        'project_id' => $projectId,
        'order_column' => 2,
      ],
      [
        'name' => 'Alta',
        'color' => '#FF0000',
        'project_id' => $projectId,
        'order_column' => 3,
      ],
    ]);
    // Vincular Usuários ao Projeto
    DB::table('user_project')->insert([
      [
        'user_id' => $userId1,
        'role' => 'administrator',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'user_id' => $userId2,
        'role' => 'facilitator',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
    ]);

    // Criar Product Canvas vinculado ao Projeto
    DB::table('product_canvas')->insertGetId([
      'issues' => "Acesso difícil ou limitado a filmes em domínio público para fins educacionais ou de entretenimento. Acesso difícil ou limitado a filmes em domínio público legendados em português.
      Desinteresse de plataformas tradicionais de streaming em preservação histórica de filmes clássicos.
      As plataformas de streaming praticam preços de assinatura muito elevados.",
      'solutions' =>
        'Criar uma plataforma de streaming para filmes em domínio público, com legendas em português e preços de assinaturas acessíveis.',
      'personas' => "Leon Cardoso - Administrador da plataforma.
      Thiago Guimarães - Usuário.",
      'restrictions' => "A plataforma deve funcionar em qualquer navegador web baseado no Chromium, no Opera, no Safari e no Mozilla Firefox. \nA plataforma deve exigir um cadastro do usuário.
      A plataforma deve exigir uma assinatura semestral ou anual para acesso ilimitado ao catálogo.",
      'product_is' => "É uma plataforma web.
      É otimizada para navegadores desktop e mobile.
      A plataforma oferece uma comunidade para interação entre usuários.",
      'product_is_not' => "Não é um sistema desktop.
      Não é um aplicativo móvel.",
      'project_id' => $projectId,
      'created_at' => now(),
      'updated_at' => now(),
    ]);

    // Criar Prioridade
    DB::table('priorities')->insertGetId([
      'value' => 'Alta',
    ]);

    // Criar Goal Sketch
    DB::table('goal_sketches')->insert([
      [
        'title' =>
          'Atendimento às leis de direitos autorais e relacionadas à conteúdo em domínio público.',
        'type' => 'cg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Atendimento às leis de proteção do consumidor.',
        'type' => 'cg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Conformidade com padrões de segurança da informação.',
        'type' => 'cg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Atendimento às leis de proteção de dados pessoais.',
        'type' => 'cg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' =>
          'Assegurar que a plataforma funcione adequadamente nos navegadores web baseados no Chromium, Opera, Safari e Mozilla Firefox.',
        'type' => 'cg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Oferecer o serviço a preço acessível.',
        'type' => 'bg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Alcançar 10.000 assinantes em até um ano.',
        'type' => 'bg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Alcançar 500.000 assinantes em até quatro anos.',
        'type' => 'bg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Auferir receitas com anúncios que não sejam invasivos.',
        'type' => 'bg',
        'priority' => 'high',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' =>
          'Criar uma comunidade virtual ativa em torno dos filmes da plataforma.',
        'type' => 'bg',
        'priority' => 'medium',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' =>
          'Estabelecer parcerias estratégicas com anunciantes, instituições educacionais ou outros colaboradores para criar oportunidades de receitas financeiras.',
        'type' => 'bg',
        'priority' => 'medium',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'title' => 'Oferecer a venda de produtos temáticos na plataforma.',
        'type' => 'bg',
        'priority' => 'low',
        'project_id' => $projectId,
        'created_at' => now(),
        'updated_at' => now(),
      ],
    ]);

    // Criar Stories
    $storiesData = [
      [
        'title' =>
          'Como usuário, quero criar uma conta para acessar o aplicativo',
        'type' => 'user',
      ],
      [
        'title' =>
          'Eu como Thiago Guimarães quero criar listas e adicionar a elas obras disponíveis na plataforma para criar playlists de filmes',
        'type' => 'user',
      ],
      [
        'title' =>
          'Como administrador, quero gerenciar usuários para manter o controle de acesso ao sistema',
        'type' => 'system',
      ],
      [
        'title' =>
          'Otimização de Streaming. Descrição: Implementar tecnologias de compressão eficientes e entrega de conteúdo via CDN (Content Delivery Network) para garantir uma transmissão de vídeo sem interrupções e com carregamento rápido. Atributo de Qualidade: Desempenho e Eficiência',
        'type' => 'system',
        'epic_id' => 3,
      ],
    ];

    DB::transaction(function () use ($storiesData, $projectId) {
      foreach ($storiesData as $storyData) {
        // Adicione os dados que são comuns a todos, se necessário
        $dataToCreate = array_merge($storyData, [
          'project_id' => $projectId,
          'invest_card' => json_encode([
            'independent' => 'no',
            'negotiable' => 'no',
            'valuable' => 'no',
            'estimable' => 'no',
            'small' => 'no',
            'testable' => 'no',
          ]),
        ]);

        // Execute a action com os dados combinados
        DB::table('stories')->insert($dataToCreate);
      }
    });
    //inserir cards
    $overall_classes = [
      [
        'name' => 'Filme',
      ],
      [
        'name' => 'Legenda',
      ],
      [
        'name' => 'Player de Vídeo',
      ],
      [
        'name' => 'Usuário',
      ],
      [
        'name' => 'Cadastro',
      ],
      [
        'name' => 'Assinatura',
      ],
      [
        'name' => 'Doacão',
      ],
      [
        'name' => 'Administrador',
      ],
    ];

    DB::transaction(function () use ($overall_classes, $projectId) {
      foreach ($overall_classes as $overall_class) {
        $data = array_merge($overall_class, [
          'project_id' => $projectId,
          'created_at' => now(),
          'updated_at' => now(),
        ]);
        DB::table('overall_model_classes')->insert($data);
      }
    });

    // Criar Journey com vários steps
    $journeySteps = [
      [
        'id' => uniqid(),
        'step' => 1,
        'description' => 'Acessar a plataforma',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 2,
        'description' => 'Abrir a página',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 3,
        'description' => 'Logar na plataforma',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 4,
        'description' => 'Abrir tela inical de usuário',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 5,
        'description' => 'Exibir opções "exibir catálogo" e "comunidade"',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 6,
        'description' => 'Selecionar opção "exibir catálogo"',
        'is_touchpoint' => true,
      ],
      [
        'id' => uniqid(),
        'step' => 7,
        'description' => 'Mostrar categorias de filmes',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 8,
        'description' => 'Selecionar um filme',
        'is_touchpoint' => true,
      ],
      [
        'id' => uniqid(),
        'step' => 9,
        'description' => 'Exibir sinopse e ficha técnica',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 10,
        'description' => 'Exibir média de notas dadas por outros usuários',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 11,
        'description' =>
          'Exibir opção "iniciar filme", "assistir depois" e "escrever comentário"',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 12,
        'description' => 'Selecionar "iniciar filme"',
        'is_touchpoint' => true,
      ],
      [
        'id' => uniqid(),
        'step' => 13,
        'description' => 'Abrir player de vídeo',
        'is_touchpoint' => false,
      ],
      [
        'id' => uniqid(),
        'step' => 14,
        'description' => 'Iniciar exibição do filme',
        'is_touchpoint' => false,
      ],
    ];

    DB::table('journeys')->insert([
      'title' => 'Assistir um filme',
      'steps' => json_encode($journeySteps),
      'project_id' => $projectId,
      'created_at' => now(),
      'updated_at' => now(),
    ]);

    // crc cards - overall model

    $crcCards = [
      [
        'class' => 'Filme', // 'title' alterado para 'class'
        'responsabilities' => json_encode([
          'Ficha Técnica',
          'Média de notas dos usuários',
          'Resenhas e comentários dos usuários',
        ]),
        'collaborators' => json_encode(['Categoria de Filme', 'Legenda']),
      ],
      [
        'class' => 'Legenda', // 'title' alterado para 'class'
        'responsabilities' => json_encode(['Idioma', 'Cor', 'Tamanho']),
        'collaborators' => json_encode(['Filme', 'Player de Vídeo']),
      ],
      [
        'class' => 'Player de Vídeo', // 'title' alterado para 'class'
        'responsabilities' => json_encode([
          'Controle de resolução',
          'Controle de volume',
          'Botão iniciar/pausar',
          'Botão avançar vídeo',
          'Botão retroceder vídeo',
          'Botão tela cheia',
        ]),
        'collaborators' => json_encode(['Filme', 'Legenda']),
      ],
      [
        'class' => 'Categoria de Filme', // 'title' alterado para 'class'
        'responsabilities' => json_encode([
          'Gênero de filme',
          'Ano de lançamento',
          'Mais assistidos',
          'Maiores notas',
        ]),
        'collaborators' => json_encode(['Filme', 'Administrador']),
      ],
      [
        'class' => 'Usuário', // 'title' alterado para 'class'
        'responsabilities' => json_encode([
          'Editar perfil',
          'Seguir usuário',
          'Fazer requisição',
          'ID de usuário',
          'Playlists',
          'Resenhas',
          'Notas',
          'Seguidores',
        ]),
        'collaborators' => json_encode([
          'Cadastro',
          'Perfil de Usuário',
          'Assinatura',
          'Doação',
        ]),
      ],
      [
        'class' => 'Perfil de Usuário', // 'title' alterado para 'class'
        'responsabilities' => json_encode([
          'Foto de perfil',
          'Nome de usuário',
          'ID usuário',
          'Biografia do usuário',
          'Últimos filmes assistidos',
          'Filmes favoritos',
          'Últimas resenhas ou comentários',
        ]),
        'collaborators' => json_encode(['Usuário', 'Cadastro']),
      ],
      [
        'class' => 'Cadastro', // 'title' alterado para 'class'
        'responsabilities' => json_encode([
          'E-mail',
          'Senha',
          'CPF',
          'Nome de usuário',
          'ID de usuário',
        ]),
        'collaborators' => json_encode(['Usuário']),
      ],
      [
        'class' => 'Assinatura', // 'title' alterado para 'class'
        'responsabilities' => json_encode(['Plano', 'Forma de Pagamento']),
        'collaborators' => json_encode(['Usuário', 'Cadastro']),
      ],
    ];

    // 2. Adicionar o ID do Projeto e timestamps a cada card
    // Agora vinculamos diretamente ao '$projectId', sem o OverallModel.
    $crcCardsToInsert = array_map(function ($card) use ($projectId) {
      $card['project_id'] = $projectId; // Vinculado diretamente ao projeto
      $card['created_at'] = now();
      $card['updated_at'] = now();
      return $card;
    }, $crcCards);

    // 3. Inserir todos os CRC Cards no banco de dados com uma única query
    DB::table('crc_cards')->insert($crcCardsToInsert);

    // Adicione este código no final do método run() do ProjectSeeder, antes do fechamento da função

    DB::table('sprints')->insert([
      [
        'project_id' => $projectId,
        'name' => 'Sprint 1 - Configuração Inicial',
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addWeeks(2)->format('Y-m-d'),
        'status' => 'planning',
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'project_id' => $projectId,
        'name' => 'Sprint 2 - Desenvolvimento Core',
        'start_date' => now()->addWeeks(2)->addDay()->format('Y-m-d'),
        'end_date' => now()->addWeeks(4)->format('Y-m-d'),
        'status' => 'completed',
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'project_id' => $projectId,
        'name' => 'Sprint 3 - Refinamentos e Testes',
        'start_date' => now()->addWeeks(4)->addDay()->format('Y-m-d'),
        'end_date' => now()->addWeeks(6)->format('Y-m-d'),
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
      ],
    ]);

    DB::table('interviews')->insert([
      [
        'project_id' => $projectId,
        'file_name' => 'classicflix.pdf',
        'file_path' =>
          'https://res.cloudinary.com/dlbpjcsvm/image/upload/v1759674129/reactify/interviews/1/classicflix.pdf',
        'public_id' => 'reactify/interviews/1/classicflix',
        'resource_type' => 'image',
        'extraction_status' => 'completed',
        'transcript' => 'Bom dia. Obrigado por reservar este tempo. O objetivo hoje é começarmos a desenhar o que
será o Classiflix. Quero entender sua visão, os objetivos, quem vai usar a plataforma e o que
ela precisa fazer. Podemos começar?
Bom dia! Com certeza. Estou animado para tirar essa ideia do papel. O Classiflix é mais que
um simples streaming, é um projeto de preservação cultural.
Ótimo! Gosto dessa visão. Então, para começar, me fale em poucas palavras: Qual é o
principal problema que o Classiflix resolve ou a principal necessidade que ele atende?
A principal necessidade é o acesso facilitado e organizado a obras cinematográficas que estão
em domínio público. Hoje, esses filmes estão espalhados pela internet, em qualidade duvidosa,
sem legendas adequadas e sem nenhum contexto histórico. O Classiflix vai ser um portal
único, confiável e educativo para quem ama cinema clássico.
Perfeito. Isso já nos dá um norte. Agora, vamos falar sobre os usuários. Quem você imagina
usando o Classiflix?
Eu vejo três perfis principais:
1. O Cinéfilo Clássico: Alguém que já ama filmes antigos, diretores como Chaplin,
Hitchcock, e quer um lugar para revê-los em boa qualidade, talvez com materiais extras.
2. O Estudante de Cinema/Artes: Um universitário que precisa estudar esses filmes para
a faculdade. Para ele, informações como ano, diretor, elenco, e contexto histórico são
cruciais.
3. O Espectador Curioso: Pessoas que ouviram falar de filmes clássicos, mas não sabem
por onde começar. Precisam de uma interface amigável e de boas recomendações.
Excelente segmentação. Pensando nesses usuários, quais seriam as 5 funcionalidades mais
importantes que o Classiflix precisa ter no lançamento (MVP - Mínimo Produto Viável)?
Boa pergunta. Para o lançamento, eu diria:
1. Catálogo de Filmes Pesquisável: O usuário precisa conseguir buscar por título,
diretor, gênero ou ano.
2. Player de Vídeo Funcional: Um player simples, mas que permita ajustar a qualidade
do vídeo e selecionar legendas (em português, no mínimo).
3. Página de Detalhes do Filme: Cada filme deve ter sua própria página com sinopse,
ficha técnica (diretor, elenco, ano) e, se possível, uma curiosidade.
4. Categorias e Gêneros: Uma forma de navegar pelo acervo sem precisar de uma busca
específica. Ex: ""Comédias dos anos 30"", ""Suspense Mudo"", ""Clássicos do Cinema Noir"".
5. Criação de Conta de Usuário Simples: Apenas para que o usuário possa criar uma
lista de ""Meus Favoritos"" e continuar assistindo de onde parou.
Entendido. Isso define um bom escopo inicial. Agora, vamos pensar um pouco além do básico.
Como os filmes serão adicionados à plataforma? Haverá uma área administrativa?
Sim, absolutamente. Precisamos de um painel de administração (back-office) onde nossa
equipe possa:
● Fazer o upload do arquivo de vídeo do filme.
● Adicionar e editar os metadados: título, sinopse, ficha técnica, etc.
● Anexar arquivos de legenda em diferentes idiomas.
● Associar o filme a um ou mais gêneros/categorias.
● Destacar um filme na página inicial.
Certo, isso é um requisito fundamental para a operação. E sobre a qualidade? Existe algum
requisito não-funcional importante, como desempenho, qualidade de vídeo ou compatibilidade?
Sim, alguns pontos são cruciais para a experiência:
● Qualidade do Vídeo: Devemos sempre tentar oferecer a melhor resolução possível que
encontramos daquele filme. O player deve permitir que o usuário escolha entre
qualidades (ex: 480p, 720p) para se adaptar à sua internet.
● Desempenho: A plataforma precisa ser rápida. Ninguém quer esperar minutos para um
filme começar a carregar.
● Compatibilidade: No lançamento, o foco é funcionar bem em navegadores de desktop
(Chrome, Firefox, Safari). Uma versão para celular (responsiva) é essencial. Aplicativos
nativos podem vir depois.
● Acessibilidade: As legendas são um bom começo, mas seria ótimo se a plataforma
seguisse as diretrizes de acessibilidade web (WCAG).
Anotado. E sobre as regras de negócio? Existe alguma restrição legal ou regra específica que
devemos seguir?
A regra de ouro é: só podemos exibir filmes que estão 100% confirmados em domínio público
no Brasil. Isso é inegociável. Precisaremos de um processo de verificação rigoroso para cada
filme adicionado. Não queremos nenhum problema com direitos autorais.
Faz todo sentido. É uma premissa do projeto. Agora, uma pergunta mais aberta: Imagine que o
Classiflix já foi lançado e é um sucesso. O que o tornaria um sucesso na sua opinião? Como
medimos isso?
Para mim, o sucesso seria medido por três fatores:
1. Número de Usuários Ativos Mensais: Mostra que as pessoas estão voltando.
2. Tempo Médio de Visualização: Indica que as pessoas não estão apenas visitando,
mas de fato assistindo aos filmes.
3. Feedback Qualitativo: Ver estudantes e professores usando a plataforma como
ferramenta de ensino seria a maior recompensa. Poderíamos medir isso com pesquisas
de satisfação.
Perfeito. Isso me dá uma base excelente para começar a detalhar os requisitos.
Exatamente. Você capturou a essência do que precisamos para começar.',
        'created_at' => now(),
        'updated_at' => now(),
      ],
    ]);
  }
}
