<?php

namespace App\Enums;

enum PermissionEnum: string
{
  case PRODUCT_CANVAS_VIEW = 'productCanvas.view';
  case PRODUCT_CANVAS_MANAGE = 'productCanvas.manage';

  case USER_STORY_VIEW = 'userStory.view';
  case USER_STORY_MANAGE = 'userStory.manage';

  case SYSTEM_STORY_VIEW = 'systemStory.view';
  case SYSTEM_STORY_MANAGE = 'systemStory.manage';

  case GOAL_VIEW = 'goal.view';
  case GOAL_MANAGE = 'goal.manage';

  case PERSONA_VIEW = 'persona.view';
  case PERSONA_MANAGE = 'persona.manage';

  case JOURNEY_VIEW = 'journey.view';
  case JOURNEY_MANAGE = 'journey.manage';

  case OVERALL_MODEL_VIEW = 'overallModel.view';
  case OVERALL_MODEL_MANAGE = 'overallModel.manage';

  case USAGE_SCENARIO_VIEW = 'usageScenario.view';
  case USAGE_SCENARIO_MANAGE = 'usageScenario.manage';

  case INTERFACE_VIEW = 'interface.view';
  case INTERFACE_MANAGE = 'interface.manage';

  case BUSINESS_RULE_VIEW = 'businessRule.view';
  case BUSINESS_RULE_MANAGE = 'businessRule.manage';

  case PRIORITIZATION_MATRIX_VIEW = 'prioritizationMatrix.view';
  case PRIORITIZATION_MATRIX_MANAGE = 'prioritizationMatrix.manage';

  case STORYBOARD_VIEW = 'storyboard.view';
  case STORYBOARD_MANAGE = 'storyboard.manage';

  case CHANGE_LOG_VIEW = 'changeLog.view';
  case CHANGE_LOG_MANAGE = 'changeLog.manage';

  case PRODUCT_BACKLOG_VIEW = 'productBacklog.view';
  case PRODUCT_BACKLOG_MANAGE = 'productBacklog.manage';

  case SPRINT_VIEW = 'sprint.view';
  case SPRINT_MANAGE = 'sprint.manage';

  case INSPECTION_CARDS_VIEW = 'inspectionCards.view';
  case INSPECTION_CARDS_MANAGE = 'inspectionCards.manage';
}
