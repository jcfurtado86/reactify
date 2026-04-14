<?php

return [
    'signature' => 'Equipe',

    'welcome' => [
        'subject' => 'Bem-vindo(a) ao Reactify, :name!',
        'greeting' => 'Olá, :name! 👋',
        'intro' => 'Seja bem-vindo(a) ao **Reactify** — a plataforma que ajuda equipes ágeis a levantar, validar e gerenciar requisitos de software com apoio de IA, baseada no método REACT-M. Sua conta foi criada com sucesso.',
        'next_steps_header' => 'Nos próximos minutos você pode:',
        'step_project' => 'Criar seu **primeiro projeto**',
        'step_interview' => 'Fazer upload de uma **entrevista de requisitos** (áudio, vídeo ou PDF) — o Reactify transcreve e usa o conteúdo para gerar personas, jornadas e user stories',
        'step_team' => 'Convidar sua equipe e definir papéis (Customer, Domain Expert, Team)',
        'cta' => 'Começar agora',
    ],

    'invitation' => [
        'subject' => ':inviter convidou você para :project',
        'greeting' => 'Olá!',
        'greeting_named' => 'Olá, :name!',
        'intro' => '**:inviter** convidou você para colaborar no projeto **:project** no Reactify.',
        'role_label' => 'Seu papel será:',
        'cta_accept' => 'Aceitar convite',
        'pitch' => 'Se você ainda não conhece o Reactify: é a plataforma que ajuda equipes ágeis a levantar, validar e gerenciar requisitos de software com apoio de IA, baseada no método REACT-M.',
        'expires_at' => 'Este convite expira em **:date**.',
        'decline_link' => 'Se preferir recusar, [clique aqui](:url).',
        'inapp_message' => ':inviter convidou você para o projeto ":project"',
        'role_customer' => 'Cliente',
        'role_domain_expert' => 'Especialista de domínio',
        'role_team' => 'Equipe',
        'role_administrator' => 'Administrador',
        'role_unknown' => '—',
    ],

    'permissions_updated' => [
        'subject' => 'Suas permissões em :project foram atualizadas',
        'greeting' => 'Olá, :name!',
        'body' => '**:editor** atualizou suas permissões no projeto **:project**.',
        'new_role' => 'Seu papel agora é: **:role**.',
        'cta' => 'Abrir projeto',
        'inapp_message' => ':editor atualizou suas permissões em :project. Papel atual: :role.',
    ],

    'password_reset' => [
        'subject' => 'Redefinição de senha no Reactify',
        'greeting' => 'Olá, :name!',
        'intro' => 'Recebemos uma solicitação para redefinir a senha da sua conta no Reactify. Clique no botão abaixo para escolher uma nova senha.',
        'cta' => 'Redefinir senha',
        'expiry' => 'Este link expira em :minutes minutos.',
        'ignore_notice' => 'Se você não solicitou a redefinição, ignore este email — sua senha continua segura.',
    ],

    'verify_email' => [
        'subject' => 'Confirme seu email no Reactify',
        'greeting' => 'Olá, :name!',
        'intro' => 'Clique no botão abaixo para confirmar seu endereço de email e ativar sua conta no Reactify.',
        'cta' => 'Confirmar email',
        'ignore_notice' => 'Se você não criou esta conta, pode ignorar este email com segurança.',
    ],
];
