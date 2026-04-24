<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiStoryEnhancer
{
    private string $apiKey;
    private string $model;
    private string $apiBase = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct()
    {
        $this->apiKey = (string) config('services.gemini.key', '');
        $this->model  = (string) config('services.gemini.model', 'gemini-2.5-flash');
    }

    /**
     * Enhance the story text using Gemini.
     *
     * @param  array{
     *   story: string,
     *   occasion?: string|null,
     *   person_one_name?: string|null,
     *   person_two_name?: string|null,
     *   tagline?: string|null,
     *   start_date?: string|null
     * } $data
     * @return array{text: string, model: string}
     * @throws RuntimeException
     */
    public function enhance(array $data): array
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('AI enhancement is not configured. Please contact the administrator.');
        }

        $prompt = $this->buildPrompt($data);

        // Define fallback sequence (try configured model first, then fallbacks)
        $modelsToTry = array_unique([$this->model, 'gemini-2.5-flash', 'gemini-2.0-flash']);
        $lastException = null;

        foreach ($modelsToTry as $currentModel) {
            $url = "{$this->apiBase}/{$currentModel}:generateContent?key={$this->apiKey}";

            try {
                $response = Http::timeout(30)->post($url, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                            ],
                        ],
                    ],
                    'safetySettings' => [
                        ['category' => 'HARM_CATEGORY_HATE_SPEECH',       'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                        ['category' => 'HARM_CATEGORY_HARASSMENT',         'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                        ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                        ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',  'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                    ],
                    'generationConfig' => [
                        'temperature'     => 0.8,
                        'maxOutputTokens' => 2048,
                    ],
                ]);

                // Hard errors (break the loop)
                if ($response->status() === 400) {
                    $errorMsg = $response->json('error.message', '');
                    if (str_contains(strtolower($errorMsg), 'quota')) {
                        throw new \Exception('AI quota reached. Please try again later.', 400);
                    }
                    throw new \Exception('AI request was invalid: ' . $errorMsg, 400);
                }

                // Check safety filters (break the loop)
                $finishReason = $response->json('candidates.0.finishReason', '');
                if ($finishReason === 'SAFETY') {
                    throw new \Exception('Story content could not be enhanced due to content safety filters.', 400);
                }

                // Soft errors (continue to next model)
                if ($response->status() === 503 || $response->status() === 429) {
                    throw new \Exception("Model {$currentModel} overloaded");
                }

                if ($response->failed()) {
                    $errorMsg = $response->json('error.message', 'Unknown error');
                    throw new \Exception("AI service unavailable (HTTP {$response->status()}): {$errorMsg}");
                }

                // Extract the enhanced text
                $enhanced = $response->json('candidates.0.content.parts.0.text', '');

                if (trim($enhanced) === '') {
                    throw new \Exception("Model {$currentModel} returned empty response.");
                }

                // Success! Return immediately.
                return [
                    'text'  => trim($enhanced),
                    'model' => $currentModel,
                ];

            } catch (\Exception $e) {
                // If it's a hard error (e.g., 400 Bad Request, Safety Block), throw immediately
                if ($e->getCode() === 400) {
                    throw new RuntimeException($e->getMessage());
                }

                // Otherwise, it's a soft error (503, timeout, etc). Save it and try next model.
                $lastException = $e;
            }
        }

        // If we exhausted all models
        if ($lastException) {
            throw new RuntimeException('AI service is currently experiencing high demand. Please try again in a few minutes.');
        }

        throw new RuntimeException('AI enhancement failed unexpectedly.');
    }

    /**
     * Build a dynamic, occasion-aware prompt.
     * Tone adapts based on the occasion (birthday, wedding, baby announcement, etc.)
     */
    private function buildPrompt(array $data): string
    {
        $occasion  = trim($data['occasion']        ?? 'celebration');
        $nameOne   = trim($data['person_one_name'] ?? '');
        $nameTwo   = trim($data['person_two_name'] ?? '');
        $tagline   = trim($data['tagline']         ?? '');
        $startDate = trim($data['start_date']      ?? '');
        $rawStory  = trim($data['story']);

        // Build the "people" context line only if names exist
        $peopleLine = match (true) {
            $nameOne !== '' && $nameTwo !== '' => "People: {$nameOne} & {$nameTwo}",
            $nameOne !== ''                   => "Person: {$nameOne}",
            default                           => '',
        };

        $contextLines = array_filter([
            "Occasion: {$occasion}",
            $peopleLine,
            $startDate ? "Date: {$startDate}"    : '',
            $tagline   ? "Tagline: {$tagline}"   : '',
        ]);

        $context = implode("\n", $contextLines);

        return <<<PROMPT
You are a thoughtful storytelling assistant on YaadLink, a platform where people
celebrate life's meaningful moments — from anniversaries and weddings to birthdays,
baby announcements, graduations, and everything in between.

Your task: enhance the user's story for the occasion described below.
- Improve grammar, flow, tone, and emotional clarity to suit the occasion.
- Match the tone to the occasion type (e.g. warm & celebratory for birthdays,
  heartfelt & elegant for weddings, joyful & playful for baby announcements,
  proud & inspiring for graduations, loving & nostalgic for a parent's milestone).
- Preserve ALL names, dates, facts, and events exactly as written.
- Do NOT invent new details, people, or places.
- Return ONLY the enhanced story text — no preamble, no explanation, no markdown formatting.

Context:
{$context}

Original story:
{$rawStory}
PROMPT;
    }
}
