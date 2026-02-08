import { Language } from './types';

export const TRANSLATIONS: Record<Language, any> = {
  [Language.ENGLISH]: {
    app: {
      title: "Visualize the Past",
      subtitle: "Explore Indian historic places through real photographs, 3D depth motion, and structured historical insights",
      searchPlaceholder: "Enter a historic place (e.g., Taj Mahal, Hampi)...",
      searchAnother: "Search another place...",
      explore: "Explore",
      footer: "Itihas 3D Assistant. Powered by Google Gemini.",
      consulting: "Consulting the Archives...",
      voiceSearch: "Search by Voice",
      tryAgain: "Try Again",
      examples: ["Taj Mahal", "Ajanta Caves", "Konark Sun Temple"],
      go: "GO",
      favorites: "Favorites",
      noFavorites: "No favorite places saved yet.",
      listening: "Listening in",
      speakNow: "Speak now...",
      processing: "Processing...",
      stop: "Stop / Done",
      close: "Close"
    },
    ui: {
        view3d: "3D View", insights: "Deep Insights", analysis: "Photo Analysis",
        save: "SAVE", saved: "SAVED", share: "SHARE", copied: "COPIED", builtBy: "Built by",
        uploadTitle: "Upload Real Photographs", uploadDesc: "Drag & drop or click to upload photos", runAnalysis: "Run Analysis",
        analyzing: "Analyzing...", clear: "Clear", translate: "Translate", translating: "Translating...",
        vizUnavailable: "Visualization Unavailable", conceptRender: "AI Concept Render",
        architecture: "Architectural Style", // Kept as it is from Metadata
        vizDesc: "Visualizing...",
        heritageRoutes: "Heritage Routes",
        routesDesc: "Curated mini heritage routes across India",
        routesHelp: "Click on any route to see all heritage sites included",
        routesHelp2: "Click on a site name to explore its details",
        mapView: "Map View",
        routes: "Routes"
    },
  },
  [Language.HINDI]: {
    app: {
      title: "अतीत की झलक",
      subtitle: "वास्तविक तस्वीरों और 3D में भारतीय इतिहास को देखें और समझें",
      searchPlaceholder: "एक ऐतिहासिक स्थान दर्ज करें (जैसे, ताज महल)...",
      searchAnother: "दुसरी जगह खोजें...",
      explore: "खोजें",
      footer: "इतिहास 3D सहायक। Google Gemini द्वारा संचालित।",
      consulting: "अभिलेखागार खंगाल रहा हूँ...",
      voiceSearch: "आवाज़ से खोजें",
      tryAgain: "पुनः प्रयास करें",
      examples: ["ताज महल", "अजंता गुफाएं", "कोणार्क सूर्य मंदिर"],
      go: "जाएं",
      favorites: "पसंदीदा",
      noFavorites: "अभी तक कोई पसंदीदा स्थान सहेजा नहीं गया है।",
      listening: "सुन रहा हूँ",
      speakNow: "अब बोलें...",
      processing: "प्रक्रिया जारी है...",
      stop: "रुकें / हो गया",
      close: "बंद करें"
    },
    ui: {
        view3d: "3D दृश्य", insights: "गहरी अंतर्दृष्टि", analysis: "फोटो विश्लेषण",
        save: "सहेजें", saved: "सहेजा गया", share: "साझा करें", copied: "कॉपी किया गया", builtBy: "निर्माणकर्ता",
        uploadTitle: "वास्तविक तस्वीरें अपलोड करें", uploadDesc: "फोटो अपलोड करने के लिए क्लिक करें", runAnalysis: "विश्लेषण चलाएं",
        analyzing: "विश्लेषण हो रहा है...", clear: "साफ़ करें", translate: "अनुवाद करें", translating: "अनुवाद हो रहा है...",
        vizUnavailable: "विज़ुअलाइज़ेशन अनुपलब्ध", conceptRender: "AI अवधारणा रेंडर",
        architecture: "वास्तु शैली",
        vizDesc: "दृश्य बनाना..."
    }
  },
  // Defaulting others to English structure but mapped correctly to avoid crash
  // In a real production app, all these would be filled.
  // For the purpose of this demo, I will map the remaining languages to English content 
  // but logically allow them to be extended.
  [Language.BENGALI]: { app: {}, ui: {} },
  [Language.TAMIL]: { app: {}, ui: {} },
  [Language.TELUGU]: { app: {}, ui: {} },
  [Language.MARATHI]: { app: {}, ui: {} },
  [Language.URDU]: { app: {}, ui: {} },
  [Language.GUJARATI]: { app: {}, ui: {} },
  [Language.ARABIC]: { app: {}, ui: {} },
  [Language.FRENCH]: { app: {}, ui: {} },
  [Language.SPANISH]: { app: {}, ui: {} },
  [Language.PORTUGUESE]: { app: {}, ui: {} },
  [Language.GERMAN]: { app: {}, ui: {} },
  [Language.RUSSIAN]: { app: {}, ui: {} },
  [Language.CHINESE_SIMPLIFIED]: { app: {}, ui: {} },
  [Language.CHINESE_TRADITIONAL]: { app: {}, ui: {} },
  [Language.JAPANESE]: { app: {}, ui: {} },
  [Language.KOREAN]: { app: {}, ui: {} },
  [Language.INDONESIAN]: { app: {}, ui: {} },
  [Language.TURKISH]: { app: {}, ui: {} },
};

// Helper to fill missing translations with English
Object.keys(TRANSLATIONS).forEach(lang => {
    const l = lang as Language;
    if (Object.keys(TRANSLATIONS[l].app || {}).length === 0) {
        TRANSLATIONS[l] = TRANSLATIONS[Language.ENGLISH];
    }
});
