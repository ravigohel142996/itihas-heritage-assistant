# Itihas - Heritage Assistant (Production Ready)

Itihas is a production-ready AI-powered heritage assistant designed to provide users with deep insights into historical places, cultural significance, and visual experiences. Built with React, TypeScript, Vite, and powered by Google Gemini API via secure Netlify Functions.

**🏆 Hackathon Ready | 🔒 Secure Backend | 🚀 Optimized Performance**

---

## ✨ Key Features

### Core Features
- **🌍 Multilingual Support**: Explore heritage sites in 20+ languages including Hindi, Tamil, Telugu, Arabic, French, Spanish, Chinese, Japanese, and more.
- **🧠 AI-Powered Insights**: Powered by Google Gemini API with secure backend integration for accurate historical information.
- **🔍 Smart Search**: Text and voice search with debouncing and caching for optimal performance.
- **📸 Image Analysis**: Upload images of historical sites to analyze architectural details, materials, age, and wear.
- **🎨 3D Visualization**: Experience AI-generated visualizations with multiple fallback options (Unsplash, Wikimedia, placeholders).
- **❤️ Favorites System**: Save favorite places with local storage persistence.

### New Production Features
- **🔒 Secure Backend**: All API calls routed through Netlify Functions - no exposed API keys
- **⚡ Rate Limiting**: Built-in protection against API abuse (10 req/min for details, 5 req/min for images)
- **🔄 Auto-Retry**: Exponential backoff retry logic for failed requests
- **💾 Response Caching**: 1-2 hour cache duration for API responses
- **🖼️ Multi-Source Images**: Gemini → Unsplash → Wikimedia → Placeholder fallback chain
- **📱 Lazy Loading**: Optimized image loading with intersection observer
- **⏱️ Loading States**: Skeleton screens and progress indicators
- **🛡️ Input Validation**: Sanitization and validation of all user inputs

### Interactive Features
- **🗺️ Interactive Maps**: Explore heritage sites on maps powered by Leaflet and OpenStreetMap
- **🛤️ Heritage Routes**: Discover curated mini heritage routes across India
- **📱 PWA Support**: Install as a Progressive Web App on mobile and desktop devices
- **🔌 Offline Mode**: Browse previously cached content even without internet

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- A valid Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- (Optional) Unsplash API key for better image fallbacks

### 1. Clone the Repository
```bash
git clone https://github.com/ravigohel142996/itihas-heritage-assistant.git
cd itihas-heritage-assistant
```

### 2. Install Dependencies
```bash 
npm install
```

### 3. Set Up Environment Variables

**For Local Development:**
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_key_here  # Optional but recommended
```

**For Netlify Deployment:**
1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add the following variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `UNSPLASH_ACCESS_KEY`: Your Unsplash API key (optional)

### 4. Run the Application

**Development mode with Netlify Functions:**
```bash
npm run dev
```
This starts the app at `http://localhost:8888` with Netlify Functions running.

**Development mode (Vite only, without backend):**
```bash
npm run dev:vite
```
This starts just the frontend at `http://localhost:3000` (backend features won't work).

### 5. Build for Production
```bash
npm run build
```

### 6. Preview Production Build
```bash
npm run preview
```

---

## 📦 Deployment to Netlify

### Quick Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ravigohel142996/itihas-heritage-assistant)

### Manual Deploy

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

3. **Login to Netlify:**
   ```bash
   netlify login
   ```

4. **Initialize Netlify:**
   ```bash
   netlify init
   ```

5. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

6. **Configure Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add `GEMINI_API_KEY` and optionally `UNSPLASH_ACCESS_KEY`

### Netlify Configuration

The project includes a `netlify.toml` file with the following configuration:
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

---

## 🏗️ Architecture

### Backend (Netlify Functions)

Located in `netlify/functions/`:

1. **fetchPlaceDetails.ts**
   - Fetches comprehensive place information
   - Implements rate limiting (10 requests/minute)
   - Caches responses for 1 hour
   - Returns mock data on API failure

2. **generateImage.ts**
   - Generates or fetches heritage images
   - Fallback chain: Gemini → Unsplash → Wikimedia → Placeholder
   - Rate limiting (5 requests/minute)
   - Caches for 2 hours

3. **analyzeImage.ts**
   - Analyzes uploaded heritage images
   - Rate limiting (3 requests/minute)
   - Supports up to 5 images per request

### Frontend (React + TypeScript)

- **services/apiService.ts**: API client with retry logic and error handling
- **components/**: Reusable React components
- **hooks/**: Custom React hooks (debounce, localStorage)
- **types.ts**: TypeScript interfaces and types

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Netlify Functions (Serverless)
- **AI**: Google Gemini API (gemini-3-flash-preview, gemini-2.5-flash-image)
- **Images**: Unsplash API, Wikimedia Commons API
- **Maps**: Leaflet + React-Leaflet + OpenStreetMap
- **Styling**: Tailwind CSS (via CDN)
- **PWA**: Service Workers + Web App Manifest
- **Voice**: Web Speech API

---

## 📖 How to Use

### Search for Heritage Sites
1. Enter a heritage site name (e.g., "Taj Mahal", "Hampi", "Golden Temple") in the search bar
2. Use the microphone icon for voice search in your preferred language
3. View detailed information across multiple tabs:
   - **3D View**: AI-generated visualizations and spatial descriptions
   - **Deep Insights**: Historical significance, cultural meaning, and interesting facts
   - **Map**: Interactive location map with markers
   - **Photo Analysis**: Upload your own photos for AI analysis

### Explore Heritage Routes
1. Click the "Routes" button in the navigation bar
2. Browse curated heritage routes by region
3. Click on any route to see all included sites
4. Select a site from the route to explore its details

### Save Favorites
- Click the heart icon on any place to add it to your favorites
- Access your favorites anytime from the navigation bar

### Install as PWA
- On mobile: Tap the "Add to Home Screen" option in your browser
- On desktop: Look for the install icon in the address bar

---

## 🔧 API Endpoints

### POST `/.netlify/functions/fetchPlaceDetails`

Fetches detailed information about a heritage site.

**Request Body:**
```json
{
  "placeName": "Taj Mahal",
  "language": "English"
}
```

**Response:**
```json
{
  "placeName": "Taj Mahal",
  "location": "Agra, India",
  "timePeriod": "1632-1653",
  "whoBuiltIt": "Emperor Shah Jahan",
  "architecturalStyle": "Mughal",
  "detectedLanguage": "English",
  "insightSections": [...],
  "visualizationSections": [...],
  "visualizationDescription": "...",
  "visualExperience": {...}
}
```

### POST `/.netlify/functions/generateImage`

Generates or fetches an image for a heritage site.

**Request Body:**
```json
{
  "placeName": "Taj Mahal",
  "visualDescription": "Majestic white marble mausoleum..."
}
```

**Response:**
```json
{
  "imageUrl": "https://...",
  "source": "gemini|unsplash|wikimedia|placeholder"
}
```

### POST `/.netlify/functions/analyzeImage`

Analyzes uploaded images of heritage sites.

**Request Body:**
```json
{
  "images": ["base64_encoded_image_1", "base64_encoded_image_2"],
  "language": "English"
}
```

**Response:**
```json
{
  "analysisSections": [
    {
      "title": "Image Description",
      "content": "..."
    },
    ...
  ]
}
```

---

## 🔒 Security Features

- ✅ API keys never exposed in frontend bundle
- ✅ All API calls proxied through Netlify Functions
- ✅ Rate limiting on all endpoints
- ✅ Input validation and sanitization
- ✅ CORS headers configured
- ✅ Request timeout protection
- ✅ Error handling with fallback data

---

## ⚡ Performance Optimizations

- **Response Caching**: API responses cached for 1-2 hours
- **Image Lazy Loading**: Images loaded only when visible
- **Code Splitting**: Vite automatic code splitting
- **Debounced Search**: Prevents excessive API calls
- **Retry Logic**: Exponential backoff for failed requests
- **Fallback Data**: Mock data when API is unavailable
- **Optimized Bundle**: Production build ~440KB (gzipped ~133KB)

---

## 🐛 Troubleshooting

### Issue: "API Key is missing" error

**Solution:**
1. Check that `GEMINI_API_KEY` is set in your environment variables
2. For local development, ensure `.env` file exists with the key
3. For Netlify, verify the environment variable in Site Settings

### Issue: Rate limit exceeded (429 error)

**Solution:**
- Wait 1 minute before making more requests
- The app will automatically show fallback data
- Consider upgrading your API plan for higher limits

### Issue: Images not loading

**Solution:**
1. Check internet connection
2. Fallback images from Unsplash/Wikimedia should load automatically
3. If all fail, a placeholder will be shown
4. Check browser console for specific errors

### Issue: Netlify Functions not working locally

**Solution:**
```bash
# Make sure you're using the correct dev command
npm run dev  # NOT npm run dev:vite

# Or use Netlify CLI directly
netlify dev
```

### Issue: Voice search not working

**Solution:**
- Voice search requires HTTPS or localhost
- Only works in Chrome, Edge, and Safari
- Check microphone permissions in browser settings

---

## 📁 Project Structure

```
itihas-heritage-assistant/
├── netlify/
│   └── functions/              # Serverless backend functions
│       ├── fetchPlaceDetails.ts
│       ├── generateImage.ts
│       └── analyzeImage.ts
├── components/                 # React components
│   ├── Icons.tsx
│   ├── LanguageSelector.tsx
│   ├── Loader.tsx
│   ├── LazyImage.tsx          # Lazy loading image component
│   ├── Skeleton.tsx           # Loading skeleton components
│   ├── MapView.tsx
│   ├── PlaceDisplay.tsx
│   └── RoutePlanner.tsx
├── hooks/                      # Custom React hooks
│   └── useUtils.ts            # Debounce and localStorage hooks
├── services/                   # API services
│   ├── apiService.ts          # Main API client (calls backend)
│   └── geminiService.ts       # Legacy direct API calls (deprecated)
├── public/                     # Static assets
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── App.tsx                     # Main application component
├── index.html                  # HTML entry point
├── index.tsx                   # React entry point
├── translations.ts             # i18n translations (20+ languages)
├── types.ts                    # TypeScript definitions
├── vite.config.ts             # Vite configuration
├── netlify.toml               # Netlify deployment config
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available for educational purposes.

---

## 🙏 Acknowledgments

- **Google Gemini API** for AI capabilities
- **Unsplash** for high-quality heritage images
- **Wikimedia Commons** for historical photographs
- **Leaflet** and **OpenStreetMap** for interactive maps
- **Netlify** for serverless functions and hosting

---

## 📧 Contact & Support

For issues, questions, or contributions:
- Open an issue on [GitHub](https://github.com/ravigohel142996/itihas-heritage-assistant/issues)
- Star the project if you find it useful! ⭐

---

**Enjoy exploring the rich heritage of India with Itihas!** 🏛️✨
