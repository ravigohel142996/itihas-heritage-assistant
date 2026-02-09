import { HistoricPlaceData, VisualAnalysisData, Language } from "../types";

// Determine API base URL (for local dev vs production)
const getApiBaseUrl = (): string => {
  // In development with Netlify Dev, functions are at /.netlify/functions
  // In production on Netlify, they're also at /.netlify/functions
  // For local development without Netlify Dev, you might need to adjust this
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions';
};

// Helper to make API calls with error handling
const apiCall = async <T>(endpoint: string, body: any, retries = 2): Promise<T> => {
  const apiUrl = `${getApiBaseUrl()}/${endpoint}`;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      lastError = error;
      console.error(`API call attempt ${attempt + 1} failed:`, error.message);
      
      // If it's a rate limit error, don't retry
      if (error.message.includes('Rate limit') || error.message.includes('429')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
};

export const fetchPlaceDetails = async (
  placeName: string,
  language: Language
): Promise<HistoricPlaceData> => {
  try {
    const data = await apiCall<HistoricPlaceData>('fetchPlaceDetails', {
      placeName,
      language,
    });
    
    return data;
  } catch (error: any) {
    console.error("Failed to fetch place details:", error);
    
    // Return a basic fallback structure so the app doesn't crash
    throw new Error(
      error.message.includes('Rate limit') 
        ? "Too many requests. Please try again in a moment."
        : "Unable to load heritage information. Please check your connection and try again."
    );
  }
};

export const generatePlaceImage = async (
  placeName: string,
  visualDescription: string
): Promise<string> => {
  try {
    const data = await apiCall<{ imageUrl: string; source?: string; fallback?: boolean }>(
      'generateImage',
      { placeName, visualDescription },
      1 // Only 1 retry for images
    );
    
    return data.imageUrl;
  } catch (error: any) {
    console.error("Failed to generate image:", error);
    
    // Return a placeholder image URL instead of throwing
    // This ensures the UI doesn't break even if image generation fails
    const encodedName = encodeURIComponent(placeName);
    return `https://via.placeholder.com/1200x675/2c2419/d4af37?text=${encodedName}`;
  }
};

export const analyzeSpatialDepth = async (
  imageB64s: string[],
  language: Language = Language.ENGLISH
): Promise<VisualAnalysisData> => {
  try {
    const data = await apiCall<VisualAnalysisData>('analyzeImage', {
      images: imageB64s,
      language,
    });
    
    return data;
  } catch (error: any) {
    console.error("Failed to analyze images:", error);
    throw new Error(
      error.message.includes('Rate limit')
        ? "Too many analysis requests. Please try again in a moment."
        : "Unable to analyze images. Please try again later."
    );
  }
};

export const translateSummary = async (summary: string): Promise<Record<string, string>> => {
  // This function is currently only used in the UI for the translate feature
  // For now, we'll keep it client-side or disable it
  // TODO: Move to backend if needed
  return {
    "English": summary,
    "Translation": "Translation feature temporarily unavailable in production mode."
  };
};
