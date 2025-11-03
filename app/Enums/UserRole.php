<?php

namespace App\Enums;

enum UserRole: string
{
  case CUSTOMER = 'customer';
  case DOMAIN_EXPERT = 'domain_expert';
  case TEAM = 'team';
  case FACILITATOR = 'facilitator';
  case ADMINISTRATOR = 'administrator';

  public function label(): string
  {
    return match ($this) {
      self::CUSTOMER => 'Customer',
      self::DOMAIN_EXPERT => 'Domain Expert',
      self::TEAM => 'Team',
      self::FACILITATOR => 'Facilitator',
      self::ADMINISTRATOR => 'Administrator',
    };
  }

  public function permissions(): array
  {
    return match ($this) {
      self::ADMINISTRATOR => PermissionEnum::cases(),
      self::CUSTOMER => [
        PermissionEnum::PRODUCT_CANVAS_CREATE,
        PermissionEnum::PRODUCT_CANVAS_EDIT,
        PermissionEnum::PRODUCT_CANVAS_DELETE,

        PermissionEnum::GOAL_CREATE,
        PermissionEnum::GOAL_EDIT,
        PermissionEnum::GOAL_DELETE,

        PermissionEnum::USER_STORY_CREATE,
        PermissionEnum::USER_STORY_EDIT,
        PermissionEnum::USER_STORY_DELETE,

        PermissionEnum::STORYBOARD_CREATE,
        PermissionEnum::STORYBOARD_EDIT,
        PermissionEnum::STORYBOARD_DELETE,

        PermissionEnum::CHANGE_LOG_CREATE,
        PermissionEnum::CHANGE_LOG_EDIT,
        PermissionEnum::CHANGE_LOG_DELETE,

        PermissionEnum::PRODUCT_BACKLOG_CREATE,
        PermissionEnum::PRODUCT_BACKLOG_EDIT,
        PermissionEnum::PRODUCT_BACKLOG_DELETE,

        // PermissionEnum::VIEW_PROJECT,
        // PermissionEnum::VIEW_PERSONA,
        // PermissionEnum::VIEW_GOAL,
        // PermissionEnum::VIEW_JOURNEY,
        // PermissionEnum::VIEW_PRODUCT_CANVAS,
        // PermissionEnum::VIEW_STORY,
        // PermissionEnum::MANAGE_CHANGE_REQUEST,
        // PermissionEnum::VIEW_CHANGE_REQUEST,
        // PermissionEnum::MANAGE_PRIORITIZATION,
        // PermissionEnum::VIEW_PRIORITIZATION,
        // PermissionEnum::VIEW_SPRINT,
        // PermissionEnum::VIEW_BUSINESS_RULE,
        // PermissionEnum::VIEW_USAGE_SCENARIO,
        // PermissionEnum::VIEW_OVERALL_MODEL,
        // PermissionEnum::VIEW_SYSTEM_INTERFACE,
        // PermissionEnum::VIEW_STORYBOARD,
        // PermissionEnum::VIEW_INTERVIEW,

      ],
      self::DOMAIN_EXPERT => [
        PermissionEnum::PRODUCT_CANVAS_CREATE,
        PermissionEnum::PRODUCT_CANVAS_EDIT,
        PermissionEnum::PRODUCT_CANVAS_DELETE,

        PermissionEnum::GOAL_CREATE,
        PermissionEnum::GOAL_EDIT,
        PermissionEnum::GOAL_DELETE,

        PermissionEnum::PERSONA_CREATE,
        PermissionEnum::PERSONA_EDIT,
        PermissionEnum::PERSONA_DELETE,

        PermissionEnum::JOURNEY_CREATE,
        PermissionEnum::JOURNEY_EDIT,
        PermissionEnum::JOURNEY_DELETE,

        PermissionEnum::USER_STORY_CREATE,
        PermissionEnum::USER_STORY_EDIT,
        PermissionEnum::USER_STORY_DELETE,

        // PermissionEnum::MANAGE_PPRODUCT_BACKLOG,
        // PermissionEnum::VIEW_PPRODUCT_BACKLOG,
        // PermissionEnum::MANAGE_PROJECT,
        // PermissionEnum::VIEW_PROJECT,
        // PermissionEnum::MANAGE_PERSONA,
        // PermissionEnum::VIEW_PERSONA,
        // PermissionEnum::MANAGE_GOAL,
        // PermissionEnum::VIEW_GOAL,
        // PermissionEnum::MANAGE_JOURNEY,
        // PermissionEnum::VIEW_JOURNEY,
        // PermissionEnum::MANAGE_PRODUCT_CANVAS,
        // PermissionEnum::VIEW_PRODUCT_CANVAS,
        // PermissionEnum::MANAGE_STORY,
        // PermissionEnum::VIEW_STORY,
        // PermissionEnum::MANAGE_CHANGE_REQUEST,
        // PermissionEnum::VIEW_CHANGE_REQUEST,
        // PermissionEnum::MANAGE_PRIORITIZATION,
        // PermissionEnum::VIEW_PRIORITIZATION,
        // PermissionEnum::MANAGE_BUSINESS_RULE,
        // PermissionEnum::VIEW_BUSINESS_RULE,
        // PermissionEnum::MANAGE_USAGE_SCENARIO,
        // PermissionEnum::VIEW_USAGE_SCENARIO,
        // PermissionEnum::MANAGE_OVERALL_MODEL,
        // PermissionEnum::VIEW_OVERALL_MODEL,
        // PermissionEnum::MANAGE_SYSTEM_INTERFACE,
        // PermissionEnum::VIEW_SYSTEM_INTERFACE,
        // PermissionEnum::MANAGE_STORYBOARD,
        // PermissionEnum::VIEW_STORYBOARD,
        // PermissionEnum::MANAGE_INTERVIEW,
        // PermissionEnum::VIEW_INTERVIEW,
      ],
      self::TEAM => [
        PermissionEnum::USER_STORY_CREATE,
        PermissionEnum::USER_STORY_EDIT,
        PermissionEnum::USER_STORY_DELETE,

        PermissionEnum::SYSTEM_STORY_CREATE,
        PermissionEnum::SYSTEM_STORY_EDIT,
        PermissionEnum::SYSTEM_STORY_DELETE,

        PermissionEnum::SPRINT_CREATE,
        PermissionEnum::SPRINT_EDIT,
        PermissionEnum::SPRINT_DELETE,

        PermissionEnum::PRODUCT_BACKLOG_CREATE,
        PermissionEnum::PRODUCT_BACKLOG_EDIT,
        PermissionEnum::PRODUCT_BACKLOG_DELETE,

        PermissionEnum::OVERALL_MODEL_CREATE,
        PermissionEnum::OVERALL_MODEL_EDIT,
        PermissionEnum::OVERALL_MODEL_DELETE,

        PermissionEnum::INSPECTION_CARDS_CREATE,
        PermissionEnum::INSPECTION_CARDS_EDIT,
        PermissionEnum::INSPECTION_CARDS_DELETE,

        // PermissionEnum::VIEW_PROJECT,
        // PermissionEnum::VIEW_PERSONA,
        // PermissionEnum::VIEW_GOAL,
        // PermissionEnum::VIEW_JOURNEY,
        // PermissionEnum::VIEW_PRODUCT_CANVAS,
        // PermissionEnum::MANAGE_STORY,
        // PermissionEnum::VIEW_STORY,
        // PermissionEnum::VIEW_CHANGE_REQUEST,
        // PermissionEnum::VIEW_PRIORITIZATION,
        // PermissionEnum::MANAGE_SPRINT,
        // PermissionEnum::VIEW_SPRINT,
        // PermissionEnum::MANAGE_BUSINESS_RULE,
        // PermissionEnum::VIEW_BUSINESS_RULE,
        // PermissionEnum::MANAGE_USAGE_SCENARIO,
        // PermissionEnum::VIEW_USAGE_SCENARIO,
        // PermissionEnum::MANAGE_OVERALL_MODEL,
        // PermissionEnum::VIEW_OVERALL_MODEL,
        // PermissionEnum::MANAGE_SYSTEM_INTERFACE,
        // PermissionEnum::VIEW_SYSTEM_INTERFACE,
        // PermissionEnum::MANAGE_STORYBOARD,
        // PermissionEnum::VIEW_STORYBOARD,
        // PermissionEnum::VIEW_INTERVIEW,
      ],
      self::FACILITATOR => [
        PermissionEnum::PRODUCT_CANVAS_CREATE,
        PermissionEnum::PRODUCT_CANVAS_EDIT,
        PermissionEnum::PRODUCT_CANVAS_DELETE,

        PermissionEnum::USER_STORY_CREATE,
        PermissionEnum::USER_STORY_EDIT,
        PermissionEnum::USER_STORY_DELETE,

        // PermissionEnum::VIEW_PROJECT,
        // PermissionEnum::VIEW_PERSONA,
        // PermissionEnum::VIEW_GOAL,
        // PermissionEnum::VIEW_JOURNEY,
        // PermissionEnum::VIEW_PRODUCT_CANVAS,
        // PermissionEnum::VIEW_STORY,
        // PermissionEnum::VIEW_CHANGE_REQUEST,
        // PermissionEnum::VIEW_PRIORITIZATION,
        // PermissionEnum::VIEW_SPRINT,
        // PermissionEnum::VIEW_BUSINESS_RULE,
        // PermissionEnum::VIEW_USAGE_SCENARIO,
        // PermissionEnum::VIEW_OVERALL_MODEL,
        // PermissionEnum::VIEW_SYSTEM_INTERFACE,
        // PermissionEnum::VIEW_STORYBOARD,
        // PermissionEnum::VIEW_INTERVIEW,
      ],
    };
  }

  public function hasPermission(PermissionEnum $permission): bool
  {
    if ($this === self::ADMINISTRATOR) {
      return true;
    }
    return in_array($permission, $this->permissions());
  }

  public static function values(): array
  {
    return array_column(self::cases(), 'value');
  }
}
