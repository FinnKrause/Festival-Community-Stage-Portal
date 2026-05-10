import React from 'react';

interface DisabledOverlayProps {
  message: string;
}

const DisabledOverlay: React.FC<DisabledOverlayProps> = ({ message }) => {
  const imageUrl = "https://static.thenounproject.com/png/2207874-200.png"; 

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <img 
        src={imageUrl} 
        alt="Service disabled" 
        className="w-24 h-24 object-contain mb-6 opacity-60"
      />
      
      <div className="space-y-3 max-w-sm">
        <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide">
          Songrequests Disabled
        </h2>
        
        <p className="text-gray-600 text-base leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};

export default DisabledOverlay;