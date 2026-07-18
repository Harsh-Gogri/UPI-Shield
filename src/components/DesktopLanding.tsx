import React from 'react';
import QRCode from 'react-qr-code';

export const DesktopLanding = () => {
  const url = "https://harsh-gogri.github.io/UPI-shield/";

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-onSurface">UPI Shield Prototype</h1>
        
        <p className="text-lg text-onSurfaceVariant mb-4 leading-relaxed">
          This prototype is designed for mobile devices and is best experienced on a phone.
        </p>

        <p className="text-md text-onSurfaceVariant mb-8">
          Scan the QR code below to open the prototype on your mobile device.
        </p>

        <div className="bg-white p-6 rounded-3xl shadow-lg mb-8">
          <QRCode 
            value={url} 
            size={240} 
            level="H"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-onSurfaceVariant">Open on mobile</span>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary font-bold hover:underline break-all"
          >
            {url}
          </a>
        </div>
      </div>
    </div>
  );
};
