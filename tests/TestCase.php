<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
  /**
   * Removido o `$this->seed()` global — quando presente, acoplava
   * todos os testes ao ProjectSeeder (atualmente com FK quebrada
   * em epic_id) e impedia qualquer teste de rodar sob Postgres.
   *
   * Testes que precisem de dados seed devem chamar `$this->seed()`
   * explicitamente ou usar factories.
   */
}
