<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Get all posts
     */
    public function index(Request $request)
    {
        $query = Post::with(['company.user'])->withCount('applications');

        // Filter by technology
        if ($request->has('technology')) {
            $query->where('technology', 'like', '%' . $request->technology . '%');
        }

        // Filter by position
        if ($request->has('position')) {
            $query->where('position', 'like', '%' . $request->position . '%');
        }

        // Filter by company
        if ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        $posts = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $posts
        ]);
    }

    /**
     * Get single post
     */
    public function show($id)
    {
        $post = Post::with(['company.user', 'applications.seeker.user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $post
        ]);
    }

    /**
     * Create new post (Company only)
     */
    public function store(Request $request)
    {
        // Check if user is a company
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can create posts'
            ], 403);
        }

        $validated = $request->validate([
            'position' => 'required|string|max:255',
            'technology' => 'required|string|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $company = $request->user()->company;

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('posts', 'public');
        }

        $post = $company->posts()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'data' => $post->load('company.user')
        ], 201);
    }

    /**
     * Update post
     */
    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        // Check if user owns this post
        if ($post->company->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validated = $request->validate([
            'position' => 'sometimes|required|string|max:255',
            'technology' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($post->photo) {
                Storage::disk('public')->delete($post->photo);
            }
            $validated['photo'] = $request->file('photo')->store('posts', 'public');
        }

        $post->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully',
            'data' => $post->load('company.user')
        ]);
    }

    /**
     * Delete post
     */
    public function destroy(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        // Check if user owns this post
        if ($post->company->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Delete photo if exists
        if ($post->photo) {
            Storage::disk('public')->delete($post->photo);
        }

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
        ]);
    }

    /**
     * Get posts by authenticated company
     */
    public function myPosts(Request $request)
    {
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can access this endpoint'
            ], 403);
        }

        $posts = $request->user()->company->posts()
            ->with('applications.seeker.user')
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $posts
        ]);
    }
}
