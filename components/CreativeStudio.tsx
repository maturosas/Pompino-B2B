
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

const CreativeStudio: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBaseImage(reader.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyEdit = async () => {
    if (!baseImage || !prompt.trim()) return;

    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = baseImage.split(',')[1];
      const mimeType = baseImage.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: `Apply the following edit to this image: ${prompt}. Return only the resulting image.`,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const resultUrl = `data:image/png;base64,${part.inlineData.data}`;
          setEditedImage(resultUrl);
          setHistory(prev => [resultUrl, ...prev.slice(0, 4)]);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        alert("No se pudo generar la edición. Intenta con un prompt diferente.");
      }
    } catch (error) {
      console.error("Image processing error:", error);
      alert("Error al procesar la imagen. Verifica tu conexión.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl mx-auto">
      {/* Branding Header */}
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Creative Studio</h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">AI-Powered Visual Assets • BZS GRUPO BEBIDAS</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">NANO BANANA ENGINE ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input & Control Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-6 rounded-[2rem] border-white/10 bg-white/[0.01] shadow-2xl">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Configuración</h3>
            
            <div className="space-y-4">
              <div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square bg-white/[0.02] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-500/40 hover:bg-white/[0.04] transition-all group overflow-hidden relative"
                >
                  {baseImage ? (
                    <img src={baseImage} alt="Base" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" />
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-white/20 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Subir Imagen Base</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Prompt de Edición</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Aplica un filtro retro cálido y aumenta el contraste..."
                  className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 rounded-2xl text-white font-medium text-xs focus:bg-white/[0.06] focus:border-indigo-500/40 outline-none transition-all placeholder:text-white/10 min-h-[120px] resize-none"
                />
              </div>

              <button
                onClick={applyEdit}
                disabled={isProcessing || !baseImage || !prompt}
                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                  isProcessing 
                  ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 cursor-wait' 
                  : 'bg-white text-black hover:bg-indigo-600 hover:text-white active:scale-[0.98]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Procesando</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>Generar Versión</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* History Sidebar */}
          {history.length > 0 && (
            <div className="glass-panel p-5 rounded-[2rem] border-white/5 bg-white/[0.005]">
              <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Revisiones Recientes</h4>
              <div className="grid grid-cols-4 gap-2">
                {history.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setEditedImage(img)}
                    className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all opacity-40 hover:opacity-100"
                  >
                    <img src={img} alt={`History ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Viewport Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel aspect-video rounded-[3rem] border-white/10 bg-black shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none"></div>
            
            {editedImage ? (
              <img src={editedImage} alt="Result" className="w-full h-full object-contain p-4 animate-in zoom-in-95 duration-700" />
            ) : isProcessing ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                <div className="relative">
                   <div className="w-16 h-16 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-10 h-10 border-r-2 border-blue-500 rounded-full animate-spin-slow"></div>
                   </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.5em] animate-pulse">Analizando Modalities</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">Re-imaginando píxeles vía Gemini 2.5</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-10">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-white font-black uppercase tracking-[1em] text-[10px] italic">No active viewport</p>
              </div>
            )}

            {/* Viewport Actions */}
            {editedImage && !isProcessing && (
              <div className="absolute bottom-6 right-6 flex gap-3 animate-in slide-in-from-bottom-4 duration-500">
                <a 
                  href={editedImage} 
                  download={`pompino-edit-${Date.now()}.png`}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-2xl hover:bg-white hover:text-black transition-all shadow-2xl"
                  title="Descargar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>
                <button 
                  onClick={() => { setBaseImage(editedImage); setEditedImage(null); }}
                  className="bg-indigo-600/80 backdrop-blur-md border border-indigo-400/30 text-white px-5 py-3 rounded-2xl hover:bg-indigo-500 transition-all shadow-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Usar como Base
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-[2.5rem] bg-white/[0.01] border-white/5">
              <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Sugerencias B2B</h5>
              <div className="flex flex-wrap gap-2">
                {["Filtro Minimalista", "Remover Fondo", "Estilo Corporativo", "Retoque B2B", "Contraste Profesional"].map(s => (
                  <button key={s} onClick={() => setPrompt(s)} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-white/30 hover:text-white hover:border-white/20 transition-all">{s}</button>
                ))}
              </div>
            </div>
            <div className="glass-panel p-5 rounded-[2.5rem] bg-indigo-600/[0.02] border-indigo-500/10 flex items-center justify-center">
              <p className="text-[9px] font-black text-white/10 uppercase text-center leading-relaxed tracking-widest">
                Optimizado para <br/> activos visuales de <br/> alta conversión
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeStudio;
