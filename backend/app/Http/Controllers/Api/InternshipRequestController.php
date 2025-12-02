<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InternshipRequest;
use Illuminate\Http\Request;

class InternshipRequestController extends Controller
{
    /**
     * Get all internship requests (university's own requests)
     */
    public function index(Request $request)
    {
        if (!$request->user()->isUniversity()) {
            return response()->json([
                'success' => false,
                'message' => 'Only universities can access this endpoint'
            ], 403);
        }

        $universityId = $request->user()->university->id;

        $requests = InternshipRequest::where('university_id', $universityId)
            ->with(['company.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    /**
     * Create a new internship request
     */
    public function store(Request $request)
    {
        if (!$request->user()->isUniversity()) {
            return response()->json([
                'success' => false,
                'message' => 'Only universities can create internship requests'
            ], 403);
        }

        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'position' => 'required|string|max:255',
            'technology' => 'required|string|max:255',
            'description' => 'required|string',
            'number_of_students' => 'required|integer|min:1|max:100',
        ]);

        $validated['university_id'] = $request->user()->university->id;
        $validated['status'] = InternshipRequest::STATUS_PENDING;

        $internshipRequest = InternshipRequest::create($validated);
        $internshipRequest->load(['company.user']);

        return response()->json([
            'success' => true,
            'message' => 'Internship request sent successfully',
            'data' => $internshipRequest
        ], 201);
    }

    /**
     * Update an internship request (only if pending)
     */
    public function update(Request $request, $id)
    {
        if (!$request->user()->isUniversity()) {
            return response()->json([
                'success' => false,
                'message' => 'Only universities can update internship requests'
            ], 403);
        }

        $internshipRequest = InternshipRequest::findOrFail($id);

        // Check ownership
        if ($internshipRequest->university_id !== $request->user()->university->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own requests'
            ], 403);
        }

        // Can only update pending requests
        if ($internshipRequest->status !== InternshipRequest::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update pending requests'
            ], 400);
        }

        $validated = $request->validate([
            'position' => 'sometimes|string|max:255',
            'technology' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'number_of_students' => 'sometimes|integer|min:1|max:100',
        ]);

        $internshipRequest->update($validated);
        $internshipRequest->load(['company.user']);

        return response()->json([
            'success' => true,
            'message' => 'Request updated successfully',
            'data' => $internshipRequest
        ]);
    }

    /**
     * Delete an internship request (only if pending)
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isUniversity()) {
            return response()->json([
                'success' => false,
                'message' => 'Only universities can delete internship requests'
            ], 403);
        }

        $internshipRequest = InternshipRequest::findOrFail($id);

        // Check ownership
        if ($internshipRequest->university_id !== $request->user()->university->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own requests'
            ], 403);
        }

        // Can only delete pending requests
        if ($internshipRequest->status !== InternshipRequest::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete pending requests'
            ], 400);
        }

        $internshipRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Request deleted successfully'
        ]);
    }

    /**
     * Get all requests for a company (company views their incoming requests)
     */
    public function companyRequests(Request $request)
    {
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can access this endpoint'
            ], 403);
        }

        $companyId = $request->user()->company->id;

        $requests = InternshipRequest::where('company_id', $companyId)
            ->with(['university.user'])
            ->orderBy('status', 'asc') // pending first
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    /**
     * Accept an internship request
     */
    public function acceptRequest(Request $request, $id)
    {
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can accept requests'
            ], 403);
        }

        $internshipRequest = InternshipRequest::findOrFail($id);

        // Check if request is for this company
        if ($internshipRequest->company_id !== $request->user()->company->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only respond to requests sent to your company'
            ], 403);
        }

        $validated = $request->validate([
            'response' => 'nullable|string|max:1000',
        ]);

        $internshipRequest->update([
            'status' => InternshipRequest::STATUS_ACCEPTED,
            'company_response' => $validated['response'] ?? null,
        ]);

        $internshipRequest->load(['university.user']);

        return response()->json([
            'success' => true,
            'message' => 'Request accepted successfully',
            'data' => $internshipRequest
        ]);
    }

    /**
     * Reject an internship request
     */
    public function rejectRequest(Request $request, $id)
    {
        if (!$request->user()->isCompany()) {
            return response()->json([
                'success' => false,
                'message' => 'Only companies can reject requests'
            ], 403);
        }

        $internshipRequest = InternshipRequest::findOrFail($id);

        // Check if request is for this company
        if ($internshipRequest->company_id !== $request->user()->company->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only respond to requests sent to your company'
            ], 403);
        }

        $validated = $request->validate([
            'response' => 'nullable|string|max:1000',
        ]);

        $internshipRequest->update([
            'status' => InternshipRequest::STATUS_REJECTED,
            'company_response' => $validated['response'] ?? null,
        ]);

        $internshipRequest->load(['university.user']);

        return response()->json([
            'success' => true,
            'message' => 'Request rejected',
            'data' => $internshipRequest
        ]);
    }
}
