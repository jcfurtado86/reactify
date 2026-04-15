<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'file_name',
        'file_path',
        'public_id',
        'extraction_status',
        'transcript',
        'transcript_raw',
        'transcript_summary',
        'resource_type',
    ];

    /**
     * Retorna o contexto consolidado das entrevistas de um projeto pra
     * alimentar as strategies de IA. Usa o `transcript_summary` quando
     * existir (cache denso gerado por SummarizeInterviewJob), senão
     * cai no `transcript` cru. Zero regressão quando o summary ainda
     * não foi gerado.
     */
    public static function aiContextForProject(int $projectId): string
    {
        return self::where('project_id', $projectId)
            ->whereNotNull('transcript')
            ->where('transcript', '!=', '')
            ->get()
            ->map(fn($i) => $i->transcript_summary ?: $i->transcript)
            ->implode("\n\n---\n\n");
    }

    /**
     * Adiciona o atributo 'url' ao modelo para ser usado no frontend.
     */
    protected $appends = ['url'];

    /**
     * Relação: Uma entrevista pertence a um projeto.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Atributo virtual 'url' que retorna a URL pública completa do ficheiro.
     * Como já guardamos a URL completa, apenas a retornamos.
     */
    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->file_path,
        );
    }
}