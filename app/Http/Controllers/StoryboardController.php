<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Storyboard;
use Illuminate\Http\Request;
use Cloudinary\Api\Exception\NotFound;
use Log;

class StoryboardController extends Controller
{
  public function store(Request $request)
  {
    $request->validate(
      [
        'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        'story_id' => 'required|exists:stories,id',
        'project_id' => 'required|exists:projects,id'
      ]
    );

    $project = Project::findOrFail($request['project_id']);
    $this->authorize('create', [Storyboard::class, $project]);

    try {
      $file = $request->file('image');

      $folder = 'reactify/storyboards';

      $publicId = 'story_id=' . $request['story_id'];

      $assetExistsInCloudinary = false;

      try {
        cloudinary()->adminApi()->asset(
          $folder . '/' . $publicId
        );
        $assetExistsInCloudinary = true;
      } catch (NotFound $e) {
        // Esta exceção é esperada caso o arquivo não exista.
        // Não precisamos fazer nada, $assetExistsInCloudinary continuará `false`.
      }

      $uploadedFile = cloudinary()->uploadApi()->upload(
        $file->getRealPath(),
        [
          'folder' => $folder,
          'public_id' => $publicId,
          'overwrite' => true
        ]
      );

      $secureUrl = $uploadedFile['secure_url'];

      $storyboard = Storyboard::updateOrCreate(['story_id' => $request['story_id']], [
        'story_id' => $request['story_id'],
        'project_id' => $request['project_id'],
        'image_url' => $secureUrl,
      ]);

      $message = '';

      if ($storyboard && $storyboard->wasRecentlyCreated) {
        $message = 'Storboard criado com sucesso';
      } else {
        if ($assetExistsInCloudinary) {
          $message = 'Storyboard atualizado com sucesso';
        } else {
          // Cenário raro: o registro existia no DB, mas a imagem não existia no Cloudinary.
          $message = 'Storyboard atualizado com sucesso (uma nova imagem foi adicionada).';
        }
      }
      return back()->with(['status' => 'success', 'message' => $message]);
    } catch (\Exception $e) {
      Log::error($e->getMessage());
      return back()->with(['status' => 'error', 'message' => 'Failed to create storyboard']);
    }
  }

  public function destroy(Storyboard $storyboard)
  {
    $this->authorize('delete', $storyboard);
    try {
      $publicID = 'reactify/storyboards/story_id=' . $storyboard->story_id;

      $response = cloudinary()->adminApi()->deleteAssets([$publicID]);

      $errorMessage = 'Erro ao excluir storyboard';

      if (isset($response['deleted']) && in_array('not_found', $response['deleted'])) {
        $errorMessage = 'Storyboard não encontrado no Cloudinary para exclusão.';

        throw new \Exception('Asset com public_id "' . $publicID . '" não foi encontrado no Cloudinary para exclusão.');
      }

      $storyboard->delete();

      return back()->with(['status' => 'success', 'message' => 'Storyboard deleted successfully']);
    } catch (\Exception $e) {
      Log::error($e->getMessage());

      return back()->with(['status' => 'error', 'message' => $errorMessage]);
    }
  }
}
