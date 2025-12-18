<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seeker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SeekerController extends Controller
{
    /**
     * Get all seekers (with filters)
     */
    public function index(Request $request)
    {
        $query = Seeker::with(['user', 'projects', 'skillsList']);

        // Filter by skills (using the new relationship)
        if ($request->has('skill_ids')) {
            $skillIds = explode(',', $request->skill_ids);
            $query->whereHas('skillsList', function ($q) use ($skillIds) {
                $q->whereIn('skills.id', $skillIds);
            });
        }

        $seekers = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $seekers
        ]);
    }

    /**
     * Get single seeker profile
     */
    public function show($id)
    {
        $seeker = Seeker::with(['user', 'projects', 'skillsList'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $seeker
        ]);
    }

    /**
     * Update seeker profile
     */
    public function update(Request $request)
    {
        if (!$request->user()->isSeeker()) {
            return response()->json([
                'success' => false,
                'message' => 'Only seekers can update their profile'
            ], 403);
        }

        $validated = $request->validate([
            'description' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'skill_ids' => 'nullable|array',
            'skill_ids.*' => 'exists:skills,id',
        ]);

        $seeker = $request->user()->seeker;

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($seeker->photo) {
                Storage::disk('public')->delete($seeker->photo);
            }
            $validated['photo'] = $request->file('photo')->store('seekers', 'public');
        }

        // Update basic info
        $seeker->update([
            'description' => $validated['description'] ?? $seeker->description,
            'photo' => $validated['photo'] ?? $seeker->photo,
        ]);

        // Sync skills (many-to-many)
        if (isset($validated['skill_ids'])) {
            $seeker->skillsList()->sync($validated['skill_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $seeker->load(['user', 'projects', 'skillsList'])
        ]);
    }

    /**
     * Get authenticated seeker profile
     */
    public function me(Request $request)
    {
        if (!$request->user()->isSeeker()) {
            return response()->json([
                'success' => false,
                'message' => 'Only seekers can access this endpoint'
            ], 403);
        }

        $seeker = $request->user()->seeker->load(['user', 'projects', 'skillsList', 'applications.post.company.user']);

        return response()->json([
            'success' => true,
            'data' => $seeker
        ]);
    }
}
