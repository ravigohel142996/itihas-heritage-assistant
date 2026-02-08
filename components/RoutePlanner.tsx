import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPinIcon, ClockIcon, RouteIcon } from './Icons';

interface HeritageRoute {
  id: string;
  name: string;
  description: string;
  places: string[];
  estimatedTime: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  region: string;
}

interface RoutesPlannerProps {
  currentPlace?: string;
  language: Language;
  onSelectPlace: (place: string) => void;
}

/**
 * RoutePlanner component provides curated heritage routes
 * Shows mini heritage routes with multiple sites grouped by theme or region
 */
const RoutePlanner: React.FC<RoutesPlannerProps> = ({ currentPlace, language, onSelectPlace }) => {
  const t = TRANSLATIONS[language]?.ui || TRANSLATIONS[Language.ENGLISH].ui;
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Curated heritage routes across India
  const heritageRoutes: HeritageRoute[] = [
    {
      id: 'golden-triangle',
      name: 'Golden Triangle',
      description: 'Explore the iconic heritage circuit of Delhi, Agra, and Jaipur',
      places: ['Taj Mahal', 'Red Fort Delhi', 'Qutub Minar', 'Amber Fort', 'Hawa Mahal', 'India Gate'],
      estimatedTime: '3-4 days',
      difficulty: 'Easy',
      region: 'North India'
    },
    {
      id: 'rajasthan-royal',
      name: 'Rajasthan Royal Trail',
      description: 'Discover the majestic forts and palaces of Rajasthan',
      places: ['Mehrangarh Fort', 'Jaisalmer Fort', 'Chittorgarh Fort', 'Udaipur City Palace', 'Junagarh Fort'],
      estimatedTime: '5-7 days',
      difficulty: 'Moderate',
      region: 'Rajasthan'
    },
    {
      id: 'south-temple',
      name: 'South India Temple Circuit',
      description: 'Experience the architectural grandeur of South Indian temples',
      places: ['Meenakshi Temple', 'Brihadeeswarar Temple', 'Virupaksha Temple', 'Konark Sun Temple', 'Jagannath Temple Puri'],
      estimatedTime: '6-8 days',
      difficulty: 'Moderate',
      region: 'South India'
    },
    {
      id: 'heritage-mumbai',
      name: 'Mumbai Heritage Walk',
      description: 'Walk through Mumbai\'s colonial and ancient heritage',
      places: ['Gateway of India', 'Elephanta Caves', 'Chhatrapati Shivaji Terminus', 'Ajanta Caves', 'Ellora Caves'],
      estimatedTime: '2-3 days',
      difficulty: 'Easy',
      region: 'Maharashtra'
    },
    {
      id: 'buddhist-circuit',
      name: 'Buddhist Heritage Trail',
      description: 'Follow the path of Buddha through sacred sites',
      places: ['Bodh Gaya', 'Sarnath', 'Kushinagar', 'Nalanda', 'Sanchi Stupa'],
      estimatedTime: '4-5 days',
      difficulty: 'Moderate',
      region: 'Central & East India'
    },
    {
      id: 'himalayan-heritage',
      name: 'Himalayan Heritage',
      description: 'Explore ancient monasteries and mountain heritage',
      places: ['Hemis Monastery', 'Thiksey Monastery', 'Leh Palace', 'Golden Temple Amritsar', 'Rock Garden Chandigarh'],
      estimatedTime: '5-6 days',
      difficulty: 'Challenging',
      region: 'North India Mountains'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 border-green-400';
      case 'Moderate': return 'text-yellow-400 border-yellow-400';
      case 'Challenging': return 'text-red-400 border-red-400';
      default: return 'text-stone-400 border-stone-400';
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRoute(selectedRoute === routeId ? null : routeId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl md:text-4xl font-serif text-heritage-gold tracking-wider uppercase">
          {t.heritageRoutes || 'Heritage Routes'}
        </h2>
        <p className="text-stone-400 text-sm md:text-base">
          {t.routesDesc || 'Curated mini heritage routes across India'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {heritageRoutes.map((route, index) => {
          const isSelected = selectedRoute === route.id;
          const isCurrentPlaceInRoute = currentPlace && route.places.some(p => 
            p.toLowerCase().includes(currentPlace.toLowerCase()) || 
            currentPlace.toLowerCase().includes(p.toLowerCase())
          );

          return (
            <div 
              key={route.id}
              className={`bg-stone-900/50 rounded-lg border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                isSelected ? 'border-heritage-gold shadow-lg shadow-heritage-gold/20' : 'border-stone-800 hover:border-heritage-gold/50'
              } ${isCurrentPlaceInRoute ? 'ring-2 ring-heritage-red/50' : ''}`}
              onClick={() => handleRouteSelect(route.id)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-800 bg-stone-900/70">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-grow">
                    <h3 className="font-serif text-lg text-heritage-gold mb-1">{route.name}</h3>
                    <p className="text-xs text-stone-500 uppercase tracking-wider">{route.region}</p>
                  </div>
                  {isCurrentPlaceInRoute && (
                    <span className="bg-heritage-red/20 text-heritage-red text-[10px] px-2 py-1 rounded-full border border-heritage-red/50 uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <p className="text-stone-300 text-sm leading-relaxed">{route.description}</p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-stone-950/50 px-2 py-1 rounded border border-stone-800">
                    <ClockIcon className="w-3 h-3 text-heritage-gold" />
                    <span className="text-stone-400">{route.estimatedTime}</span>
                  </div>
                  <div className={`flex items-center gap-1 bg-stone-950/50 px-2 py-1 rounded border ${getDifficultyColor(route.difficulty)}`}>
                    <span>🎯</span>
                    <span>{route.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-stone-950/50 px-2 py-1 rounded border border-stone-800">
                    <MapPinIcon className="w-3 h-3 text-heritage-gold" />
                    <span className="text-stone-400">{route.places.length} stops</span>
                  </div>
                </div>

                {/* Places List (Expandable) */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-stone-800 space-y-2 animate-fade-in">
                    <h4 className="text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                      <RouteIcon className="w-3 h-3" />
                      Places in this route
                    </h4>
                    <ul className="space-y-1.5">
                      {route.places.map((place, idx) => {
                        const isCurrentPlace = currentPlace && (
                          place.toLowerCase().includes(currentPlace.toLowerCase()) || 
                          currentPlace.toLowerCase().includes(place.toLowerCase())
                        );
                        
                        return (
                          <li key={idx}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPlace(place);
                              }}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                                isCurrentPlace 
                                  ? 'bg-heritage-gold/20 text-heritage-gold border border-heritage-gold/50' 
                                  : 'bg-stone-950/50 text-stone-300 hover:bg-stone-800 hover:text-heritage-gold border border-transparent'
                              }`}
                            >
                              <span className="font-sans flex items-center gap-2">
                                <span className="text-xs text-stone-600">{idx + 1}.</span>
                                {place}
                                {isCurrentPlace && <span className="ml-auto text-[10px] text-heritage-gold">✓</span>}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pb-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRouteSelect(route.id);
                  }}
                  className="w-full bg-stone-800 hover:bg-heritage-gold/10 hover:border-heritage-gold text-stone-400 hover:text-heritage-gold border border-stone-700 py-2 rounded text-xs uppercase tracking-wider transition-all duration-300"
                >
                  {isSelected ? 'Hide Details' : 'View Route'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="text-center text-stone-600 text-xs mt-8 space-y-1">
        <p>{t.routesHelp || 'Click on any route to see all heritage sites included'}</p>
        <p>{t.routesHelp2 || 'Click on a site name to explore its details'}</p>
      </div>
    </div>
  );
};

export default RoutePlanner;
