<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SeekerController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\UniversityController;
use App\Http\Controllers\Api\InternshipRequestController;
use App\Http\Controllers\Api\AdminCompanyController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public - Get all posts
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{id}', [PostController::class, 'show']);

// Public - Get all companies
Route::get('/companies', [CompanyController::class, 'index']);
Route::get('/companies/{id}', [CompanyController::class, 'show']);

// Public - Get all universities
Route::get('/universities', [UniversityController::class, 'index']);
Route::get('/universities/{id}', [UniversityController::class, 'show']);

// Public - Get all seekers
Route::get('/seekers', [SeekerController::class, 'index']);
Route::get('/seekers/{id}', [SeekerController::class, 'show']);

// Public - Get seeker's projects
Route::get('/seekers/{seekerId}/projects', [ProjectController::class, 'index']);
Route::get('/projects/{id}', [ProjectController::class, 'show']);

// Protected routes (requires authentication)
Route::middleware('auth:sanctum')->group(function () {

    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // User routes
    Route::put('/user/update', [UserController::class, 'update']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);

    // Admin only routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::get('/applications', [ApplicationController::class, 'index']);
        // Companies verification
        Route::get('/companies', [AdminCompanyController::class, 'index']);
        Route::get('/companies/pending', [AdminCompanyController::class, 'pending']);
        Route::post('/companies/{id}/verify', [AdminCompanyController::class, 'verify']);
        Route::post('/companies/{id}/reject', [AdminCompanyController::class, 'reject']);
        Route::get('/companies/{id}/certificate', [AdminCompanyController::class, 'getCertificate']);
    });

    // Company routes
    Route::middleware('company')->group(function () {
        Route::get('/company/me', [CompanyController::class, 'me']);
        Route::put('/company/update', [CompanyController::class, 'update']);

        // Company posts
        Route::post('/posts', [PostController::class, 'store']);
        Route::get('/company/posts', [PostController::class, 'myPosts']);
        Route::put('/posts/{id}', [PostController::class, 'update']);
        Route::delete('/posts/{id}', [PostController::class, 'destroy']);

        // Company applications
        Route::get('/company/applications', [ApplicationController::class, 'myCompanyApplications']);
        Route::get('/posts/{postId}/applications', [ApplicationController::class, 'getPostApplications']);

        // Company internship requests
        Route::get('/company/requests', [InternshipRequestController::class, 'companyRequests']);
        Route::post('/internship-requests/{id}/accept', [InternshipRequestController::class, 'acceptRequest']);
        Route::post('/internship-requests/{id}/reject', [InternshipRequestController::class, 'rejectRequest']);
    });

    // Seeker routes
    Route::middleware('seeker')->group(function () {
        Route::get('/seeker/me', [SeekerController::class, 'me']);
        Route::put('/seeker/update', [SeekerController::class, 'update']);

        // Seeker projects
        Route::get('/seeker/projects', [ProjectController::class, 'myProjects']);
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::put('/projects/{id}', [ProjectController::class, 'update']);
        Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

        // Seeker applications
        Route::post('/applications', [ApplicationController::class, 'store']);
        Route::get('/seeker/applications', [ApplicationController::class, 'mySeekerApplications']);
        Route::delete('/applications/{id}', [ApplicationController::class, 'destroy']);
    });

    // University routes
    Route::middleware('university')->group(function () {
        Route::get('/university/me', [UniversityController::class, 'me']);
        Route::put('/university/update', [UniversityController::class, 'update']);

        // University internship requests
        Route::get('/university/requests', [InternshipRequestController::class, 'index']);
        Route::post('/internship-requests', [InternshipRequestController::class, 'store']);
        Route::put('/internship-requests/{id}', [InternshipRequestController::class, 'update']);
        Route::delete('/internship-requests/{id}', [InternshipRequestController::class, 'destroy']);
    });
});
