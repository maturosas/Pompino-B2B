
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatChannel, User } from '../types';
import { getUserColor, isUserAdmin } from '../projectConfig';
import { doc, deleteDoc, updateDoc, db } from '../services/firebaseConfig';

interface TeamChatProps {
  messages: ChatMessage[];
  channels: ChatChannel[];
  currentUser: User;
  onSendMessage: (text: string, channelId: string) => void;
  onCreateChannel: (name: string) => void;
}

const TeamChat: React.FC<TeamChatProps> = ({ messages, channels, currentUser, onSendMessage, onCreateChannel }) => {
  const [activeChannelId, setActiveChannelId] = useState('general');
  const [inputText, setInputText] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Mobile UI State: true = show list, false = show chat
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = isUserAdmin(currentUser);

  // Filter messages for active channel
  const activeMessages = messages.filter(m => (m.channelId || 'general') === activeChannelId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, activeChannelId, showMobileList]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText, activeChannelId);
    setInputText('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newChannelName.trim()) return;
      onCreateChannel(newChannelName);
      setNewChannelName('');
      setIsCreatingChannel(false);
  };

  const handleDeleteChannel = async (e: React.MouseEvent, channelId: string) => {
      e.stopPropagation();
      if (!window.confirm("¿Seguro que quieres eliminar este canal y todos sus mensajes?")) return;
      
      try {
          // Delete Channel Document
          await deleteDoc(doc(db, "chat_channels", channelId));
          // Ideally we should delete messages too, but for now we leave them orphaned or need a cloud function
          if (activeChannelId === channelId) setActiveChannelId('general');
      } catch(error) {
          console.error("Error deleting channel:", error);
      }
  };

  const handleRenameChannel = async (e: React.MouseEvent, channelId: string) => {
      e.stopPropagation();
      const newName = prompt("Nuevo nombre del canal:");
      if (!newName) return;
      
      try {
          await updateDoc(doc(db, "chat_channels", channelId), { name: newName });
      } catch(error) {
          console.error("Error updating channel:", error);
      }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectChannel = (id: string) => {
      setActiveChannelId(id);
      setShowMobileList(false); // Switch to chat view on mobile
  };

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
      
      {/* SIDEBAR: CHANNELS */}
      <div className={`
          absolute inset-0 z-20 bg-[#0a0a0a] md:relative md:w-64 md:border-r border-white/5 md:bg-black/40 flex flex-col transition-transform duration-300
          ${showMobileList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="p-4 border-b border-white/5">
              <h2 className="text-sm font-black text-white uppercase italic tracking-tight mb-4">Intranet</h2>
              <button 
                onClick={() => setIsCreatingChannel(true)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase text-white transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                  <span className="text-lg leading-none">+</span> Crea tu Chat
              </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
              <p className="px-2 text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 mt-2">Temas Activos</p>
              {channels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => selectChannel(channel.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${activeChannelId === channel.id ? 'bg-rose-900/40 text-white font-bold shadow-lg border border-rose-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                      <div className="flex items-center gap-3 min-w-0">
                          <span className="opacity-50 text-sm">#</span>
                          <span className="truncate">{channel.name}</span>
                      </div>
                      
                      {isAdmin && !channel.isSystem && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span 
                                onClick={(e) => handleRenameChannel(e, channel.id)}
                                className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                                title="Renombrar"
                              >
                                ✏️
                              </span>
                              <span 
                                onClick={(e) => handleDeleteChannel(e, channel.id)}
                                className="p-1 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400"
                                title="Eliminar"
                              >
                                🗑️
                              </span>
                          </div>
                      )}
                  </button>
              ))}
              {channels.length === 0 && (
                  <div className="px-3 py-2 text-[10px] text-white/30 italic">Cargando temas...</div>
              )}
          </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-[#0a0a0a]">
        
        {/* Channel Header */}
        <div className="p-3 md:p-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-md flex items-center gap-3 z-10">
            {/* Mobile Back Button */}
            <button 
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-2 -ml-2 text-white/50 hover:text-white"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div>
                <h3 className="text-base md:text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                    <span className="text-rose-500">#</span> 
                    <span className="truncate max-w-[200px] md:max-w-none">
                        {channels.find(c => c.id === activeChannelId)?.name || 'General'}
                    </span>
                </h3>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4 z-10">
            {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-xs font-black uppercase tracking-widest">Tema nuevo</p>
                    <p className="text-[10px]">Sé el primero en hablar aquí.</p>
                </div>
            ) : (
                activeMessages.map((msg) => {
                    const isMe = msg.sender === currentUser;
                    const senderColor = getUserColor(msg.sender);
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase shrink-0 mt-1 shadow-lg ${senderColor} text-white`}>
                                {msg.sender.charAt(0)}
                            </div>
                            <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    {!isMe && <span className="text-[10px] font-bold text-white/50 uppercase">{msg.sender}</span>}
                                    <span className="text-[9px] text-white/20 font-mono">{formatTime(msg.timestamp)}</span>
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed shadow-md break-words ${
                                    isMe 
                                    ? 'bg-rose-700 text-white rounded-tr-sm' 
                                    : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/5'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-black border-t border-white/10 z-10 safe-area-bottom">
            <div className="relative flex gap-2">
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Mensaje...`}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 text-sm text-white focus:border-rose-500 focus:bg-white/10 outline-none transition-all placeholder:text-white/20"
                />
                <button 
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`absolute right-1 top-1 h-10 w-10 flex items-center justify-center rounded-lg transition-all ${
                        inputText.trim() ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-transparent text-white/10 cursor-default'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </div>
        </form>
      </div>

      {/* CREATE CHANNEL MODAL */}
      {isCreatingChannel && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-black text-white uppercase italic mb-4">Crear Nuevo Tema</h3>
                  <form onSubmit={handleCreateSubmit}>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Nombre del Tema</label>
                      <input 
                          autoFocus
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          placeholder="Ej: Salidas de fin de semana..."
                          className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm outline-none focus:border-rose-500 mb-4"
                      />
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setIsCreatingChannel(false)} className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white uppercase">Cancelar</button>
                          <button type="submit" disabled={!newChannelName.trim()} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-lg shadow-lg disabled:opacity-50">Crear</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default TeamChat;
