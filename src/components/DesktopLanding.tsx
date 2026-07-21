import React from "react";
import QRCode from "react-qr-code";
import { ShieldCheck } from "lucide-react";

export const DesktopLanding = () => {
  const url = "https://tryupishield.vercel.app/";

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-8">
      <div className="relative overflow-hidden max-w-6xl w-full bg-surfaceContainer rounded-[32px] shadow-2xl border border-outline/10">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-16 items-center p-12 lg:p-16">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
              <ShieldCheck size={20} />
              <span className="font-medium">
                AI-powered UPI Fraud Detection
              </span>
            </div>

            <h1 className="text-5xl font-bold text-onSurface leading-tight mb-6">
              Protect Every
              <br />
              UPI Payment
            </h1>

            <p className="text-lg text-onSurfaceVariant leading-relaxed mb-10 max-w-lg">
              UPI Shield is a mobile-first experience that helps identify
              suspicious UPI IDs, detect scam patterns, and educate users about
              digital payment fraud before they make a transaction.
            </p>

            <div className="flex items-center gap-4">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Open in Browser →
              </a>

              <p className="text-sm text-onSurfaceVariant">
                Best experienced on mobile.
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-110" />

              {/* Phone */}
              <div className="relative bg-neutral-900 rounded-[42px] p-4 shadow-2xl">
                <div className="w-[320px] bg-white rounded-[30px] p-8 flex flex-col items-center">
                  <div className="w-16 h-1.5 rounded-full bg-neutral-300 mb-8" />

                  <QRCode
                    value={url}
                    size={220}
                    level="H"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxWidth: "220px",
                    }}
                  />

                  <p className="mt-8 text-lg font-semibold text-gray-800">
                    Scan to Open
                  </p>

                  <p className="text-sm text-center text-gray-500 mt-2 leading-relaxed">
                    Point your phone's camera at the QR code to launch
                    <br />
                    UPI Shield instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-outline/10 px-12 py-5 text-center text-sm text-onSurfaceVariant">
          Built for mobile-first fraud detection • Powered by AI
        </div>
      </div>
    </div>
  );
};