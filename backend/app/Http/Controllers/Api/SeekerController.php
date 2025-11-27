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
        $query = Seeker::with(['user', 'projects']);

        // Filter by skills
        if ($request->has('skills')) {
            $query->where('skills', 'like', '%' . $request->skills . '%');
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
        $seeker = Seeker::with(['user', 'projects'])->findOrFail($id);

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
            'skills' => 'nullable|string',
            'description' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
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

        $seeker->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $seeker->load(['user', 'projects'])
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

        $seeker = $request->user()->seeker->load(['user', 'projects', 'applications.post.company.user']);

        return response()->json([
            'success' => true,
            'data' => $seeker
        ]);
    }
}
