
import React, { useState } from 'react';
import { useDataStore } from '../stores/useDataStore';
import { useAppStore } from '../stores/useAppStore';
import { Lead } from '../types';

const AddLeadModal: React.FC = () => {
  const { addManualLead } = useDataStore();
  const { showAddLeadModal, setShowAddLeadModal } = useAppStore();
  
  const [leadData, setLeadData] = useState<Partial<Lead>>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    location: '',
    category: '',
    status: 'frio',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLeadData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name?.trim()) return;
    setIsSaving(true);
    try {
      await addManualLead(leadData);
      // Reset and close
      setLeadData({ name: '', contactName: '', phone: '', email: '', location: '', category: '', status: 'frio', notes: '' });
      setShowAddLeadModal(false);
    } catch (error) {
      console.error("Failed to save manual lead:", error);
      alert("Error al guardar el lead. Revisa la consola.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!showAddLeadModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4">Crear Lead Manual</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Nombre Cuenta (Requerido)</label>
              <input name="name" value={leadData.name} onChange={handleChange} required className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Persona de Contacto</label>
              <input name="contactName" value={leadData.contactName} onChange={handleChange} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Teléfono / WhatsApp</label>
              <input name="phone" value={leadData.phone} onChange={handleChange} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Email</label>
              <input type="email" name="email" value={leadData.email} onChange={handleChange} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Ubicación / Zona</label>
                <input name="location" value={leadData.location} onChange={handleChange} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Rubro</label>
              <input name="category" value={leadData.category} onChange={handleChange} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white" />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Estado Inicial</label>
            <select name="status" value={leadData.status} onChange={handleChange} className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-sm text-white">
                <option value="frio">Frio</option>
                <option value="contacted">Contactado</option>
                <option value="negotiation">Negociación</option>
                <option value="client">Cliente</option>
            </select>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Comentarios</label>
            <textarea name="notes" value={leadData.notes} onChange={handleChange} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddLeadModal(false)} className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase">Cancelar</button>
            <button type="submit" disabled={!leadData.name?.trim() || isSaving} className="px-6 py-2 bg-white disabled:opacity-50 text-black text-xs font-black uppercase rounded-xl">
              {isSaving ? 'Guardando...' : 'Guardar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
