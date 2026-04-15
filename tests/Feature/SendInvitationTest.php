<?php

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Project;
use App\Notifications\UserInvitedToProject;
use Illuminate\Support\Facades\Notification;

test('sending REAL project invitation notification to unregistered user', function () {
  $owner = User::factory()->create();
  $userToInvite = "lumagabriela3331@gmail.com";
  $project = Project::factory()->create();
  $project->users()->attach($owner->id, ['role' => UserRole::ADMINISTRATOR->value]);

  $response = $this
    ->actingAs($owner)
    ->from(route('dashboard'))
    ->post(route('projects.invitations.store', $project->id), [
      'email' => $userToInvite,
      'role' => UserRole::TEAM->value,
    ]);

  $response
    ->assertSessionHas('status', 'success')
    ->assertSessionHas('message', 'Invitation sent successfully')
    ->assertRedirect(route('dashboard'));

  //testa o armazenamento do convite no banco de dados
  $this
    ->assertDatabaseHas('project_invitations', [
      'email' => $userToInvite,
      'project_id' => $project->id,
      'role' => UserRole::TEAM->value,
    ]);
});
test('sending REAL project invitation notification to registered user', function () {
  $owner = User::factory()->create();
  $userToInvite = User::factory()->create();
  $project = Project::factory()->create();
  $project->users()->attach($owner->id, ['role' => UserRole::ADMINISTRATOR->value]);

  $response = $this
    ->actingAs($owner)
    ->from(route('dashboard'))
    ->post(route('projects.invitations.store', $project->id), [
      'email' => $userToInvite->email,
      'role' => UserRole::TEAM->value,
    ]);

  $response
    ->assertSessionHas('status', 'success')
    ->assertSessionHas('message', 'Invitation sent successfully')
    ->assertRedirect(route('dashboard'));

  //testa o armazenamento do convite no banco de dados
  $this
    ->assertDatabaseHas('notifications', [
      'notifiable_id' => $userToInvite->id,
      'type' => UserInvitedToProject::class,
    ])
    ->assertDatabaseHas('project_invitations', [
      'email' => $userToInvite->email,
      'project_id' => $project->id,
      'role' => UserRole::TEAM->value,
    ]);
});

test('sending FAKE project invitation notification to registered user', function () {
  Notification::fake();
  // 2. Crie os dados necessários para este teste específico.
  $owner = User::factory()->create();
  $userToInvite = User::factory()->create();
  $project = Project::factory()->create();
  $project->users()->attach($owner->id, ['role' => UserRole::ADMINISTRATOR->value]);

  $response = $this
    ->actingAs($owner)
    ->from(route('dashboard'))
    ->post(route('projects.invitations.store', $project->id), [
      'email' => $userToInvite->email,
      'role' => UserRole::TEAM->value,
    ]);
  //testa o envio do e-mail
  Notification::assertSentTo(
    $userToInvite,
    UserInvitedToProject::class,
    function ($notification, $channels) use ($userToInvite, $project) {
      $this->assertContains('mail', $channels, 'o canal de email nao foi usado');
      $this->assertContains('database', $channels, 'o canal de banco de dados nao foi usado');

      $mailData = $notification->toMail($userToInvite);
      $this->assertEquals($mailData->markdown, 'emails.project-invitation');
      $dbData = $notification->toArray($userToInvite);
      $this->assertEquals($dbData['project_id'], $project->id);
      return true;
    }
  );

  $response
    ->assertSessionHas('status', 'success')
    ->assertSessionHas('message', 'Invitation sent successfully')
    ->assertRedirect(route('dashboard'));

  //testa o armazenamento do convite no banco de dados
  $this
    ->assertDatabaseHas('project_invitations', [
      'email' => $userToInvite->email,
      'project_id' => $project->id,
      'role' => UserRole::TEAM->value,
    ]);
});
