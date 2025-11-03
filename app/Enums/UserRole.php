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
        PermissionEnum::PERSONA_VIEW,
        PermissionEnum::GOAL_VIEW,
        PermissionEnum::JOURNEY_VIEW,
        PermissionEnum::PRODUCT_CANVAS_VIEW,
        PermissionEnum::USER_STORY_VIEW,
        PermissionEnum::CHANGE_LOG_MANAGE,
        PermissionEnum::CHANGE_LOG_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_MANAGE,
        PermissionEnum::PRIORITIZATION_MATRIX_VIEW,
        PermissionEnum::SPRINT_VIEW,
        PermissionEnum::BUSINESS_RULE_VIEW,
        PermissionEnum::USAGE_SCENARIO_VIEW,
        PermissionEnum::OVERALL_MODEL_VIEW,
        PermissionEnum::INTERFACE_VIEW,
        PermissionEnum::STORYBOARD_VIEW,
      ],
      self::DOMAIN_EXPERT => [
        PermissionEnum::PRODUCT_BACKLOG_MANAGE,
        PermissionEnum::PRODUCT_BACKLOG_VIEW,
        PermissionEnum::PERSONA_MANAGE,
        PermissionEnum::PERSONA_VIEW,
        PermissionEnum::GOAL_MANAGE,
        PermissionEnum::GOAL_VIEW,
        PermissionEnum::JOURNEY_MANAGE,
        PermissionEnum::JOURNEY_VIEW,
        PermissionEnum::PRODUCT_CANVAS_MANAGE,
        PermissionEnum::PRODUCT_CANVAS_VIEW,
        PermissionEnum::USER_STORY_MANAGE,
        PermissionEnum::USER_STORY_VIEW,
        PermissionEnum::CHANGE_LOG_MANAGE,
        PermissionEnum::CHANGE_LOG_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_MANAGE,
        PermissionEnum::PRIORITIZATION_MATRIX_VIEW,
        PermissionEnum::BUSINESS_RULE_MANAGE,
        PermissionEnum::BUSINESS_RULE_VIEW,
        PermissionEnum::USAGE_SCENARIO_MANAGE,
        PermissionEnum::USAGE_SCENARIO_VIEW,
        PermissionEnum::OVERALL_MODEL_MANAGE,
        PermissionEnum::OVERALL_MODEL_VIEW,
        PermissionEnum::INTERFACE_MANAGE,
        PermissionEnum::INTERFACE_VIEW,
        PermissionEnum::STORYBOARD_MANAGE,
        PermissionEnum::STORYBOARD_VIEW,
        // PermissionEnum::INTERVIEW_MANAGE,
        // PermissionEnum::INTERVIEW_VIEW,
      ],
      self::TEAM => [
        PermissionEnum::PERSONA_VIEW,
        PermissionEnum::GOAL_VIEW,
        PermissionEnum::JOURNEY_VIEW,
        PermissionEnum::PRODUCT_CANVAS_VIEW,
        PermissionEnum::USER_STORY_MANAGE, // Story Points
        PermissionEnum::USER_STORY_VIEW,
        PermissionEnum::CHANGE_LOG_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_VIEW,
        PermissionEnum::SPRINT_MANAGE,
        PermissionEnum::SPRINT_VIEW,
        PermissionEnum::BUSINESS_RULE_VIEW,
        PermissionEnum::USAGE_SCENARIO_VIEW,
        PermissionEnum::OVERALL_MODEL_MANAGE,
        PermissionEnum::OVERALL_MODEL_VIEW,
        PermissionEnum::INTERFACE_MANAGE,
        PermissionEnum::INTERFACE_VIEW,
        PermissionEnum::STORYBOARD_MANAGE,
        PermissionEnum::STORYBOARD_VIEW,
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
