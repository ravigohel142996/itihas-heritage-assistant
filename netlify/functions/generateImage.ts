import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60000;

// Cache
const cache = new Map<string, { data: string; timestamp: number }>();
const CACHE_DURATION = 7200000; // 2 hours

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

const getFromCache = (key: string): string | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key: string, data: string): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Fallback to Unsplash for heritage images
const fetchUnsplashImage = async (placeName: string): Promise<string | null> => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const query = encodeURIComponent(`${placeName} heritage monument architecture`);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (error) {
    console.error("Unsplash API error:", error);
  }
  return null;
};

// Fallback to Wikimedia Commons
const fetchWikimediaImage = async (placeName: string): Promise<string | null> => {
  try {
    const query = encodeURIComponent(placeName);
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${query}&prop=pageimages&format=json&pithumbsize=800&origin=*`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const pages = data.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0] as any;
      if (page?.thumbnail?.source) {
        return page.thumbnail.source;
      }
    }
  } catch (error) {
    console.error("Wikimedia API error:", error);
  }
  return null;
};

// Generic placeholder image
const getPlaceholderImage = (placeName: string): string => {
  // Return a data URI for a simple placeholder
  const text = encodeURIComponent(placeName);
  return `https://via.placeholder.com/1200x675/2c2419/d4af37?text=${text}`;
};

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
          error: "Rate limit exceeded",
          placeholder: true,
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { placeName, visualDescription } = body;

    if (!placeName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing placeName" }),
      };
    }

    const sanitizedPlaceName = placeName.trim().substring(0, 200);
    const sanitizedDescription = (visualDescription || "").trim().substring(0, 500);

    // Check cache
    const cacheKey = `image:${sanitizedPlaceName}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ imageUrl: cached, cached: true }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Try Gemini first if API key exists
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Cinematic 3D render of ${sanitizedPlaceName}. ${sanitizedDescription}. Photorealistic, 8k resolution, detailed architecture, dramatic lighting.`;

        const extractImage = (response: any): string | null => {
          for (const candidate of response.candidates || []) {
            for (const part of candidate.content?.parts || []) {
              if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
            }
          }
          return null;
        };

        // Try with timeout
        const timeout = 20000;
        const imagePromise = ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "16:9" } },
        });

        const response = await Promise.race([
          imagePromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Image generation timeout")), timeout)
          ),
        ]);

        const img = extractImage(response);
        if (img) {
          setCache(cacheKey, img);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ imageUrl: img, source: "gemini" }),
          };
        }
      } catch (error: any) {
        console.error("Gemini image generation failed:", error.message);
      }
    }

    // Fallback to Unsplash
    const unsplashImage = await fetchUnsplashImage(sanitizedPlaceName);
    if (unsplashImage) {
      setCache(cacheKey, unsplashImage);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ imageUrl: unsplashImage, source: "unsplash" }),
      };
    }

    // Fallback to Wikimedia
    const wikimediaImage = await fetchWikimediaImage(sanitizedPlaceName);
    if (wikimediaImage) {
      setCache(cacheKey, wikimediaImage);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ imageUrl: wikimediaImage, source: "wikimedia" }),
      };
    }

    // Final fallback to placeholder
    const placeholder = getPlaceholderImage(sanitizedPlaceName);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ imageUrl: placeholder, source: "placeholder", fallback: true }),
    };
  } catch (error: any) {
    console.error("Error in generateImage:", error);
    
    // Return placeholder on error
    const placeName = JSON.parse(event.body || "{}").placeName || "Heritage Site";
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        imageUrl: getPlaceholderImage(placeName),
        source: "placeholder",
        fallback: true,
        error: error.message,
      }),
    };
  }
};
