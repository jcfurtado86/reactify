<?php

namespace App\Notifications;

use App\Models\Story;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InvestIssueNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Story $story,
        public array $failedCriteria,
        public User $evaluator,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $criterionLabels = [
            'independent' => 'Independente',
            'negotiable' => 'Negociavel',
            'valuable' => 'Valioso',
            'estimable' => 'Estimavel',
            'small' => 'Pequeno',
            'testable' => 'Testavel',
        ];

        $labels = array_map(fn ($c) => $criterionLabels[$c] ?? $c, $this->failedCriteria);
        $labelText = implode(', ', $labels);

        return [
            'type' => 'invest_issue',
            'message' => "{$this->evaluator->name} reprovou \"{$this->story->title}\" nos criterios: {$labelText}.",
            'story_id' => $this->story->id,
            'story_title' => $this->story->title,
            'failed_criteria' => $this->failedCriteria,
            'evaluator_name' => $this->evaluator->name,
            'project_id' => $this->story->project_id,
        ];
    }
}
