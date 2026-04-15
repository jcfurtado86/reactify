<?php

namespace App\Enums;

enum ChatMessageSender: string
{
    case USER = 'user';
    case MODEL = 'model';
}
