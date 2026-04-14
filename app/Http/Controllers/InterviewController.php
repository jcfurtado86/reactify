<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Cloudinary\Api\Exception\NotFound;
use Log;
use App\Jobs\TranscribeInterviewJob; // Importa o novo Job

class InterviewController extends Controller
{
    /**
     * Armazena uma nova entrevista de qualquer tipo no Cloudinary.
     */
    public function store(Request $request, Project $project)
    {
        $request->validate([
            'interview' => 'required|file|mimes:pdf,mp3,mp4|max:51200'        ]);

        try {
            $file = $request->file('interview');
            $originalName = $file->getClientOriginalName();

            $fileNameWithoutExtension = pathinfo($originalName, PATHINFO_FILENAME);
            $fileExtension = $file->getClientOriginalExtension();
            $publicFileName = Str::slug($fileNameWithoutExtension) . '.' . $fileExtension;
            
            $folder = 'reactify/interviews/' . $project->id;
            $uploadedFile = cloudinary()->uploadApi()->upload($file->getRealPath(), [
                'folder'           => $folder,
                'public_id'        => pathinfo($publicFileName, PATHINFO_FILENAME),
                'unique_filename'  => false,
                'overwrite'        => true,
                'resource_type'    => 'auto', // Cloudinary deteta o tipo automaticamente
            ]);

            $interview = $project->interviews()->create([
                'file_name' => $originalName,
                'file_path' => $uploadedFile['secure_url'],
                'public_id' => $uploadedFile['public_id'],
                'resource_type'   => $uploadedFile['resource_type'],
                'extraction_status' => 'processing',
            ]);

            // Despacha o Job para processar a transcrição em segundo plano
            TranscribeInterviewJob::dispatch($interview);

            return back()->with(['status' => 'success', 'message' => 'Entrevista enviada. O processamento foi iniciado.']);

        } catch (\Exception $e) {
            Log::error("Falha no upload da entrevista: " . $e->getMessage());
            return back()->with(['status' => 'error', 'message' => 'Falha ao enviar a entrevista.']);
        }
    }

    /**
     * Redispara o job de transcrição para uma entrevista que falhou.
     */
    public function retry(Interview $interview)
    {
        $interview->update(['extraction_status' => 'processing']);
        TranscribeInterviewJob::dispatch($interview);
        return back()->with(['status' => 'success', 'message' => 'Extração reiniciada.']);
    }

    /**
     * Atualiza o campo de 'transcript' de uma entrevista específica.
     */
    public function update(Request $request, Interview $interview)
    {
        $validated = $request->validate([
            'transcript' => ['required', 'string'],
        ]);

        try {
            $interview->update([
                'transcript' => $validated['transcript'],
            ]);

            return back()->with('success', 'Transcrição atualizada com sucesso.');

        } catch (\Exception $e) {
            Log::error("Falha ao atualizar transcrição da Entrevista ID: {$interview->id}. Erro: " . $e->getMessage());
            return back()->withErrors(['update' => 'Ocorreu um erro ao salvar a transcrição.']);
        }
    }

    /**
     * Remove o ficheiro do Cloudinary e o registo da base de dados.
     */
    public function destroy(Interview $interview)
    {
        try {
            $publicID = $interview->public_id;

            if ($publicID) {
                $resourceType = $interview->resource_type; 
                
                if (!$resourceType) {
                    $resourceType = $this->getResourceType($interview->file_name);
                }

                cloudinary()->adminApi()->deleteAssets([$publicID], [
                    'resource_type' => $resourceType
                ]);
            }

            $interview->delete();

            return back()->with(['status' => 'success', 'message' => 'Entrevista apagada com sucesso']);
        } catch (NotFound $e) {
            Log::warning("Tentativa de excluir asset não encontrado no Cloudinary (public_id: {$interview->public_id}). Deletando do banco de dados mesmo assim.");
            $interview->delete(); // Deleta do nosso banco mesmo se não estiver no Cloudinary
            return back()->with(['status' => 'success', 'message' => 'Entrevista removida do sistema.']);
        }
        catch (\Exception $e) {
            Log::error("Falha ao apagar a entrevista: ID {$interview->id} - " . $e->getMessage());
            return back()->with(['status' => 'error', 'message' => 'Erro ao excluir entrevista.']);
        }
    }
    /**
     * Função auxiliar para determinar o resource_type do Cloudinary a partir do nome do ficheiro.
     */
    private function getResourceType(string $fileName): string
    {
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // Cloudinary trata áudio como 'video'
        $videoTypes = ['mp4', 'mov', 'avi', 'webm', 'mp3', 'wav', 'ogg', 'm4a'];
        $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

        if (in_array($extension, $videoTypes)) {
            return 'video';
        }

        if (in_array($extension, $imageTypes)) {
            return 'image';
        }

        // Para tudo o resto (PDF, TXT, DOCX, etc.)
        return 'raw';
    }
}