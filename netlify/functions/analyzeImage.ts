import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60000;

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

const SYSTEM_INSTRUCTION = `You are a multilingual experience localization engine.

CRITICAL RULES:
- ALL section titles (subtitles / headings) MUST be in the selected language.
- DO NOT use English titles unless the selected language is English.
- Titles and content must be generated together.
- Mode-specific structure must be respected.
`;

const constructPrompt = (language: string) => {
  return `Input:
1. Selected language: ${language}
2. Selected mode: photo_analysis
3. Analyze the uploaded images.

Task:
Generate a COMPLETE localized response for photo analysis mode.

MODE STRUCTURE:
Return sections:
1. Image Description
2. Architectural Details
3. Materials & Texture
4. Visible Age & Wear
5. What This Reveals

Output format (JSON ONLY):
{
  "language": "language_name",
  "mode": "photo_analysis",
  "sections": [
    {
      "title": "localized section title",
      "content": "localized section content (string or array of strings)"
    }
  ]
}`;
};

const getMockAnalysis = (language: string) => ({
  analysisSections: [
    {
      title: "Image Description",
      content: "Analysis service temporarily unavailable. Please try again later."
    },
    {
      title: "Note",
      content: "We're experiencing high demand. Your image will be analyzed when the service is available."
    }
  ]
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

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
          fallback: true,
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { images, language = "English" } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing or invalid images array" }),
      };
    }

    // Limit number of images
    const sanitizedImages = images.slice(0, 5);
    const sanitizedLanguage = language.trim().substring(0, 50);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...getMockAnalysis(sanitizedLanguage),
          fallback: true,
        }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare image parts
    const imageParts = sanitizedImages.map((b64: string) => {
      const cleanB64 = b64.split(",")[1] || b64;
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanB64,
        },
      };
    });

    const promptText = constructPrompt(sanitizedLanguage);

    // Make request with timeout
    const timeout = 20000;
    const analysisPromise = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [...imageParts, { text: promptText }],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const response = await Promise.race([
      analysisPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Analysis timeout")), timeout)
      ),
    ]);

    if (!response.text) {
      throw new Error("No response from API");
    }

    const result = JSON.parse(response.text);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        analysisSections: result.sections,
      }),
    };
  } catch (error: any) {
    console.error("Error in analyzeImage:", error);
    
    const language = JSON.parse(event.body || "{}").language || "English";
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...getMockAnalysis(language),
        fallback: true,
        error: error.message,
      }),
    };
  }
};
