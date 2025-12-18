<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin;
use App\Models\Company;
use App\Models\Seeker;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,company,seeker,university',
            'phone_number' => 'nullable|string|max:20',

            // Company specific fields
            'address' => 'required_if:role,company|string|max:255',
            'website_link' => 'nullable|string|max:255',
            'company_description' => 'nullable|string',
            'certificate' => 'required_if:role,company|file|mimes:pdf,jpg,jpeg,png|max:5120',

            // Seeker specific fields
            'skills' => 'nullable|string',
            'seeker_description' => 'nullable|string',
        ]);

        // Create user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone_number' => $validated['phone_number'] ?? null,
        ]);

        // Create role-specific profile
        switch ($validated['role']) {
            case 'admin':
                Admin::create(['user_id' => $user->id]);
                break;

            case 'company':
                $certificatePath = null;

                // Handle certificate upload
                if ($request->hasFile('certificate')) {
                    $file = $request->file('certificate');
                    $filename = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
                    $certificatePath = $file->storeAs('certificates', $filename, 'public');
                }
                Company::create([
                    'user_id' => $user->id,
                    'address' => $validated['address'],
                    'website_link' => $validated['website_link'] ?? null,
                    'description' => $validated['company_description'] ?? null,
                    'certificate_path' => $certificatePath,
                    'verification_status' => Company::STATUS_PENDING,
                ]);
                break;

            case 'seeker':
                Seeker::create([
                    'user_id' => $user->id,
                    'skills' => $validated['skills'] ?? null,
                    'description' => $validated['seeker_description'] ?? null,
                ]);
                break;

            case 'university':
                University::create(['user_id' => $user->id]);
                break;
        }

        // Create token for authentication
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => $user->load($validated['role']),
                'token' => $token,
            ]
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Delete old tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Load role-specific data
        $user->load($user->role);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load($request->user()->role);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }
}
