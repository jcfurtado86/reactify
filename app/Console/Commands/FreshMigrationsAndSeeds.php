<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class FreshMigrationsAndSeeds extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'run_migrations';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Command description';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    // Execute migrations and seeds
    $this->call('migrate:fresh');
    $this->call('db:seed');
  }
}
