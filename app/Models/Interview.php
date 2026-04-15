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
     * alimentar as strategies de IA. Usa o `transcript` cru — o summary
     * cacheado (coluna `transcript_summary`) foi desativado porque agora
     * rodamos em provider cloud (Claude/Gemini) que aguenta transcript
     * completo sem pressão, e a camada de resumo é lossy demais. A coluna
     * segue existindo pra eventual revival se voltarmos pro Ollama local.
     */
    public static function aiContextForProject(int $projectId): string
    {
        return self::where('project_id', $projectId)
            ->whereNotNull('transcript')
            ->where('transcript', '!=', '')
            ->get()
            ->map(fn($i) => $i->transcript)
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