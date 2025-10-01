<?php

namespace App\Enums;

enum PermissionEnum: string
{
  case PRODUCT_CANVAS_CREATE = 'productCanvas.create';
  case PRODUCT_CANVAS_EDIT = 'productCanvas.edit';
  case PRODUCT_CANVAS_DELETE = 'productCanvas.delete';

  case USER_STORY_CREATE = 'userStory.create';
  case USER_STORY_EDIT = 'userStory.edit';
  case USER_STORY_DELETE = 'userStory.delete';

  case SYSTEM_STORY_CREATE = 'systemStory.create';
  case SYSTEM_STORY_EDIT = 'systemStory.edit';
  case SYSTEM_STORY_DELETE = 'systemStory.delete';

  case GOAL_CREATE = 'goal.create';
  case GOAL_EDIT = 'goal.edit';
  case GOAL_DELETE = 'goal.delete';

  case PERSONA_CREATE = 'persona.create';
  case PERSONA_EDIT = 'persona.edit';
  case PERSONA_DELETE = 'persona.delete';

  case JOURNEY_CREATE = 'journey.create';
  case JOURNEY_EDIT = 'journey.edit';
  case JOURNEY_DELETE = 'journey.delete';

  case OVERALL_MODEL_CREATE = 'overallModel.create';
  case OVERALL_MODEL_EDIT = 'overallModel.edit';
  case OVERALL_MODEL_DELETE = 'overallModel.delete';

  case USAGE_SCENARIO_CREATE = 'usageScenario.create';
  case USAGE_SCENARIO_EDIT = 'usageScenario.edit';
  case USAGE_SCENARIO_DELETE = 'usageScenario.delete';

  case PRIORITIZATION_MATRIX_CREATE = 'prioritizationMatrix.create';
  case PRIORITIZATION_MATRIX_EDIT = 'prioritizationMatrix.edit';
  case PRIORITIZATION_MATRIX_DELETE = 'prioritizationMatrix.delete';

  case STORYBOARD_CREATE = 'storyboard.create';
  case STORYBOARD_EDIT = 'storyboard.edit';
  case STORYBOARD_DELETE = 'storyboard.delete';

  case CHANGE_LOG_CREATE = 'changeLog.create';
  case CHANGE_LOG_EDIT = 'changeLog.edit';
  case CHANGE_LOG_DELETE = 'changeLog.delete';

  case PRODUCT_BACKLOG_CREATE = 'productBacklog.create';
  case PRODUCT_BACKLOG_EDIT = 'productBacklog.edit';
  case PRODUCT_BACKLOG_DELETE = 'productBacklog.delete';

  case SPRINT_CREATE = 'sprint.create';
  case SPRINT_EDIT = 'sprint.edit';
  case SPRINT_DELETE = 'sprint.delete';

  case INSPECTION_CARDS_CREATE = 'inspectionCards.create';
  case INSPECTION_CARDS_EDIT = 'inspectionCards.edit';
  case INSPECTION_CARDS_DELETE = 'inspectionCards.delete';
}
