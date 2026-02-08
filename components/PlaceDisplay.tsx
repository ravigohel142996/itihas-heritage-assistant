import React, { useState, useRef } from 'react';
import { HistoricPlaceData, VisualAnalysisData, Language, Section } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPinIcon, ClockIcon, BoxIcon, SparklesIcon, InfoIcon, ShareIcon, CheckIcon, HeartIcon, ScrollIcon, CrownIcon, BlueprintIcon, UserGroupIcon, BrokenIcon, LightbulbIcon, EyeIcon, UploadIcon, GlobeIcon, XIcon } from './Icons';
import { translateSummary } from '../services/openaiService';
import MapView from './MapView';

interface Props {
  data: HistoricPlaceData;
  imageUrl: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  // Analysis Props
  analysisImages: string[];
  analysisResult: VisualAnalysisData | null;
  analyzing: boolean;
  onUploadImages: (files: FileList) => void;
  onAnalyze: () => void;
  onClearAnalysis: () => void;
  language: Language;
  isLoading?: boolean;
}

const PlaceDisplay: React.FC<Props> = ({ 
  data, imageUrl, isFavorite, onToggleFavorite,
  analysisImages, analysisResult, analyzing, onUploadImages, onAnalyze, onClearAnalysis, language, isLoading
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'insights' | 'analysis' | 'map'>('3d');
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  const t = TRANSLATIONS[language]?.ui || TRANSLATIONS[Language.ENGLISH].ui;

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Explore ${data.placeName}`,
          text: `Explore ${data.placeName} on Itihas 3D.`,
          url: window.location.href,
        });
      } catch (err) { console.log('Error sharing:', err); }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTranslate = async () => {
      // Find the "Overview" or first section from insights to translate
      const summaryText = data.insightSections[0]?.content as string;
      
      if (!summaryText) return;
      if (translations) { setShowTranslations(true); return; }
      
      setTranslating(true);
      try {
          const result = await translateSummary(summaryText);
          setTranslations(result);
          setShowTranslations(true);
      } catch (e) {
          console.error("Translation failed", e);
      } finally {
          setTranslating(false);
      }
  };

  const renderSectionContent = (content: string | string[]) => {
      if (Array.isArray(content)) {
          return (
              <ul className="space-y-2 mt-2">
                  {content.map((item, idx) => (
                      <li key={idx} className="flex gap-2 text-stone-300 text-sm font-sans">
                          <span className="text-heritage-gold mt-1">•</span> {item}
                      </li>
                  ))}
              </ul>
          );
      }
      return <p className="text-stone-300 leading-relaxed font-sans text-sm mt-2">{content}</p>;
  };

  const renderDynamicCard = (section: Section, icon?: React.ReactNode, delay: number = 0) => (
    <div 
        key={section.title} 
        className="bg-stone-900/50 p-5 rounded-lg border border-stone-800 hover:border-heritage-gold/30 transition-all duration-700 ease-out h-full flex flex-col animate-fade-in fill-mode-backwards"
        style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-3 text-heritage-gold border-b border-stone-800 pb-2">
        {icon && <div className="p-1.5 bg-stone-800 rounded-md border border-stone-700">{icon}</div>}
        <h4 className="font-serif text-lg tracking-wide uppercase">{section.title}</h4>
      </div>
      {renderSectionContent(section.content)}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-20 relative">
      
      {/* Translations Modal */}
      {showTranslations && translations && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl relative">
                  <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900 rounded-t-xl sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                          <GlobeIcon className="w-6 h-6 text-heritage-gold" />
                          <h2 className="text-2xl font-serif text-white">Global Translations</h2>
                      </div>
                      <button onClick={() => setShowTranslations(false)} className="text-stone-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(translations).map(([lang, text]) => (
                          <div key={lang} className="bg-stone-950/50 p-4 rounded-lg border border-stone-800">
                              <h3 className="text-heritage-gold font-serif text-sm uppercase tracking-widest mb-2 border-b border-stone-800 pb-2">{lang}</h3>
                              <p className="text-stone-300 text-sm leading-relaxed font-sans">{text}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Header Actions */}
      <div className="absolute top-0 right-0 z-10 hidden md:flex items-center gap-3">
        <button onClick={onToggleFavorite} className={`flex items-center gap-2 border px-4 py-2 rounded-full transition-all duration-300 ${isFavorite ? 'bg-heritage-red/20 border-heritage-red text-heritage-red' : 'bg-stone-900/80 border-stone-600 text-stone-400'}`}>
          <HeartIcon className="w-4 h-4" filled={isFavorite} />
          <span className="font-serif tracking-wider text-sm">{isFavorite ? t.saved : t.save}</span>
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 bg-stone-900/80 border border-heritage-gold/30 hover:bg-heritage-gold hover:text-black text-heritage-gold px-4 py-2 rounded-full transition-all duration-300">
          {copied ? <CheckIcon className="w-4 h-4" /> : <ShareIcon className="w-4 h-4" />}
          <span className="font-serif tracking-wider text-sm">{copied ? t.copied : t.share}</span>
        </button>
      </div>

      {/* Main Header */}
      <div className="text-center space-y-4 pt-8 md:pt-0">
        <div className="md:hidden flex justify-end mb-2 gap-2">
           <button onClick={onToggleFavorite} className={`p-2 rounded-full ${isFavorite ? 'text-heritage-red' : 'text-stone-400'}`}><HeartIcon className="w-6 h-6" filled={isFavorite} /></button>
           <button onClick={handleShare} className="p-2 text-heritage-gold"><ShareIcon className="w-6 h-6" /></button>
        </div>

        <h1 className="text-4xl md:text-6xl font-serif text-heritage-gold tracking-wider uppercase drop-shadow-lg">{data.placeName}</h1>
        
        {data.detectedLanguage && (
            <div className="flex justify-center">
                <span className="bg-stone-800/80 text-stone-400 text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-stone-700">
                    Language: <span className="text-heritage-gold">{data.detectedLanguage}</span>
                </span>
            </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 text-stone-400 font-sans text-sm md:text-base mt-2">
          <div className="flex items-center gap-2 bg-stone-850 px-4 py-2 rounded-full border border-stone-800">
            <MapPinIcon className="w-4 h-4 text-heritage-gold" /><span>{data.location}</span>
          </div>
          <div className="flex items-center gap-2 bg-stone-850 px-4 py-2 rounded-full border border-stone-800">
            <ClockIcon className="w-4 h-4 text-heritage-gold" /><span>{data.timePeriod}</span>
          </div>
          <div className="flex items-center gap-2 bg-stone-850 px-4 py-2 rounded-full border border-stone-800">
            <BoxIcon className="w-4 h-4 text-heritage-gold" /><span>{t.builtBy} {data.whoBuiltIt}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 border-b border-stone-800 pb-1 mb-8">
        {[
            { id: '3d', label: t.view3d, icon: BoxIcon },
            { id: 'insights', label: t.insights, icon: ScrollIcon },
            { id: 'map', label: t.mapView || 'Map', icon: MapPinIcon },
            { id: 'analysis', label: t.analysis, icon: EyeIcon }
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 md:px-6 py-2 font-serif text-sm uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-heritage-gold text-heritage-gold' : 'border-transparent text-stone-500 hover:text-stone-300'}`}>
                <span className="flex items-center gap-2"><tab.icon className="w-4 h-4" /> {tab.label}</span>
            </button>
        ))}
      </div>

      {/* TABS CONTENT */}

      {/* 1. DEEP INSIGHTS (Dynamic Sections) */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-fade-in">
           
           {/* Visual Experience Context Bar */}
           {data.visualExperience && (
              <div className="flex items-center justify-between bg-stone-900/30 border border-stone-800 rounded px-4 py-2 text-xs uppercase tracking-widest text-stone-500 mb-6">
                 <div className="flex gap-4">
                     <span>Theme: <span className="text-heritage-gold">{data.visualExperience.background_visual}</span></span>
                     <span className="hidden sm:inline">Rhythm: <span className="text-heritage-gold">{data.visualExperience.reading_rhythm}</span></span>
                 </div>
                 <div className="flex gap-2">
                     <span className="hidden sm:inline">{data.visualExperience.title_animation}</span>
                 </div>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Render all insight sections */}
            {data.insightSections.map((section, idx) => {
                // Determine Rhythm Delay
                let delay = 100 * idx;
                if (data.visualExperience?.reading_rhythm?.toLowerCase().includes('slow')) {
                    delay = 300 * idx;
                } else if (data.visualExperience?.reading_rhythm?.toLowerCase().includes('guided')) {
                    delay = 500 * idx;
                }

                // Special styling for Overview?
                if (idx === 0) {
                    return (
                        <div key={idx} className="col-span-1 md:col-span-2 lg:col-span-3 bg-stone-800/80 p-6 rounded-lg border border-heritage-gold/50 shadow-lg relative overflow-hidden group animate-fade-in" style={{ animationDelay: '0ms' }}>
                            <div className="absolute top-0 right-0 p-4 opacity-10"><GlobeIcon className="w-24 h-24 text-heritage-gold" /></div>
                            <div className="flex justify-between items-start relative z-10 mb-4">
                                <h3 className="text-heritage-gold font-serif text-xl flex items-center gap-2">
                                    <GlobeIcon className="w-5 h-5" /> {section.title}
                                </h3>
                                <button onClick={handleTranslate} disabled={translating} className="text-xs border border-stone-600 hover:border-heritage-gold hover:text-heritage-gold text-stone-400 px-3 py-1 rounded-full transition-colors flex items-center gap-2">
                                    {translating ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <GlobeIcon className="w-3 h-3" />}
                                    {t.translate}
                                </button>
                            </div>
                            <p className="text-stone-200 leading-relaxed font-sans text-sm md:text-base relative z-10">{section.content}</p>
                        </div>
                    )
                }
                
                // Icons for other sections based on index/heuristics (fallback to generic)
                let Icon = InfoIcon;
                if (idx === 2) Icon = CrownIcon;
                if (idx === 3) Icon = LightbulbIcon;
                if (idx === 4) Icon = SparklesIcon;

                return renderDynamicCard(section, <Icon className="w-5 h-5" />, delay);
            })}
           </div>
        </div>
      )}

      {/* 2. PHOTO ANALYSIS (Dynamic Sections) */}
      {activeTab === 'analysis' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
               <div className="bg-stone-900 border-2 border-dashed border-stone-700 rounded-lg p-8 text-center hover:border-heritage-gold/50 transition-colors relative">
                  <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" ref={fileInputRef} onChange={(e) => e.target.files && onUploadImages(e.target.files)} />
                  <UploadIcon className="w-12 h-12 text-stone-500 mx-auto mb-4" />
                  <h3 className="text-xl font-serif text-white mb-2">{t.uploadTitle}</h3>
                  <p className="text-stone-400 text-sm">{t.uploadDesc} {data.placeName}.</p>
               </div>
               
               {analysisImages.length > 0 && (
                 <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                       {analysisImages.map((img, idx) => (
                          <img key={idx} src={img} alt="Analysis Input" className="w-24 h-24 object-cover rounded border border-stone-700" />
                       ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onAnalyze} disabled={analyzing} className="flex-1 bg-heritage-gold hover:bg-[#b5952f] text-black font-bold py-3 rounded uppercase tracking-wider transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                            {analyzing ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>{t.analyzing}</> : t.runAnalysis}
                        </button>
                        <button onClick={onClearAnalysis} className="px-4 border border-stone-600 hover:border-red-500 hover:text-red-500 text-stone-400 rounded uppercase tracking-wider text-sm transition-colors">{t.clear}</button>
                    </div>
                 </div>
               )}
            </div>

            <div className="space-y-6">
                {analysisResult ? (
                    <div className="grid grid-cols-1 gap-4">
                        {analysisResult.analysisSections.map((section, idx) => (
                            renderDynamicCard(section, <EyeIcon className="w-5 h-5" />)
                        ))}
                    </div>
                ) : (
                    <div className="h-full border border-stone-800 rounded-lg flex flex-col items-center justify-center p-8 text-center text-stone-600 bg-stone-900/30">
                        <BlueprintIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>{t.uploadDesc}</p>
                    </div>
                )}
            </div>
         </div>
      )}

      {/* 3. 3D VISUALIZATION (Dynamic Sections) */}
      {activeTab === '3d' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-6">
            <div ref={imageContainerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative aspect-video w-full rounded-lg border-2 border-stone-800 shadow-2xl group overflow-hidden perspective-1000 cursor-move" style={{ perspective: '1000px' }}>
               <div className="w-full h-full transition-transform duration-100 ease-out" style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(1.02)`, transformStyle: 'preserve-3d' }}>
                 {imageUrl ? (
                   <img src={imageUrl} alt={data.placeName} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-600">
                     {isLoading ? (
                         <span className="animate-pulse flex items-center gap-2"><div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce"></div>{t.vizDesc}</span>
                     ) : (
                         <span className="text-stone-500 flex flex-col items-center gap-2"><BrokenIcon className="w-8 h-8 opacity-50" />{t.vizUnavailable}</span>
                     )}
                   </div>
                 )}
               </div>
               <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-heritage-gold/50 px-3 py-1 rounded text-xs text-heritage-gold font-bold uppercase tracking-widest flex items-center gap-2 z-20" style={{ transform: `translateX(${rotate.y * -2}px) translateY(${rotate.x * -2}px)` }}>
                 <BoxIcon className="w-3 h-3" /> {t.conceptRender}
               </div>
            </div>
            
            {/* Render the first visualization section as the main description */}
            {data.visualizationSections.length > 0 && (
                <div className="bg-stone-900/50 p-6 rounded-lg border border-stone-800 min-h-[200px]">
                    <h3 className="text-heritage-gold font-serif text-xl mb-3 flex items-center gap-2">
                    <BoxIcon className="w-5 h-5" /> {data.visualizationSections[0].title}
                    </h3>
                    <p className="text-stone-300 leading-relaxed font-sans">{data.visualizationSections[0].content}</p>
                </div>
            )}
          </div>
  
          {/* Render remaining visualization sections */}
          <div className="space-y-6">
             {data.visualizationSections.slice(1).map((section, idx) => (
                 renderDynamicCard(section, <BlueprintIcon className="w-5 h-5" />)
             ))}
             
             {/* Architecture Static Fallback if not covered above? No, API provides sections now. */}
             <div className="bg-stone-900/50 p-6 rounded-lg border border-stone-800">
                <h3 className="text-heritage-gold font-serif text-xl mb-3">{t.architecture}</h3>
                <p className="text-stone-300 leading-relaxed font-sans">{data.architecturalStyle}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAP VIEW */}
      {activeTab === 'map' && (
        <div className="space-y-6 animate-fade-in">
          <MapView 
            placeName={data.placeName}
            location={data.location}
            // Coordinates can be extracted from Gemini or use a geocoding service
            // For now, we'll let MapView show approximate location
          />
          <div className="bg-stone-900/50 p-6 rounded-lg border border-stone-800">
            <h3 className="text-heritage-gold font-serif text-xl mb-3 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5" />
              Location Information
            </h3>
            <div className="space-y-3 text-stone-300">
              <p className="flex items-start gap-2">
                <span className="text-heritage-gold font-serif">Location:</span>
                <span className="font-sans">{data.location}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-heritage-gold font-serif">Time Period:</span>
                <span className="font-sans">{data.timePeriod}</span>
              </p>
              <p className="text-sm text-stone-500 mt-4">
                💡 Use the interactive map above to explore the location. You can zoom in/out and click on markers for more details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceDisplay;
