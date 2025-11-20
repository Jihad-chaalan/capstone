<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Post;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    /**
     * Get all applications (for admin)
     */
    public function index(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $applications = Application::with(['post.company.user', 'seeker.user'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    /**
     * Apply for a post (Seeker only)
     */
    public function store(Request $request)
    {
        if (!$request->user()->isSeeker()) {
            return response()->json([
                'success' => false,
                'message' => 'Only seekers can apply for posts'
            ], 403);
        }

        $validated = $request->validate([
            'post_id' => 'required|exists:posts,id',
        ]);

        $seeker = $request->user()->seeker;
        $post = Post::findOrFail($validated['post_id']);

        // Check if already applied
        $existingApplication = Application::where('internship_post_id', $post->id)
            ->where('internship_seeker_id', $seeker->id)
            ->first();

        if ($existingApplication) {
            return response()->json([
                'success' => false,
                'message' => 'You have already applied for this post'
            ], 400);
        }

        $application = Application::create([
            'internship_post_id' => $post->id,
            'internship_seeker_id' => $seeker->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully',
            'data' => $application->load(['post.company.user', 'seeker.user'])
        ], 201);
    }

    /**
     * Get applications for authenticated seeker
     */
    public function mySeekerApplications(Request $request)
    {
        if (!$request->user()->isSeeker()) {
            return response()->json([
                'success' => false,
                'message' => 'Only seekers can access this endpoint'
            ], 403);
        }

        $applications = $request->user()->seeker->applications()
            ->with(['post.company.user'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    /**
     * Get applications for company's posts
     */
    public function myCompanyApplications(Request $request)
    {
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can access this endpoint'
            ], 403);
        }

        $company = $request->user()->company;

        $applications = Application::whereHas('post', function ($query) use ($company) {
            $query->where('company_id', $company->id);
        })
            ->with(['post', 'seeker.user', 'seeker.projects'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    /**
     * Get applications for a specific post (Company owner only)
     */
    public function getPostApplications(Request $request, $postId)
    {
        $post = Post::findOrFail($postId);

        // Check if user owns this post
        if (!$request->user()->isCompany() || $post->company->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $applications = $post->applications()
            ->with(['seeker.user', 'seeker.projects'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    /**
     * Delete application (Seeker can withdraw)
     */
    public function destroy(Request $request, $id)
    {
        $application = Application::findOrFail($id);

        // Check if user owns this application
        if (!$request->user()->isSeeker() || $application->seeker->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $application->delete();

        return response()->json([
            'success' => true,
            'message' => 'Application withdrawn successfully'
        ]);
    }
}
