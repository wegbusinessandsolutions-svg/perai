import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-stone-800 transition-colors"
      >
        <Download className="w-4 h-4" />
        Instalar App
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors bg-white"
        >
          <Download className="w-4 h-4" />
          Instalar no iPhone
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl flex flex-col gap-4">
              <h3 className="text-xl font-extrabold text-stone-900">Instalar no iPhone / iPad</h3>
              <p className="mt-2 text-base text-stone-600 leading-relaxed">
                1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.<br />
                2. Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-full bg-stone-100 py-3 text-base font-bold text-stone-800 hover:bg-stone-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
