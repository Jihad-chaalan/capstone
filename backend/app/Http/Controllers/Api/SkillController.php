<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    /**
     * Get all skills (public - for seeker selection)
     */
    public function index()
    {
        $skills = Skill::active()->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $skills
        ]);
    }

    /**
     * Get all skills (admin - includes inactive)
     */
    public function adminIndex()
    {
        $skills = Skill::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $skills
        ]);
    }

    /**
     * Create new skill (admin only)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:skills,name',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $skill = Skill::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Skill created successfully',
            'data' => $skill
        ], 201);
    }

    /**
     * Update skill (admin only)
     */
    public function update(Request $request, $id)
    {
        $skill = Skill::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:skills,name,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $skill->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Skill updated successfully',
            'data' => $skill
        ]);
    }

    /**
     * Delete skill (admin only)
     */
    public function destroy($id)
    {
        $skill = Skill::findOrFail($id);

        // Check if skill is assigned to any seekers
        $seekersCount = $skill->seekers()->count();

        if ($seekersCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete skill. It is assigned to {$seekersCount} seeker(s)."
            ], 400);
        }

        $skill->delete();

        return response()->json([
            'success' => true,
            'message' => 'Skill deleted successfully'
        ]);
    }

    /**
     * Toggle skill status (admin only)
     */
    public function toggleStatus($id)
    {
        $skill = Skill::findOrFail($id);
        $skill->is_active = !$skill->is_active;
        $skill->save();

        return response()->json([
            'success' => true,
            'message' => 'Skill status updated',
            'data' => $skill
        ]);
    }
}
