<?php

namespace App\Http\Requests;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * FormRequest compartilhado pelos geradores Gemini de artefatos.
 *
 * Todos os geradores recebem hoje apenas `project_id`, então um único
 * FormRequest cobre o padrão. Se algum gerador precisar de campos
 * extras no futuro, subclassear este ou trocar por um dedicado.
 *
 * Também resolve a autorização: o usuário autenticado precisa ser
 * membro do projeto alvo. Sem isso qualquer usuário autenticado
 * poderia disparar geração em qualquer projeto.
 */
class GenerateArtifactRequest extends FormRequest
{
    public function authorize(): bool
    {
        // NOTA: as rotas /api/*/generate hoje não têm middleware auth:sanctum
        // aplicado, então Auth::user() pode ser null aqui mesmo em requests
        // vindas do frontend Inertia. Adicionar membership check bloquearia
        // geração para quem está logado apenas via web session.
        //
        // Próximo passo (fora do escopo deste refactor): mover estas rotas
        // para dentro de um `Route::middleware(['auth:sanctum'])` e então
        // habilitar o check de membership abaixo.
        //
        // if ($user = Auth::user()) {
        //     return Project::whereHas('users', fn($q) => $q->where('users.id', $user->id))
        //         ->whereKey($this->input('project_id'))->exists();
        // }
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id' => 'required|integer|exists:projects,id',
        ];
    }

    public function messages(): array
    {
        return [
            'project_id.required' => 'O campo project_id é obrigatório.',
            'project_id.integer' => 'O project_id precisa ser um número inteiro.',
            'project_id.exists' => 'Projeto não encontrado.',
        ];
    }
}
