# Skill: Gemini API Integration

## Purpose
Teaches the agent how to implement LLM functionalities via the Google Gemini API natively within Next.js.

## Guidelines
- Initialize `@google/genai` inside secure backend Server Actions.
- Ensure API keys are never leaked to `use client` components.
- Use explicit and structured schemas when prompting Gemini (e.g., instructing Gemini to return strict JSON using `responseMimeType: "application/json"`).
- Implement robust error handling encompassing rate limits and unexpected outputs.
- Stream responses where beneficial (e.g., real-time letter building) to maximize UX.
