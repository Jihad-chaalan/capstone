<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Post;
use App\Models\Skill;
use App\Models\Application;
use Illuminate\Http\JsonResponse;

class AdminStatisticsController extends Controller
{
    public function getOverview(): JsonResponse
    {
        try {
            $totalUsers = User::count();
            $seekers = User::where('role', 'seeker')->count();
            $companies = User::where('role', 'company')->count();
            $universities = User::where('role', 'university')->count();
            $totalPosts = Post::count();
            $totalApplications = Application::count();
            $totalSkills = Skill::where('is_active', true)->count();

            return response()->json([
                'data' => [
                    'totalUsers' => $totalUsers,
                    'seekers' => $seekers,
                    'companies' => $companies,
                    'universities' => $universities,
                    'totalPosts' => $totalPosts,
                    'totalApplications' => $totalApplications,
                    'totalSkills' => $totalSkills,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getSkillsDistribution(): JsonResponse
    {
        try {
            $skills = Skill::where('is_active', true)
                ->withCount('seekers')
                ->orderByDesc('seekers_count')
                ->limit(15)
                ->get(['id', 'name']);

            $skillsDistribution = $skills->map(function ($skill) {
                return [
                    'name' => $skill->name,
                    'count' => $skill->seekers_count ?? 0,
                ];
            });

            return response()->json(['data' => $skillsDistribution->values()]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getTechnologyDemand(): JsonResponse
    {
        try {
            $technologies = Post::selectRaw('technology as name, COUNT(*) as count')
                ->whereNotNull('technology')
                ->groupBy('technology')
                ->orderByDesc('count')
                ->limit(15)
                ->get();

            return response()->json(['data' => $technologies->values()]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getApplicationsStats(): JsonResponse
    {
        try {
            $stats = [
                'total' => Application::count(),
                'completed' => Application::where('status', 'completed')->count(),
                'rejected' => Application::where('status', 'rejected')->count(),
                'applied' => Application::where('status', 'applied')->count(),
            ];

            return response()->json(['data' => $stats]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getUsersBreakdown(): JsonResponse
    {
        try {
            $breakdown = User::selectRaw('role, COUNT(*) as count')
                ->whereIn('role', ['seeker', 'company', 'university', 'admin'])
                ->groupBy('role')
                ->get()
                ->map(function ($user) {
                    return [
                        'role' => ucfirst($user->role),
                        'count' => $user->count,
                    ];
                });

            return response()->json(['data' => $breakdown->values()]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getAllStatistics(): JsonResponse
    {
        try {
            $totalUsers = User::count();
            $seekers = User::where('role', 'seeker')->count();
            $companies = User::where('role', 'company')->count();
            $universities = User::where('role', 'university')->count();
            $totalPosts = Post::count();
            $totalApplications = Application::count();
            $totalSkills = Skill::where('is_active', true)->count();

            $skillsDistribution = Skill::where('is_active', true)
                ->withCount('seekers')
                ->orderByDesc('seekers_count')
                ->limit(15)
                ->get(['id', 'name'])
                ->map(function ($skill) {
                    return [
                        'name' => $skill->name,
                        'count' => $skill->seekers_count ?? 0,
                    ];
                })->values();

            $technologyDemand = Post::selectRaw('technology as name, COUNT(*) as count')
                ->whereNotNull('technology')
                ->groupBy('technology')
                ->orderByDesc('count')
                ->limit(15)
                ->get()->values();

            $applicationsStats = [
                'total' => $totalApplications,
                'completed' => Application::where('status', 'completed')->count(),
                'rejected' => Application::where('status', 'rejected')->count(),
                'applied' => Application::where('status', 'applied')->count(),
            ];

            $usersBreakdown = User::selectRaw('role, COUNT(*) as count')
                ->whereIn('role', ['seeker', 'company', 'university', 'admin'])
                ->groupBy('role')
                ->get()
                ->map(function ($user) {
                    return [
                        'role' => ucfirst($user->role),
                        'count' => $user->count,
                    ];
                })->values();

            return response()->json([
                'data' => [
                    'overview' => [
                        'totalUsers' => $totalUsers,
                        'seekers' => $seekers,
                        'companies' => $companies,
                        'universities' => $universities,
                        'totalPosts' => $totalPosts,
                        'totalApplications' => $totalApplications,
                        'totalSkills' => $totalSkills,
                    ],
                    'skillsDistribution' => $skillsDistribution,
                    'technologyDemand' => $technologyDemand,
                    'applicationsStats' => $applicationsStats,
                    'usersBreakdown' => $usersBreakdown,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
