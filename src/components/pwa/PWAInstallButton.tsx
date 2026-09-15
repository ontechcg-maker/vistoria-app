import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { AppIcon } from '../common/AppIcon';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running standalone, don't clutter the UI
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General prompt or info
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          id="btn-pwa-install-header"
          onClick={handleInstallClick}
          disabled={isInstalling}
          title="Instalar aplicativo no celular ou computador"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-md shadow-teal-900/30 border border-teal-400/40 active:scale-95 transition-all min-h-[38px] sm:min-h-[42px] shrink-0"
        >
          <Smartphone className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 rounded-2xl p-3 sm:p-4 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 my-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <AppIcon className="w-10 h-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-teal-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-400" />
                Usar como Aplicativo no Celular
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1 sm:line-clamp-none">
                Instale na sua tela inicial para acesso rápido em campo e funcionamento ágil sem barra de navegador.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Instalar no Celular
          </button>
        </div>
      )}

      {/* iOS or Manual Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-teal-500/40 p-5 sm:p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <AppIcon className="w-11 h-11 shrink-0" />
                <div>
                  <h3 className="text-base font-black text-white">Instalar no seu Dispositivo</h3>
                  <p className="text-xs text-teal-300">Vistoria SEDE • Parque do Povo</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs text-slate-200">
              {isIOS ? (
                <>
                  <p className="font-semibold text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">1</span>
                    No Safari do iPhone/iPad, toque no botão <strong>Compartilhar</strong>:
                  </p>
                  <div className="flex items-center justify-center py-2 bg-slate-900/60 rounded-lg border border-slate-700/60">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-teal-300 font-bold">
                      <Share className="w-4 h-4" /> Compartilhar
                    </span>
                  </div>

                  <p className="font-semibold text-slate-100 flex items-center gap-2 pt-1">
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">2</span>
                    Role a lista e selecione <strong>Adicionar à Tela de Início</strong>:
                  </p>
                  <div className="flex items-center justify-center py-2 bg-slate-900/60 rounded-lg border border-slate-700/60">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-teal-300 font-bold">
                      <PlusSquare className="w-4 h-4" /> Adicionar à Tela de Início
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    O aplicativo será adicionado com o ícone oficial da SEDE, abrindo em tela cheia sem barras de navegação.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-100">
                    Para instalar no Android ou Google Chrome:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>Toque no menu de três pontos (⋮) do navegador no canto superior.</li>
                    <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    <li>Confirme a instalação para ter o app com acesso instantâneo na gaveta de aplicativos.</li>
                  </ol>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
