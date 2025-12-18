<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminCompanyController extends Controller
{
    /**
     * Get all companies with verification status
     */
    public function index()
    {
        $companies = Company::with('user')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $companies->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->user->name,
                    'email' => $company->user->email,
                    'address' => $company->address,
                    'website_link' => $company->website_link,
                    'certificate_path' => $company->certificate_path,
                    'verification_status' => $company->verification_status,
                    'rejection_reason' => $company->rejection_reason,
                    'verified_at' => $company->verified_at,
                    'created_at' => $company->created_at,
                ];
            })
        ]);
    }

    /**
     * Get pending companies
     */
    public function pending()
    {
        $companies = Company::pending()->with('user')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $companies->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->user->name,
                    'email' => $company->user->email,
                    'address' => $company->address,
                    'website_link' => $company->website_link,
                    'certificate_path' => $company->certificate_path,
                    'verification_status' => $company->verification_status,
                    'created_at' => $company->created_at,
                ];
            })
        ]);
    }

    /**
     * Verify a company
     */
    public function verify(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $company->update([
            'verification_status' => Company::STATUS_VERIFIED,
            'verified_at' => now(),
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Company verified successfully',
            'data' => $company
        ]);
    }

    /**
     * Reject a company
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $company = Company::findOrFail($id);

        $company->update([
            'verification_status' => Company::STATUS_REJECTED,
            'rejection_reason' => $request->reason,
            'verified_at' => null,
        ]);

        return response()->json([
            'message' => 'Company rejected',
            'data' => $company
        ]);
    }


    /**
     * Get certificate file
     */
    public function getCertificate($id)
    {
        $company = Company::findOrFail($id);

        if (!$company->certificate_path) {
            return response()->json(['message' => 'No certificate uploaded'], 404);
        }

        // Try different path combinations
        $possiblePaths = [
            storage_path('app/public/' . $company->certificate_path),
            storage_path('app/' . $company->certificate_path),
            public_path('storage/' . $company->certificate_path),
        ];

        $path = null;
        foreach ($possiblePaths as $possiblePath) {
            if (file_exists($possiblePath)) {
                $path = $possiblePath;
                break;
            }
        }

        if (!$path) {
            return response()->json([
                'message' => 'Certificate file not found',
                'certificate_path' => $company->certificate_path,
                'tried_paths' => $possiblePaths
            ], 404);
        }

        // Get file extension
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        // Set appropriate content type
        $contentType = match (strtolower($extension)) {
            'pdf' => 'application/pdf',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            default => 'application/octet-stream',
        };

        return response()->file($path, [
            'Content-Type' => $contentType,
        ]);
    }
}
