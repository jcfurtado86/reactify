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

  public static function values(): array
  {
    return array_column(self::cases(), 'value');
  }
}
