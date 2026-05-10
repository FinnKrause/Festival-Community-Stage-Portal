import React from 'react';

interface DJModeOverlayProps {
  name: string;
  instagram?: string;
  message: string;
  dj_avatar_url: string;
}

const DJModeOverlay: React.FC<DJModeOverlayProps> = ({ name, dj_avatar_url, instagram, message }) => {
  return (
<div className="relative w-full min-h-screen flex flex-col items-center justify-center py-16 px-6 overflow-hidden">
  {/* Dynamic Animated Background - Blue theme */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#05050f] via-[#0a0a1a] to-[#0a0a2a]"></div>
  
  {/* Animated Gradient Orbs - Blue tones */}
  <div className="absolute top-0 -left-40 w-96 h-96 bg-[#3b82f6]/20 rounded-full blur-3xl animate-float"></div>
  <div className="absolute bottom-0 -right-40 w-96 h-96 bg-[#2563eb]/15 rounded-full blur-3xl animate-float-delayed"></div>
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1e40af]/10 rounded-full blur-3xl animate-pulse-slow"></div>
  <div className="absolute top-1/3 -right-48 w-80 h-80 bg-[#60a5fa]/10 rounded-full blur-3xl animate-float"></div>
  
  {/* Grid Pattern Overlay - Optional, can uncomment if desired */}
  {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="%233b82f6" stroke-width="0.5" stroke-opacity="0.1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E')] opacity-20"></div> */}
  
  {/* Content Container */}
  <div className="relative z-10 max-w-2xl w-full space-y-8">
    
    {/* Live Broadcast Bar - Blue theme */}
    <div className="flex items-center justify-center gap-4 animate-fade-in-up">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#3b82f6]"></div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
          <span className="relative flex h-3 w-3 rounded-full bg-red-500"></span>
        </div>
        <span className="text-[11px] font-bold text-red-500 uppercase tracking-[0.3em]">Live Broadcast</span>
      </div>
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#3b82f6]"></div>
    </div>
    
    {/* DJ Avatar - Bigger & Better with blue theme */}
    <div className="relative flex justify-center animate-fade-in-up animation-delay-200">
      <div className="relative group">
        {/* Rotating Rings - Blue */}
        <div className="absolute -inset-4 rounded-full border border-[#3b82f6]/40 animate-spin-slow"></div>
        <div className="absolute -inset-8 rounded-full border border-[#3b82f6]/25 animate-spin-slow-reverse"></div>
        <div className="absolute -inset-12 rounded-full border border-[#3b82f6]/15 animate-spin-slow-slower"></div>
        
        {/* Glow Effects - Blue */}
        <div className="absolute -inset-16 bg-[#3b82f6]/20 rounded-full blur-3xl group-hover:bg-[#3b82f6]/30 transition-all duration-700"></div>
        
        {/* Avatar Container */}
        <div className="relative w-48 h-48 rounded-full overflow-hidden ring-4 ring-[#3b82f6]/30 shadow-2xl transform transition-all duration-500 group-hover:scale-105 group-hover:ring-[#3b82f6]/60">
          <img 
            src={dj_avatar_url} 
            alt={`DJ ${name}`} 
            className="w-full h-full object-cover"
          />
          {/* Overlay Gradient - Blue tint */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        </div>
        

      </div>
    </div>
    
    {/* DJ Info Section - Blue theme */}
    <div className="text-center space-y-4 animate-fade-in-up animation-delay-400">
      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[#3b82f6] uppercase tracking-[0.3em]">Euer DJ</h3>
        
        {/* DJ Name with Animated Gradient - Blue theme */}
        <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-[#60a5fa] to-white bg-clip-text text-transparent tracking-tighter animate-gradient-x">
          DJ {name}
        </h1>
      </div>
      
      {/* Instagram Link - Blue theme */}
      {instagram && (
        <div className="flex justify-center pt-2">
          <a 
            href={`https://instagram.com/${instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/insta flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#3b82f6]/50 hover:bg-white/10 transition-all duration-300"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover/insta:text-[#3b82f6] transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-300 group-hover/insta:text-white transition-colors">
              @{instagram.replace('@', '')}
            </span>
          </a>
        </div>
      )}
    </div>
    
    {/* System Notice - Clean & Integrated with blue accents */}
    <div className="pt-6 animate-fade-in-up animation-delay-600">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#3b82f6]/50"></div>
          <span className="text-[9px] font-bold text-[#3b82f6]/70 uppercase tracking-[0.2em]">Session Info</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#3b82f6]/50"></div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed text-center">
          {message}
        </p>
      </div>
    </div>
    
    {/* Status Bar - Blue theme */}
    <div className="flex items-center justify-center gap-4 pt-4 animate-fade-in-up animation-delay-800">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse"></div>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Requests Paused</span>
      </div>
      <div className="w-1 h-1 rounded-full bg-gray-600"></div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Live Set in Progress</span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse"></div>
      </div>
    </div>
  </div>
  
  <style jsx>{`
    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-30px) translateX(20px); }
    }
    
    @keyframes float-delayed {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(30px) translateX(-20px); }
    }
    
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.1; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.2); }
    }
    
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes spin-slow-reverse {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    
    @keyframes spin-slow-slower {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes gradient-x {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-float {
      animation: float 12s ease-in-out infinite;
    }
    
    .animate-float-delayed {
      animation: float-delayed 15s ease-in-out infinite;
    }
    
    .animate-pulse-slow {
      animation: pulse-slow 8s ease-in-out infinite;
    }
    
    .animate-spin-slow {
      animation: spin-slow 12s linear infinite;
    }
    
    .animate-spin-slow-reverse {
      animation: spin-slow-reverse 10s linear infinite;
    }
    
    .animate-spin-slow-slower {
      animation: spin-slow-slower 15s linear infinite;
    }
    
    .animate-gradient-x {
      background-size: 200% auto;
      animation: gradient-x 3s ease infinite;
    }
    
    .animate-fade-in-up {
      animation: fade-in-up 0.6s ease-out forwards;
      opacity: 0;
    }
    
    .animation-delay-200 {
      animation-delay: 0.2s;
    }
    
    .animation-delay-400 {
      animation-delay: 0.4s;
    }
    
    .animation-delay-600 {
      animation-delay: 0.6s;
    }
    
    .animation-delay-800 {
      animation-delay: 0.8s;
    }
  `}</style>
</div>
  );
};

export default DJModeOverlay;