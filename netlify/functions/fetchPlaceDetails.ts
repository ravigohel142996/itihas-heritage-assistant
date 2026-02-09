import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

// Rate limiting configuration
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60000; // 1 minute in ms

// Cache configuration
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour in ms

// Helper to check rate limit
const checkRateLimit = (clientId: string): boolean => {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
};

// Helper to get from cache
const getFromCache = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

// Helper to set cache
const setCache = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Mock fallback data
const getMockData = (placeName: string, language: string) => ({
  placeName: placeName,
  location: "India",
  timePeriod: "Historical",
  whoBuiltIt: "Unknown",
  architecturalStyle: "Traditional",
  detectedLanguage: language,
  insightSections: [
    {
      title: "Overview",
      content: `${placeName} is a significant heritage site with rich historical importance. Due to high API demand, we're showing limited information. Please try again later for detailed insights.`
    },
    {
      title: "Historical Significance",
      content: "This site represents an important part of cultural heritage."
    }
  ],
  visualizationSections: [
    {
      title: "3D Visualization",
      content: "A magnificent structure showcasing traditional architecture."
    }
  ],
  visualizationDescription: `Architectural visualization of ${placeName}`,
  visualExperience: {
    title_animation: "fade-in",
    background_visual: "traditional",
    transition_style: "smooth",
    highlight_effect: "subtle",
    reading_rhythm: "medium"
  }
});

const SYSTEM_INSTRUCTION = `You are a multilingual experience localization engine.

CRITICAL RULES:
- ALL section titles (subtitles / headings) MUST be in the selected language.
- DO NOT use English titles unless the selected language is English.
- DO NOT reuse or translate fixed English headings.
- DO NOT output any English text when the selected language is not English.
- Titles and content must be generated together.
- Mode-specific structure must be respected.
`;

const constructPrompt = (placeName: string, language: string, mode: string, extraContext: string = "") => {
  return `Input:
1. Selected language: ${language}
2. Selected mode: ${mode}
3. Canonical factual information about a historical site (already known and verified): ${placeName} ${extraContext}

Task:
Generate a COMPLETE localized response for the selected mode.

MODE STRUCTURES (MANDATORY):

If mode = "deep_insight":
Return sections:
1. Overview
2. Global Context
3. Historical Significance
4. Cultural Meaning
5. Did You Know? (Provide a list of 3 items)

If mode = "3d_visualization":
Return sections:
1. 3D Visualization Description (Detailed visual description for reconstruction)
2. Depth & Spatial Layers
3. Camera Movement Guidance
4. Key Structures to Notice
5. Immersive Context

Output format (JSON ONLY):
{
  "language": "language_name",
  "mode": "mode_name",
  "sections": [
    {
      "title": "localized section title",
      "content": "localized section content (string or array of strings)"
    }
  ]
}`;
};

const constructVisualExperiencePrompt = (placeName: string, language: string) => {
  return `You are a visual experience director for a historical knowledge system.

Input:
- Historical site: ${placeName}
- Selected language: ${language}

Task:
Design a visually immersive "Deep Insight" experience.

Rules:
- Do NOT describe text content.
- Describe ONLY visual behavior.
- Adapt visuals to the cultural reading style of the selected language.

Generate:
1. Section title animation style
2. Background visual texture
3. Transition behavior between sections
4. Highlight effects for key ideas
5. Reading rhythm (slow / medium / guided)

Output format (JSON ONLY):
{
  "title_animation": "string",
  "background_visual": "string",
  "transition_style": "string",
  "highlight_effect": "string",
  "reading_rhythm": "string"
}`;
};

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Rate limiting
    const clientId = event.headers["client-ip"] || event.headers["x-forwarded-for"] || "unknown";
    if (!checkRateLimit(clientId)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          useMock: true,
        }),
      };
    }

    // Parse and validate request
    const body = JSON.parse(event.body || "{}");
    const { placeName, language } = body;

    if (!placeName || !language) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: placeName, language" }),
      };
    }

    // Sanitize inputs
    const sanitizedPlaceName = placeName.trim().substring(0, 200);
    const sanitizedLanguage = language.trim().substring(0, 50);

    // Check cache
    const cacheKey = `place:${sanitizedPlaceName}:${sanitizedLanguage}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ...cached, cached: true }),
      };
    }

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...getMockData(sanitizedPlaceName, sanitizedLanguage),
          fallback: true,
        }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare prompts
    const metadataPrompt = `Input: "${sanitizedPlaceName}"
Language: "${sanitizedLanguage}"

Task: Extract basic metadata in the selected language.
Rules: 
- Translate values to ${sanitizedLanguage}.
- "placeName" should be in ${sanitizedLanguage}.
- "architecturalStyle" should be in ${sanitizedLanguage}.

Output JSON:
{
  "placeName": "...",
  "location": "...",
  "timePeriod": "...",
  "whoBuiltIt": "...",
  "architecturalStyle": "..."
}`;

    const insightsPrompt = constructPrompt(sanitizedPlaceName, sanitizedLanguage, "deep_insight");
    const vizPrompt = constructPrompt(sanitizedPlaceName, sanitizedLanguage, "3d_visualization");
    const visualExpPrompt = constructVisualExperiencePrompt(sanitizedPlaceName, sanitizedLanguage);

    // Make API calls with timeout and retry
    const timeout = 15000; // 15 seconds
    const makeRequestWithTimeout = async (promise: Promise<any>) => {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeout)
        ),
      ]);
    };

    let attempts = 0;
    const maxAttempts = 2;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        const [metaRes, insightRes, vizRes, visualExpRes] = await Promise.all([
          makeRequestWithTimeout(
            ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: metadataPrompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    placeName: { type: Type.STRING },
                    location: { type: Type.STRING },
                    timePeriod: { type: Type.STRING },
                    whoBuiltIt: { type: Type.STRING },
                    architecturalStyle: { type: Type.STRING },
                  },
                },
              },
            })
          ),
          makeRequestWithTimeout(
            ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: insightsPrompt,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
              },
            })
          ),
          makeRequestWithTimeout(
            ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: vizPrompt,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
              },
            })
          ),
          makeRequestWithTimeout(
            ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: visualExpPrompt,
              config: { responseMimeType: "application/json" },
            })
          ),
        ]);

        if (!metaRes.text || !insightRes.text || !vizRes.text || !visualExpRes.text) {
          throw new Error("Incomplete response from API");
        }

        const metadata = JSON.parse(metaRes.text);
        const insightsData = JSON.parse(insightRes.text);
        const vizData = JSON.parse(vizRes.text);
        const visualExperience = JSON.parse(visualExpRes.text);

        const vizDescSection =
          vizData.sections.find(
            (s: any) =>
              s.title.toLowerCase().includes("3d") ||
              s.title.toLowerCase().includes("visualization")
          ) || vizData.sections[0];
        const visualizationDescription = Array.isArray(vizDescSection.content)
          ? vizDescSection.content.join(" ")
          : vizDescSection.content;

        const result = {
          ...metadata,
          detectedLanguage: insightsData.language,
          insightSections: insightsData.sections,
          visualizationSections: vizData.sections,
          visualizationDescription,
          visualExperience,
        };

        // Cache the result
        setCache(cacheKey, result);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } catch (error: any) {
        lastError = error;
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error.message);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
        }
      }
    }

    // If all attempts failed, return mock data
    console.error("All attempts failed, returning mock data:", lastError);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...getMockData(sanitizedPlaceName, sanitizedLanguage),
        fallback: true,
        error: lastError?.message || "API unavailable",
      }),
    };
  } catch (error: any) {
    console.error("Error in fetchPlaceDetails:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
