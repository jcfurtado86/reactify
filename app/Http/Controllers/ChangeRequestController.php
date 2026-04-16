<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChangeRequestController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'requester_name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'request_date' => 'required|date',
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $this->authorize('create', [ChangeRequest::class, $project]);

        $changeRequest = ChangeRequest::create([
            'project_id' => $validated['project_id'],
            'requester_name' => $validated['requester_name'],
            // 'requested_by_id' => Auth::id(),
            'description' => $validated['description'],
            // 'effort' => $validated['effort'],
            'request_date' => $validated['request_date'],
        ]);

        // if (!empty($validated['stories'])) {
        //     foreach ($validated['stories'] as $storyData) {
        //         $changeRequest->stories()->attach($storyData['story_id'], [
        //             'impact_type' => $storyData['impact_type']
        //         ]);
        //     }
        // }

        return back()->with('success', 'Solicitação de mudança criada.');
    }

    public function update(Request $request, ChangeRequest $changeRequest)
    {
        $this->authorize('update', $changeRequest);
        $validated = $request->validate([
            'status' => 'sometimes|string',
            // 'effort' => 'nullable|integer|min:1|max:100',
        ]);

        $changeRequest->update($validated);

        return back()->with('success', 'Solicitação de mudança atualizada.');
    }

    public function destroy(ChangeRequest $changeRequest)
    {
        $this->authorize('delete', $changeRequest);
        $changeRequest->delete();

        return back()->with('success', 'Solicitação de mudança deletada.');
    }
}