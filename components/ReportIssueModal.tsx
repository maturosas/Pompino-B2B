
import React, { useState } from 'react';
import { User } from '../types';
import { db, collection, setDoc, doc } from '../services/firebaseConfig';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [issueText, setIssueText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;

    setIsSending(true);

    try {
      // 1. Save to Firestore (allows backend trigger/email extension to pick it up)
      const reportId = `report-${Date.now()}`;
      await setDoc(doc(db, "reports", reportId), {
          id: reportId,
          user: currentUser || 'Anonymous',
          message: issueText,
          timestamp: Date.now(),
          status: 'new'
      });

      // 2. Show Success Message
      setShowSuccess(true);
      
      // 3. Close after delay
      setTimeout(() => {
          setShowSuccess(false);
          setIssueText('');
          setIsSending(false);
          onClose();
      }, 2500);

    } catch (error) {
        console.error("Error reporting issue:", error);
        alert("Hubo un error al enviar el reporte. Intenta de nuevo.");
        setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        
        {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95">
                <div className="text-6xl mb-4">🙌</div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Gracias Wachin</h3>
                <p className="text-white/50 text-sm">Tu reporte ha sido enviado al equipo técnico.</p>
                <div className="w-full h-1 bg-white/10 mt-6 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[width_2.5s_linear_forwards]" style={{width: '0%'}}></div>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmit}>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                    <span className="text-red-500">🐞</span> Reportar Problema
                </h3>
                
                <p className="text-white/60 text-xs mb-4">
                    Describe el error o sugerencia. Esto enviará una alerta automática a <strong>hola@bzsgrupobebidas.com.ar</strong>.
                </p>

                <textarea
                    value={issueText}
                    onChange={(e) => setIssueText(e.target.value)}
                    placeholder="Escribe aquí lo que pasó..."
                    className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none resize-none mb-4"
                    autoFocus
                />

                <div className="flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase transition-colors"
                        disabled={isSending}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={!issueText.trim() || isSending}
                        className={`px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-red-900/20 ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSending ? 'Enviando...' : 'Enviar Reporte'}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default ReportIssueModal;
