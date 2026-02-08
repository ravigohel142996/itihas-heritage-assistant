import { GoogleGenAI, Type } from "@google/genai";
import { HistoricPlaceData, VisualAnalysisData, Language, LocalizedResponse, Section, PlaceMetadata, VisualExperience } from "../types";

const SYSTEM_INSTRUCTION = `You are a multilingual experience localization engine.

CRITICAL RULES:
- ALL section titles (subtitles / headings) MUST be in the selected language.
- DO NOT use English titles unless the selected language is English.
- DO NOT reuse or translate fixed English headings.
- DO NOT output any English text when the selected language is not English.
- Titles and content must be generated together.
- Mode-specific structure must be respected.
`;

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
Design a visually immersive “Deep Insight” experience.

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
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  // 1. Fetch Metadata (Structure is rigid, content localized)
  // We need basic metadata to populate the header (Location, Time Period, etc.)
  // We use a separate prompt for this to ensure strict type matching for the header fields.
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
      const [metaRes, insightRes, vizRes, visualExpRes] = await Promise.all([
        ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: metadataPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        placeName: { type: Type.STRING },
                        location: { type: Type.STRING },
                        timePeriod: { type: Type.STRING },
                        whoBuiltIt: { type: Type.STRING },
                        architecturalStyle: { type: Type.STRING },
                    }
                }
            }
        }),
        ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: insightsPrompt,
            config: { 
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json' 
            }
        }),
        ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: vizPrompt,
            config: { 
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json' 
            }
        }),
        ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: visualExpPrompt,
            config: { responseMimeType: 'application/json' }
        })
      ]);

      if (!metaRes.text || !insightRes.text || !vizRes.text || !visualExpRes.text) {
          throw new Error("Incomplete data from Gemini");
      }

      const metadata = JSON.parse(metaRes.text) as PlaceMetadata;
      const insightsData = JSON.parse(insightRes.text) as LocalizedResponse;
      const vizData = JSON.parse(vizRes.text) as LocalizedResponse;
      const visualExperience = JSON.parse(visualExpRes.text) as VisualExperience;

      // Extract the description for image generation (fallback to English if needed/possible, 
      // but usually the localized description works or we can translate it. 
      // For now, we take the content of the first section of 3d_visualization).
      const vizDescSection = vizData.sections.find(s => s.title.toLowerCase().includes('3d') || s.title.toLowerCase().includes('visualization')) || vizData.sections[0];
      const visualizationDescription = Array.isArray(vizDescSection.content) ? vizDescSection.content.join(' ') : vizDescSection.content;

      return {
          ...metadata,
          detectedLanguage: insightsData.language,
          insightSections: insightsData.sections,
          visualizationSections: vizData.sections,
          visualizationDescription,
          visualExperience
      };

  } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to fetch localized content.");
  }
};

export const generatePlaceImage = async (
  placeName: string,
  visualDescription: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  // Use a fallback generic prompt if the visual description is in a non-Latin script that might confuse the image model,
  // though Gemini Image models are multilingual. To be safe, we prepend the place name.
  const simplePrompt = `Cinematic 3D render of ${placeName}. ${visualDescription}. Photorealistic, 8k resolution, detailed architecture, dramatic lighting.`;

  const extractImage = (response: any) => {
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: simplePrompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    const img = extractImage(response);
    if (img) return img;
  } catch (err) {
    console.warn("Gemini Flash Image failed:", err);
  }

  // Fallback
  try {
    console.log("Attempting Gemini 3 Pro Image fallback...");
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: simplePrompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
    });

    const img = extractImage(response);
    if (img) return img;
  } catch (err) {
      console.error("Gemini 3 Pro Image fallback failed:", err);
  }

  throw new Error("No image generated.");
};

export const analyzeSpatialDepth = async (imageB64s: string[], language: Language = Language.ENGLISH): Promise<VisualAnalysisData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const imageParts = imageB64s.map(b64 => {
    const cleanB64 = b64.split(',')[1] || b64;
    return {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanB64
      }
    };
  });

  // Use the photo_analysis mode
  const promptText = constructPrompt("User Uploaded Image", language, "photo_analysis", "Analyze the uploaded images.");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        ...imageParts,
        { text: promptText }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json'
    }
  });

  if (!response.text) throw new Error("Analysis failed");
  const result = JSON.parse(response.text) as LocalizedResponse;

  return {
      analysisSections: result.sections
  };
};

export const translateSummary = async (summary: string): Promise<Record<string, string>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Translate this text into these languages: English, Hindi, Bengali, Tamil, Telugu, Marathi, Urdu, Arabic, French, Spanish, Portuguese, German, Russian, Chinese (Simplified), Japanese, Korean.
  
  Text: "${summary}"
  
  Output JSON format: { "LanguageName": "Translated Text" }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  if (!response.text) throw new Error("Translation failed");
  return JSON.parse(response.text) as Record<string, string>;
};
