import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fetchPlaceDetails, generatePlaceImage, analyzeSpatialDepth } from './services/openaiService';
import { Language, SearchState, LANGUAGE_CODES } from './types';
import { TRANSLATIONS } from './translations';
import LanguageSelector from './components/LanguageSelector';
import PlaceDisplay from './components/PlaceDisplay';
import RoutePlanner from './components/RoutePlanner';
import Loader from './components/Loader';
import { SearchIcon, MicIcon, HeartIcon, XIcon, CheckIcon, RouteIcon } from './components/Icons';

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    query: '',
    language: Language.ENGLISH,
    loading: false,
    error: null,
    data: null,
    imageUrl: null,
    analysisImages: [],
    analysisResult: null,
    analyzing: false
  });

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'processing' | 'error' | 'idle'>('idle');
  const [voiceMessage, setVoiceMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('itihas_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showRoutesView, setShowRoutesView] = useState(false);

  // Translations
  const t = TRANSLATIONS[state.language]?.app || TRANSLATIONS[Language.ENGLISH].app;

  // Toggle Favorite logic
  const toggleFavorite = (placeName: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(placeName)
        ? prev.filter(p => p !== placeName)
        : [...prev, placeName];
      localStorage.setItem('itihas_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isCurrentPlaceFavorite = state.data ? favorites.includes(state.data.placeName) : false;

  // Analysis Handlers
  const handleUploadImages = (files: FileList) => {
    if (!files.length) return;
    
    // Convert to base64
    const promises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then(images => {
        setState(prev => ({ ...prev, analysisImages: images, analysisResult: null }));
    });
  };

  const handleAnalyze = async () => {
    if (state.analysisImages.length === 0) return;
    
    setState(prev => ({ ...prev, analyzing: true }));
    try {
        const result = await analyzeSpatialDepth(state.analysisImages, state.language);
        setState(prev => ({ ...prev, analysisResult: result, analyzing: false }));
    } catch (e) {
        console.error("Analysis failed", e);
        setState(prev => ({ ...prev, analyzing: false, error: "Image Analysis failed." }));
    }
  };

  const handleClearAnalysis = () => {
      setState(prev => ({ ...prev, analysisImages: [], analysisResult: null, analyzing: false }));
  };


  // Consolidated search logic
  const performSearch = useCallback(async (query: string, lang: Language) => {
    if (!query.trim()) return;

    try {
      const newUrl = `${window.location.pathname}?place=${encodeURIComponent(query)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (e) {
      console.warn("Unable to update URL history:", e);
    }

    setShowFavoritesModal(false);

    // Reset all state including analysis
    setState(prev => ({ 
        ...prev, query, loading: true, error: null, data: null, imageUrl: null,
        analysisImages: [], analysisResult: null, analyzing: false
    }));

    try {
      // 1. Fetch Text Data
      const data = await fetchPlaceDetails(query, lang);
      
      setState(prev => ({ ...prev, data }));

      // 2. Generate Image
      try {
        const imageUrl = await generatePlaceImage(data.placeName, data.visualizationDescription);
        setState(prev => ({ ...prev, imageUrl, loading: false }));
      } catch (imgError) {
        console.error("Image generation failed", imgError);
        setState(prev => ({ ...prev, loading: false })); 
      }

    } catch (err) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Failed to fetch historical archives. Please check your connection or try again." 
      }));
    }
  }, []);

  // Handle URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const place = params.get('place');
    if (place) {
      performSearch(place, Language.ENGLISH);
    }
  }, [performSearch]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(state.query, state.language);
  };

  const handleLanguageChange = (lang: Language) => {
    setState(prev => ({ ...prev, language: lang }));
  };

  const startListening = useCallback(async () => {
    // 1. Browser Support Check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please try Chrome or Edge.");
      return;
    }

    // 2. Reset State & Show Modal
    setInterimTranscript('');
    setVoiceMessage('');
    setVoiceStatus('listening');
    setShowVoiceModal(true);
    setIsListening(true);

    // 3. Permission Priming
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Microphone access denied:", err);
      setVoiceStatus('error');
      setVoiceMessage("Microphone blocked. Please check permissions.");
      return;
    }

    // 4. Initialize Recognition
    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGE_CODES[state.language] || 'en-US';
    recognition.interimResults = true; // IMPORTANT: Enable live preview
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        // Final result received
        setState(prev => ({ ...prev, query: final }));
        setVoiceStatus('processing');
        recognition.stop();
        setTimeout(() => {
          setShowVoiceModal(false);
          setIsListening(false);
          // Optional: Auto-submit here if desired
          // performSearch(final, state.language); 
        }, 600);
      } else {
        // Update live preview
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Handle silence gracefully
        setVoiceStatus('error');
        setVoiceMessage("Didn't hear anything...");
        // Close after brief delay so user sees the message
        setTimeout(() => {
            setShowVoiceModal(false);
            setIsListening(false);
        }, 1500);
      } else if (event.error === 'not-allowed') {
        setVoiceStatus('error');
        setVoiceMessage("Microphone access blocked.");
        setIsListening(false);
      } else {
        console.warn("Voice error:", event.error);
        setVoiceStatus('error');
        setVoiceMessage("Voice input error. Try again.");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // If we are still "listening" according to state but the API stopped (e.g. silence without error),
      // we generally want to reset unless we just processed a result.
      if (voiceStatus === 'listening') {
          setIsListening(false);
          setShowVoiceModal(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
      setVoiceStatus('error');
      setVoiceMessage("Could not start.");
    }
  }, [state.language, voiceStatus]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // The onend or onresult event will handle state cleanup
      setVoiceStatus('processing');
    }
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 selection:bg-heritage-gold selection:text-black flex flex-col relative overflow-x-hidden">
      
      {/* Voice Input Modal Overlay */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md animate-fade-in transition-all">
           
           <div className="flex flex-col items-center space-y-8 max-w-lg w-full text-center">
              
              {/* Status Icon */}
              <div className={`relative p-8 rounded-full border-4 transition-all duration-500 ${
                  voiceStatus === 'listening' ? 'border-heritage-gold/50 bg-heritage-gold/10 animate-pulse' : 
                  voiceStatus === 'error' ? 'border-red-500/50 bg-red-500/10' :
                  'border-green-500/50 bg-green-500/10'
              }`}>
                  <MicIcon className={`w-16 h-16 ${
                      voiceStatus === 'listening' ? 'text-heritage-gold' : 
                      voiceStatus === 'error' ? 'text-red-500' : 
                      'text-green-500'
                  }`} />
                  
                  {voiceStatus === 'listening' && (
                     <div className="absolute inset-0 rounded-full border-2 border-heritage-gold animate-ping opacity-50"></div>
                  )}
              </div>

              {/* Status Text & Transcript */}
              <div className="space-y-4 min-h-[120px] flex flex-col justify-center">
                  {voiceStatus === 'listening' && (
                      <>
                        <p className="text-stone-400 uppercase tracking-widest text-sm font-serif">
                            {t.listening} <span className="text-heritage-gold font-bold">{state.language}</span>
                        </p>
                        <p className="text-2xl md:text-4xl font-serif text-white break-words">
                            {interimTranscript || <span className="opacity-30">{t.speakNow}</span>}
                        </p>
                      </>
                  )}

                  {voiceStatus === 'processing' && (
                      <p className="text-2xl font-serif text-heritage-gold animate-bounce">
                          {t.processing}
                      </p>
                  )}

                  {voiceStatus === 'error' && (
                      <p className="text-xl font-serif text-red-400">
                          {voiceMessage || "Error occurred"}
                      </p>
                  )}
              </div>

              {/* Manual Control */}
              <button 
                onClick={stopListening}
                className="mt-8 px-8 py-3 rounded-full border border-stone-700 bg-stone-900 hover:bg-stone-800 hover:border-heritage-gold/50 transition-colors text-stone-300 font-serif tracking-wider flex items-center gap-2"
              >
                {voiceStatus === 'listening' ? (
                    <>
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        {t.stop}
                    </>
                ) : (
                    <>
                        <XIcon className="w-4 h-4" />
                        {t.close}
                    </>
                )}
              </button>
           </div>
        </div>
      )}

      {/* Favorites Modal Overlay */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowFavoritesModal(false)}
                className="absolute top-4 right-4 text-stone-500 hover:text-white"
              >
                <XIcon className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-serif text-heritage-gold mb-6 flex items-center gap-2">
                 <HeartIcon filled className="w-6 h-6" /> {t.favorites}
              </h2>
              
              {favorites.length === 0 ? (
                <p className="text-stone-500 text-center py-8">{t.noFavorites}</p>
              ) : (
                <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                  {favorites.map((place, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-stone-950/50 p-3 rounded-lg border border-stone-800 hover:border-heritage-gold/50 transition-colors group">
                       <button 
                         onClick={() => performSearch(place, state.language)}
                         className="text-stone-300 font-sans group-hover:text-heritage-gold text-left flex-grow truncate"
                       >
                         {place}
                       </button>
                       <button
                         onClick={() => toggleFavorite(place)}
                         className="text-stone-600 hover:text-red-500 ml-4 p-1"
                         title="Remove from favorites"
                       >
                         <XIcon className="w-4 h-4" />
                       </button>
                    </li>
                  ))}
                </ul>
              )}
           </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => {
                setState({ 
                    query: '', language: Language.ENGLISH, loading: false, error: null, data: null, imageUrl: null,
                    analysisImages: [], analysisResult: null, analyzing: false
                });
                setShowRoutesView(false);
                try {
                   window.history.pushState({}, '', window.location.pathname);
                } catch(e) { console.warn('History update failed', e); }
              }}
            >
              <div className="w-10 h-10 bg-heritage-gold rounded-full flex items-center justify-center text-black font-serif font-bold text-2xl">
                I
              </div>
              <span className="text-2xl font-serif text-stone-100 tracking-widest uppercase hidden sm:inline">
                Itihas<span className="text-heritage-gold">3D</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setShowRoutesView(true);
                  setShowFavoritesModal(false);
                }}
                className="flex items-center gap-2 text-stone-400 hover:text-heritage-gold transition-colors font-serif text-sm uppercase tracking-wide px-3 py-2 rounded-lg hover:bg-stone-900"
              >
                <RouteIcon className="w-5 h-5" />
                <span className="hidden md:inline">Routes</span>
              </button>
              <button 
                onClick={() => setShowFavoritesModal(true)}
                className="flex items-center gap-2 text-stone-400 hover:text-heritage-red transition-colors font-serif text-sm uppercase tracking-wide px-3 py-2 rounded-lg hover:bg-stone-900"
              >
                <HeartIcon className={`w-5 h-5 ${favorites.length > 0 ? 'text-heritage-red' : ''}`} filled={favorites.length > 0} />
                <span className="hidden md:inline">{t.favorites}</span>
                {favorites.length > 0 && (
                   <span className="bg-heritage-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full -ml-1 mb-3">
                     {favorites.length}
                   </span>
                )}
              </button>
              <LanguageSelector selected={state.language} onChange={handleLanguageChange} />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero / Content */}
      <main className="flex-grow">
        {showRoutesView ? (
          // Routes View
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button 
              onClick={() => setShowRoutesView(false)}
              className="mb-6 flex items-center gap-2 text-stone-400 hover:text-heritage-gold transition-colors"
            >
              <span>←</span> Back to Search
            </button>
            <RoutePlanner 
              currentPlace={state.data?.placeName}
              language={state.language}
              onSelectPlace={(place) => {
                setShowRoutesView(false);
                performSearch(place, state.language);
              }}
            />
          </div>
        ) : !state.data && !state.loading ? (
          // Hero State
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-stone-950">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-serif text-heritage-gold mb-6 drop-shadow-xl animate-fade-in transition-all">
                {t.title}
              </h1>
              <p className="text-xl text-stone-400 font-sans max-w-2xl mx-auto leading-relaxed animate-fade-in transition-all">
                {t.subtitle}
              </p>
            </div>

            <div className="w-full max-w-xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-heritage-gold to-stone-700 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <form onSubmit={handleSearch} className="relative flex items-center bg-stone-900 rounded-lg border border-stone-700 p-2 shadow-2xl">
                <SearchIcon className="ml-3 text-stone-500 w-6 h-6" />
                <input
                  type="text"
                  value={state.query}
                  onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent border-none text-white placeholder-stone-500 focus:ring-0 text-lg px-4 py-2 font-sans"
                />
                
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={startListening}
                  className="p-2 mr-2 rounded-full transition-colors text-stone-400 hover:text-heritage-gold"
                  title={t.voiceSearch}
                >
                  <MicIcon className="w-5 h-5" />
                </button>

                <button
                  type="submit"
                  className="bg-heritage-gold hover:bg-[#b5952f] text-black font-bold py-2 px-6 rounded-md transition-colors font-serif uppercase tracking-wider"
                >
                  {t.explore}
                </button>
              </form>
            </div>

            <div className="mt-12 flex gap-4 text-xs text-stone-600 uppercase tracking-widest">
               {t.examples.map((ex: string, i: number) => (
                   <React.Fragment key={i}>
                       <button onClick={() => performSearch(ex, state.language)} className="hover:text-heritage-gold transition-colors">{ex}</button>
                       {i < t.examples.length - 1 && <span>•</span>}
                   </React.Fragment>
               ))}
            </div>
          </div>
        ) : (
          // Content State
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Search Bar Condensed - Sticky or top placed */}
            <div className="flex justify-center mb-12">
               <form onSubmit={handleSearch} className="flex items-center gap-2 bg-stone-900 p-2 rounded-full border border-stone-800 shadow-lg hover:border-heritage-gold/50 transition-colors w-full max-w-lg">
                 <SearchIcon className="ml-3 text-stone-500 w-5 h-5" />
                 <input
                  type="text"
                  value={state.query}
                  onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                  className="bg-transparent border-none text-white focus:ring-0 w-full text-sm"
                  placeholder={t.searchAnother}
                 />
                 
                 {/* Voice Input Button Condensed */}
                 <button
                    type="button"
                    onClick={startListening}
                    className="p-1.5 rounded-full transition-colors text-stone-400 hover:text-heritage-gold"
                  >
                    <MicIcon className="w-4 h-4" />
                 </button>

                 <button type="submit" className="bg-stone-800 hover:bg-stone-700 text-heritage-gold px-4 py-1.5 rounded-full text-sm font-bold transition-colors">
                   {t.go}
                 </button>
               </form>
            </div>

            {state.loading && !state.data && <Loader text={t.consulting} />}
            
            {state.error && (
              <div className="text-center py-20">
                <p className="text-red-400 font-serif text-xl">{state.error}</p>
                <button 
                  onClick={() => handleSearch()} 
                  className="mt-4 text-heritage-gold hover:underline underline-offset-4"
                >
                  {t.tryAgain}
                </button>
              </div>
            )}

            {state.data && (
              <PlaceDisplay 
                data={state.data} 
                imageUrl={state.imageUrl} 
                isFavorite={isCurrentPlaceFavorite}
                onToggleFavorite={() => state.data && toggleFavorite(state.data.placeName)}
                analysisImages={state.analysisImages}
                analysisResult={state.analysisResult}
                analyzing={state.analyzing}
                onUploadImages={handleUploadImages}
                onAnalyze={handleAnalyze}
                onClearAnalysis={handleClearAnalysis}
                language={state.language}
                isLoading={state.loading}
              />
            )}
            
            {state.loading && state.data && (
               <div className="fixed bottom-8 right-8 bg-stone-900 border border-heritage-gold/30 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
                  <div className="w-2 h-2 bg-heritage-gold rounded-full animate-ping"></div>
                  <span className="text-xs text-heritage-gold uppercase tracking-widest">{t.processing}</span>
               </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 py-8 text-center text-stone-600 text-sm font-sans">
        <p>&copy; {new Date().getFullYear()} {t.footer}</p>
      </footer>
    </div>
  );
};

export default App;