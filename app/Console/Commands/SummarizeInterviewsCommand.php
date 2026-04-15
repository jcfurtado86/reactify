<?php

namespace App\Console\Commands;

use App\Jobs\SummarizeInterviewJob;
use App\Models\Interview;
use Illuminate\Console\Command;

/**
 * Enfileira SummarizeInterviewJob para todas as entrevistas do banco
 * (ou só as que ainda não têm summary). Usado uma vez pra processar
 * entrevistas já existentes depois do deploy da feature.
 */
class SummarizeInterviewsCommand extends Command
{
    protected $signature = 'interviews:summarize
                            {--all : re-enfileira mesmo entrevistas que já têm summary}
                            {--project= : filtra por project_id}';

    protected $description = 'Enfileira jobs de sumarização para entrevistas existentes.';

    public function handle(): int
    {
        $query = Interview::whereNotNull('transcript')
            ->where('transcript', '!=', '');

        if ($projectId = $this->option('project')) {
            $query->where('project_id', $projectId);
        }

        if (!$this->option('all')) {
            $query->whereNull('transcript_summary');
        }

        $interviews = $query->get();
        $count = 0;
        foreach ($interviews as $interview) {
            SummarizeInterviewJob::dispatch($interview->id);
            $count++;
        }

        $this->info("Enfileirados {$count} jobs de sumarização.");
        return self::SUCCESS;
    }
}
