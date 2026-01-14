<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;

class ChatbotController extends Controller
{
    private $pythonApiUrl = 'http://localhost:8001';

    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        // Get authenticated user's role
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 401);
        }
        $role = $user->role; // seeker, company, university

        try {
            $response = Http::timeout(30)->post($this->pythonApiUrl . '/chat', [
                'message' => $validated['message'],
                'user_role' => $role,
                'user_id' => $user->id,
                'conversation_history' => $request->input('history', [])
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Chatbot service unavailable',
                'message' => $e->getMessage()
            ], 503);
        }
    }

    public function getStatistics()
    {
        try {
            $response = Http::get($this->pythonApiUrl . '/statistics/technologies');
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Service unavailable'], 503);
        }
    }
}
