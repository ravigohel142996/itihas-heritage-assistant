import { HistoricPlaceData, VisualAnalysisData, Language, LocalizedResponse, PlaceMetadata, VisualExperience } from "../types";

const SYSTEM_INSTRUCTION = `You are a multilingual experience localization engine.

CRITICAL RULES:
- ALL section titles (subtitles / headings) MUST be in the selected language.
- DO NOT use English titles unless the selected language is English.
- DO NOT reuse or translate fixed English headings.
- DO NOT output any English text when the selected language is not English.
- Titles and content must be generated together.
- Mode-specific structure must be respected.
`;

// Helper to call the OpenAI proxy endpoint
const callOpenAI = async (messages: Array<{ role: string; content: string }>, responseFormat?: { type: string }) => {
  const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8888/.netlify/functions/openai-proxy'
    : '/.netlify/functions/openai-proxy';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages,
      response_format: responseFormat,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded: ${errorData.details || 'Please try again later'}`);
    } else if (response.status === 401) {
      throw new Error(`Invalid API key: ${errorData.details || 'Authentication failed'}`);
    } else {
      throw new Error(`OpenAI API error: ${errorData.details || 'Unknown error'}`);
    }
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

// Helper to construct the user prompt based on mode
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

If mode = "photo_analysis":
Return sections:
1. Image Description
2. Architectural Details
3. Materials & Texture
4. Visible Age & Wear
5. What This Reveals

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

export const fetchPlaceDetails = async (
  placeName: string,
  language: Language
): Promise<HistoricPlaceData> => {
  // 1. Fetch Metadata (Structure is rigid, content localized)
  const metadataPrompt = `Input: "${placeName}"
Language: "${language}"

Task: Extract basic metadata in the selected language.
Rules: 
- Translate values to ${language}.
- "placeName" should be in ${language}.
- "architecturalStyle" should be in ${language}.

Output JSON:
{
  "placeName": "...",
  "location": "...",
  "timePeriod": "...",
  "whoBuiltIt": "...",
  "architecturalStyle": "..."
}`;

  // 2. Fetch Deep Insights (Mode: deep_insight)
  const insightsPrompt = constructPrompt(placeName, language, "deep_insight");

  // 3. Fetch Visualization Context (Mode: 3d_visualization)
  const vizPrompt = constructPrompt(placeName, language, "3d_visualization");

  // 4. Fetch Visual Experience Config
  const visualExpPrompt = constructVisualExperiencePrompt(placeName, language);

  try {
    const [metaText, insightText, vizText, visualExpText] = await Promise.all([
      callOpenAI(
        [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: metadataPrompt }
        ],
        { type: 'json_object' }
      ),
      callOpenAI(
        [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: insightsPrompt }
        ],
        { type: 'json_object' }
      ),
      callOpenAI(
        [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: vizPrompt }
        ],
        { type: 'json_object' }
      ),
      callOpenAI(
        [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: visualExpPrompt }
        ],
        { type: 'json_object' }
      )
    ]);

    if (!metaText || !insightText || !vizText || !visualExpText) {
      throw new Error("Incomplete data from OpenAI");
    }

    const metadata = JSON.parse(metaText) as PlaceMetadata;
    const insightsData = JSON.parse(insightText) as LocalizedResponse;
    const vizData = JSON.parse(vizText) as LocalizedResponse;
    const visualExperience = JSON.parse(visualExpText) as VisualExperience;

    // Extract the description for image generation
    const vizDescSection = vizData.sections.find(s => 
      s.title.toLowerCase().includes('3d') || 
      s.title.toLowerCase().includes('visualization')
    ) || vizData.sections[0];
    const visualizationDescription = Array.isArray(vizDescSection.content) 
      ? vizDescSection.content.join(' ') 
      : vizDescSection.content;

    return {
      ...metadata,
      detectedLanguage: insightsData.language,
      insightSections: insightsData.sections,
      visualizationSections: vizData.sections,
      visualizationDescription,
      visualExperience
    };

  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch localized content.");
  }
};

export const generatePlaceImage = async (
  placeName: string,
  visualDescription: string
): Promise<string> => {
  // Note: OpenAI's DALL-E requires a separate API call
  // For now, we'll generate a descriptive placeholder
  // In production, you would call DALL-E 3 API or use a different image generation service
  
  const prompt = `Create a detailed description for generating an image: Cinematic 3D render of ${placeName}. ${visualDescription}. Photorealistic, 8k resolution, detailed architecture, dramatic lighting.`;
  
  try {
    // For demonstration, we return a placeholder
    // In production, you would implement DALL-E 3 API call here
    console.warn("Image generation not implemented - DALL-E integration required");
    
    // Return a data URL for a placeholder or implement DALL-E call
    // For now, throwing error to maintain compatibility
    throw new Error("Image generation requires DALL-E integration");
    
  } catch (err) {
    console.error("Image generation failed:", err);
    throw new Error("Image generation not available.");
  }
};

export const analyzeSpatialDepth = async (
  imageB64s: string[], 
  language: Language = Language.ENGLISH
): Promise<VisualAnalysisData> => {
  
  // OpenAI vision API can analyze images
  // For GPT-5, we would use the vision capabilities
  const promptText = constructPrompt("User Uploaded Image", language, "photo_analysis", "Analyze the uploaded images.");
  
  try {
    // Note: OpenAI vision API requires base64 images in a specific format
    // For now, we'll create a text-based prompt
    // In production, you would include the images in the API call
    
    const messages = [
      { 
        role: 'system', 
        content: SYSTEM_INSTRUCTION 
      },
      { 
        role: 'user', 
        content: `${promptText}\n\nNote: Image analysis capabilities need to be implemented with OpenAI Vision API.` 
      }
    ];
    
    const resultText = await callOpenAI(messages, { type: 'json_object' });
    
    if (!resultText) throw new Error("Analysis failed");
    const result = JSON.parse(resultText) as LocalizedResponse;

    return {
      analysisSections: result.sections
    };
  } catch (error) {
    console.error("Image analysis error:", error);
    throw new Error(error instanceof Error ? error.message : "Image analysis failed.");
  }
};

export const translateSummary = async (summary: string): Promise<Record<string, string>> => {
  const prompt = `Translate this text into these languages: English, Hindi, Bengali, Tamil, Telugu, Marathi, Urdu, Arabic, French, Spanish, Portuguese, German, Russian, Chinese (Simplified), Japanese, Korean.
  
  Text: "${summary}"
  
  Output JSON format: { "LanguageName": "Translated Text" }`;

  try {
    const resultText = await callOpenAI(
      [
        { role: 'system', content: 'You are a professional translator.' },
        { role: 'user', content: prompt }
      ],
      { type: 'json_object' }
    );

    if (!resultText) throw new Error("Translation failed");
    return JSON.parse(resultText) as Record<string, string>;
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error(error instanceof Error ? error.message : "Translation failed.");
  }
};
