<?php

namespace App\Enums;

// Papéis humanos seguem REACT-M (Customer, Domain Expert, Team).
// Facilitador do REACT-M NÃO é usuário humano — é o chatbot em py_service/chat_service.py.
// Administrator é conceito de ferramenta (dono/ops do projeto), fora do REACT-M.
enum UserRole: string
{
  case CUSTOMER = 'customer';
  case DOMAIN_EXPERT = 'domain_expert';
  case TEAM = 'team';
  case ADMINISTRATOR = 'administrator';

  public function label(): string
  {
    return match ($this) {
      self::CUSTOMER => 'Customer',
      self::DOMAIN_EXPERT => 'Domain Expert',
      self::TEAM => 'Team',
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
        PermissionEnum::BUSINESS_RULE_VIEW,
        PermissionEnum::USAGE_SCENARIO_VIEW,
        PermissionEnum::OVERALL_MODEL_VIEW,
        PermissionEnum::INTERFACE_VIEW,
        PermissionEnum::STORYBOARD_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_MANAGE,
        PermissionEnum::CHANGE_LOG_VIEW,
        PermissionEnum::CHANGE_LOG_MANAGE,
        PermissionEnum::PRODUCT_BACKLOG_VIEW,
        PermissionEnum::SPRINT_VIEW,
        PermissionEnum::INSPECTION_CARDS_VIEW,
      ],

      self::DOMAIN_EXPERT => [
        PermissionEnum::PERSONA_VIEW,
        PermissionEnum::PERSONA_MANAGE,
        PermissionEnum::GOAL_VIEW,
        PermissionEnum::GOAL_MANAGE,
        PermissionEnum::JOURNEY_VIEW,
        PermissionEnum::JOURNEY_MANAGE,
        PermissionEnum::PRODUCT_CANVAS_VIEW,
        PermissionEnum::PRODUCT_CANVAS_MANAGE,
        PermissionEnum::USER_STORY_VIEW,
        PermissionEnum::USER_STORY_MANAGE,
        PermissionEnum::BUSINESS_RULE_VIEW,
        PermissionEnum::BUSINESS_RULE_MANAGE,
        PermissionEnum::USAGE_SCENARIO_VIEW,
        PermissionEnum::USAGE_SCENARIO_MANAGE,
        PermissionEnum::OVERALL_MODEL_VIEW,
        PermissionEnum::INTERFACE_VIEW,
        PermissionEnum::STORYBOARD_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_MANAGE,
        PermissionEnum::CHANGE_LOG_VIEW,
        PermissionEnum::CHANGE_LOG_MANAGE,
        PermissionEnum::PRODUCT_BACKLOG_VIEW,
        PermissionEnum::PRODUCT_BACKLOG_MANAGE,
        PermissionEnum::SPRINT_VIEW,
        PermissionEnum::INSPECTION_CARDS_VIEW,
      ],

      self::TEAM => [
        PermissionEnum::PERSONA_VIEW,
        PermissionEnum::PERSONA_MANAGE,
        PermissionEnum::GOAL_VIEW,
        PermissionEnum::JOURNEY_VIEW,
        PermissionEnum::PRODUCT_CANVAS_VIEW,
        PermissionEnum::USER_STORY_VIEW,
        PermissionEnum::USER_STORY_MANAGE,
        PermissionEnum::BUSINESS_RULE_VIEW,
        PermissionEnum::BUSINESS_RULE_MANAGE,
        PermissionEnum::USAGE_SCENARIO_VIEW,
        PermissionEnum::USAGE_SCENARIO_MANAGE,
        PermissionEnum::OVERALL_MODEL_VIEW,
        PermissionEnum::OVERALL_MODEL_MANAGE,
        PermissionEnum::INTERFACE_VIEW,
        PermissionEnum::INTERFACE_MANAGE,
        PermissionEnum::STORYBOARD_VIEW,
        PermissionEnum::STORYBOARD_MANAGE,
        PermissionEnum::PRIORITIZATION_MATRIX_VIEW,
        PermissionEnum::PRIORITIZATION_MATRIX_MANAGE,
        PermissionEnum::CHANGE_LOG_VIEW,
        PermissionEnum::CHANGE_LOG_MANAGE,
        PermissionEnum::PRODUCT_BACKLOG_VIEW,
        PermissionEnum::SPRINT_VIEW,
        PermissionEnum::SPRINT_MANAGE,
        PermissionEnum::INSPECTION_CARDS_VIEW,
        PermissionEnum::INSPECTION_CARDS_MANAGE,
      ],
    };
  }

  public function hasPermission(PermissionEnum $permission): bool
  {
    if ($this === self::ADMINISTRATOR) {
      return true;
    }
    return in_array($permission, $this->permissions(), true);
  }

  public static function values(): array
  {
    return array_column(self::cases(), 'value');
  }
}
