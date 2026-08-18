import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { db } from '../../db/database';
import type { FotoVistoria } from '../../types/vistoria';

interface PhotoUploaderProps {
  eventoId: string;
  vistoriaTipo: 'INICIAL' | 'FINAL';
  ambiente: string;
  itemId?: string;
  onPhotoAdded?: (foto: FotoVistoria) => void;
  compact?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  eventoId,
  vistoriaTipo,
  ambiente,
  itemId,
  onPhotoAdded,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    setIsProcessing(true);
    setSuccessMessage(null);
    try {
      // Redimensionar e comprimir imagem via canvas para não sobrecarregar memória
      const base64Data = await resizeAndCompressImage(file);

      const novaFoto: FotoVistoria = {
        id: crypto.randomUUID(),
        eventoId,
        vistoriaTipo,
        ambiente,
        itemId,
        dataHora: new Date().toISOString(),
        dataUrl: base64Data,
        ordem: Date.now(),
      };

      await db.fotos.add(novaFoto);
      setSuccessMessage('Foto anexada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3500);

      if (onPhotoAdded) {
        onPhotoAdded(novaFoto);
      }
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Não foi possível processar a imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
    // Reset input value
    e.target.value = '';
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => cameraInputRef.current?.click()}
          title="Tirar foto com a câmera"
          className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
        >
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          title="Anexar da galeria/arquivos"
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[38px]"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <span>Tirar Foto</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[38px]"
          >
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <span>Galeria / Arquivo</span>
          </button>
        </div>

        {successMessage && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <span className="text-[11px] text-slate-400">
        Suporta fotos diretas da câmera do celular/tablet ou envio de imagens JPG/PNG.
      </span>
    </div>
  );
};

function resizeAndCompressImage(file: File, maxWidth = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao obter contexto 2D'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
