<?php

namespace App\Enums;

enum ChangeRequestStatus: string
{
    case SOLICITADA = 'SOLICITADA';
    case EM_ANALISE = 'EM_ANALISE';
    case IMPLEMENTADA = 'IMPLEMENTADA';
    case REJEITADA = 'REJEITADA';
}
