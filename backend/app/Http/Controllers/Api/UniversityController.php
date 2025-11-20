<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UniversityController extends Controller
{
    /**
     * Get all universities
     */
    public function index(Request $request)
    {
        $query = University::with(['user']);

        // Search by name
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            });
        }

        $universities = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $universities
        ]);
    }

    /**
     * Get single university profile
     */
    public function show($id)
    {
        $university = University::with(['user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $university
        ]);
    }

    /**
     * Update university profile
     */
    public function update(Request $request)
    {
        if (!$request->user()->isUniversity()) {
            return response()->json([
                'success' => false,
                'message' => 'Only universities can update their profile'
            ], 403);
        }

        $validated = $request->validate([
            // Add any university-specific fields here
            // For now, university table only has user_id
            // You can add fields like: address, website, description, logo, etc.
        ]);

        $university = $request->user()->university;
        $university->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $university->load('user')
        ]);
    }

    /**
     * Get authenticated university profile
     */
    public function me(Request $request)
    {
        if (!$request->user()->isUniversity()) {
            return response()->json([
                'success' => false,
                'message' => 'Only universities can access this endpoint'
            ], 403);
        }

        $university = $request->user()->university->load('user');

        return response()->json([
            'success' => true,
            'data' => $university
        ]);
    }
}
