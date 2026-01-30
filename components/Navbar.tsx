import React from 'react';
import { Watch, LayoutGrid } from 'lucide-react';
import { AppState } from '../types';

interface Props {
  onNavigate: (view: 'home' | 'collection') => void;
  currentState: AppState;
}

export const Navbar: React.FC<Props> = ({ onNavigate, currentState }) => {
  const isCollectionActive = currentState === AppState.VIEWING_COLLECTION || currentState === AppState.VIEWING_COLLECTION_DETAIL;

  return (
    <nav className="w-full py-6 px-8 flex items-center justify-between border-b border-gray-800 bg-[#0f1115]/90 backdrop-blur fixed top-0 left-0 right-0 z-50 no-print">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onNavigate('home')}
      >
        <div className="p-2 bg-yellow-600/20 rounded-full border border-yellow-600/50 group-hover:bg-yellow-600/30 transition-colors">
          <Watch className="w-6 h-6 text-yellow-500" />
        </div>
        <span className="serif text-2xl font-bold tracking-wider text-gray-100">
          HOROLOGY <span className="text-yellow-500">AI</span>
        </span>
      </div>
      <div className="flex gap-6 text-sm font-medium tracking-wide">
        <button 
          onClick={() => onNavigate('home')}
          className={`transition-colors flex items-center gap-2 ${!isCollectionActive ? 'text-yellow-500' : 'text-gray-400 hover:text-white'}`}
        >
          <Watch size={16} />
          鑑賞
        </button>
        <button 
          onClick={() => onNavigate('collection')}
          className={`transition-colors flex items-center gap-2 ${isCollectionActive ? 'text-yellow-500' : 'text-gray-400 hover:text-white'}`}
        >
          <LayoutGrid size={16} />
          我的收藏
        </button>
      </div>
    </nav>
  );
};