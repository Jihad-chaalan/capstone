<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    /**
     * Get all companies
     */
    public function index(Request $request)
    {
        $query = Company::with(['user', 'posts']);

        // Search by name
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            });
        }

        $companies = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $companies
        ]);
    }

    /**
     * Get single company profile
     */
    public function show($id)
    {
        $company = Company::with(['user', 'posts'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $company
        ]);
    }

    /**
     * Update company profile
     */
    public function update(Request $request)
    {
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can update their profile'
            ], 403);
        }

        $validated = $request->validate([
            'address' => 'nullable|string|max:255',
            'website_link' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $company = $request->user()->company;

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($company->photo) {
                Storage::disk('public')->delete($company->photo);
            }
            $validated['photo'] = $request->file('photo')->store('companies', 'public');
        }

        $company->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $company->load(['user', 'posts'])
        ]);
    }

    /**
     * Get authenticated company profile
     */
    public function me(Request $request)
    {
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can access this endpoint'
            ], 403);
        }

        $company = $request->user()->company->load(['user', 'posts' => function ($query) {
            $query->withCount('applications');
        }]);

        return response()->json([
            'success' => true,
            'data' => $company
        ]);
    }
}
