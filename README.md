# Itihas - Heritage Assistant

Itihas is an AI-powered heritage assistant designed to provide users with deep insights into historical places, cultural significance, and visual experiences. This project uses OpenAI GPT-5 for intelligent historical information generation.

---

## Features

### Core Features
- **🌍 Multilingual Support**: Explore heritage sites in 20+ languages including Hindi, Tamil, Telugu, Arabic, French, Spanish, Chinese, Japanese, and more.
- **🧠 AI-Powered Q&A**: Powered by OpenAI GPT-5 for accurate historical information and intelligent responses.
- **🔍 Heritage Place Search**: Text and voice search for Indian heritage sites.
- **📸 Image Analysis**: Upload images of historical sites to analyze architectural details, materials, age, and wear.
- **🎨 3D Visualization**: Experience immersive AI-generated descriptions of heritage sites.
- **❤️ Favorites System**: Save your favorite places for quick access with local storage persistence.

### New Features (Latest Update)
- **🗺️ Interactive Maps**: Explore heritage sites on interactive maps powered by Leaflet and OpenStreetMap.
- **🛤️ Heritage Routes**: Discover curated mini heritage routes across India:
  - Golden Triangle (Delhi-Agra-Jaipur)
  - Rajasthan Royal Trail
  - South India Temple Circuit
  - Mumbai Heritage Walk
  - Buddhist Heritage Trail
  - Himalayan Heritage
  - Eastern India Heritage
- **📱 PWA Support**: Install as a Progressive Web App on mobile and desktop devices.
- **🔌 Offline Mode**: Browse previously visited content even without an internet connection.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A valid OpenAI API key (sign up at [OpenAI Platform](https://platform.openai.com))

---

## Getting Started

Follow these steps to set up and run the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/jiya2401/itihas-heritage-assistant.git
cd itihas-heritage-assistant
```

### 2. Install Dependencies
Install the required dependencies using npm:
```bash 
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** The API key is used only in the backend serverless function and is never exposed to the frontend.

### 4. Run the Application Locally
For local development with Netlify functions:
```bash
npm install -g netlify-cli
netlify dev
```

The app will be available at `http://localhost:8888` (Netlify dev server).

Alternatively, for frontend-only development (note: API calls will fail without the backend):
```bash
npm run dev
```

### 5. Build for Production
Build the optimized production version:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

---

## Deployment to Netlify

### Automatic Deployment
1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure environment variable:
   - Go to Site settings → Environment variables
   - Add `OPENAI_API_KEY` with your OpenAI API key
4. Deploy settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### Manual Deployment
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

**Note:** Always ensure `OPENAI_API_KEY` is set in Netlify's environment variables before deployment.

---

## How to Use

### Search for Heritage Sites
1. Enter a heritage site name (e.g., "Taj Mahal", "Hampi", "Golden Temple") in the search bar
2. Use the microphone icon for voice search
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

## Project Structure

```
.
├── components/          # Reusable React components
│   ├── Icons.tsx        # SVG icon components
│   ├── LanguageSelector.tsx  # Language selection dropdown
│   ├── Loader.tsx       # Loading animation
│   ├── MapView.tsx      # Interactive map component (Leaflet)
│   ├── PlaceDisplay.tsx # Place details with tabs
│   └── RoutePlanner.tsx # Heritage routes explorer
├── services/            # API service integrations
│   └── openaiService.ts # OpenAI API integration
├── netlify/             # Netlify serverless functions
│   └── functions/
│       └── openai-proxy.ts  # Backend proxy for OpenAI API
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker for offline support
├── App.tsx              # Main application file
├── index.html           # HTML entry point
├── index.tsx            # React entry point
├── translations.ts      # Multilingual translations (20+ languages)
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
├── netlify.toml         # Netlify deployment configuration
├── package.json         # Project dependencies and scripts
└── .env                 # Environment variables (create this)
```

---

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **AI**: OpenAI GPT-5 (Chat Completions API)
- **Backend**: Netlify Serverless Functions (Node.js)
- **Maps**: Leaflet + OpenStreetMap
- **Styling**: Tailwind CSS (via CDN)
- **PWA**: Service Workers + Web App Manifest
- **Voice**: Web Speech API
- **Hosting**: Netlify

---

## Architecture Highlights

### Modular Design
- Clean separation of concerns with dedicated components
- Service layer for API interactions
- Type-safe with TypeScript interfaces

### AI Integration
- OpenAI GPT-5 for text generation and historical insights
- Backend proxy ensures API key security
- Structured JSON outputs with validation
- Error handling for rate limits and invalid keys

### Performance
- Code splitting and lazy loading
- Efficient caching strategies
- Optimized bundle size

### Offline-First
- Service worker caches static assets
- Previously viewed content available offline
- Network-first for dynamic content

---

## Browser Compatibility

- Chrome/Edge (recommended for best experience)
- Firefox
- Safari
- Opera

Note: Voice search requires browser support for Web Speech API (Chrome/Edge recommended).

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is open source and available for educational purposes.

---


Enjoy exploring the rich heritage of India with Itihas!
