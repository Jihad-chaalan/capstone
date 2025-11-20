<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Seeker;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Get all projects for a specific seeker
     */
    public function index($seekerId)
    {
        $seeker = Seeker::findOrFail($seekerId);
        $projects = $seeker->projects()->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    /**
     * Get authenticated seeker's projects
     */
    public function myProjects(Request $request)
    {
        if (!$request->user()->isSeeker()) {
            return response()->json([
                'success' => false,
                'message' => 'Only seekers can access this endpoint'
            ], 403);
        }

        $projects = $request->user()->seeker->projects()->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    /**
     * Get single project
     */
    public function show($id)
    {
        $project = Project::with('seeker.user')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $project
        ]);
    }

    /**
     * Create new project (Seeker only)
     */
    public function store(Request $request)
    {
        if (!$request->user()->isSeeker()) {
            return response()->json([
                'success' => false,
                'message' => 'Only seekers can create projects'
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'link' => 'nullable|url|max:255',
        ]);

        $project = $request->user()->seeker->projects()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => $project
        ], 201);
    }

    /**
     * Update project
     */
    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        // Check if user owns this project
        if (!$request->user()->isSeeker() || $project->seeker->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'link' => 'nullable|url|max:255',
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => $project
        ]);
    }

    /**
     * Delete project
     */
    public function destroy(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        // Check if user owns this project
        if (!$request->user()->isSeeker() || $project->seeker->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully'
        ]);
    }
}
