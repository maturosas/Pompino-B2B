
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types';
import { getUserColor, getUserNames } from '../projectConfig';

interface TeamChatProps {
  messages: ChatMessage[];
  currentUser: User;
  onSendMessage: (text: string) => void;
}

const TeamChat: React.FC<TeamChatProps> = ({ messages, currentUser, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const teamMembers = getUserNames();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
      
      {/* Background FX */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-md flex justify-between items-center z-10">
          <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></span>
                  Sala de Situación
              </h2>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-5">Chat de Equipo Encriptado • Live</p>
          </div>
          <div className="hidden md:flex -space-x-2">
              {teamMembers.map((u) => (
                  <div key={u} className={`w-8 h-8 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-black uppercase ${getUserColor(u)} text-white`} title={u}>
                      {u.charAt(0)}
                  </div>
              ))}
          </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6 space-y-4 z-10">
          {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-xs font-black uppercase tracking-widest">El canal está en silencio</p>
                  <p className="text-[10px]">Sé el primero en reportar novedades.</p>
              </div>
          ) : (
              messages.map((msg) => {
                  const isMe = msg.sender === currentUser;
                  const senderColor = getUserColor(msg.sender);
                  return (
                      <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase shrink-0 mt-1 shadow-lg ${senderColor} text-white`}>
                              {msg.sender.charAt(0)}
                          </div>
                          <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 mb-1 px-1">
                                  {!isMe && <span className="text-[10px] font-bold text-white/50 uppercase">{msg.sender}</span>}
                                  <span className="text-[9px] text-white/20 font-mono">{formatTime(msg.timestamp)}</span>
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed shadow-md break-words ${
                                  isMe 
                                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
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
      <form onSubmit={handleSend} className="p-3 md:p-4 bg-black border-t border-white/10 z-10">
          <div className="relative flex gap-2">
              <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribir mensaje al equipo..."
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 text-sm text-white focus:border-indigo-500 focus:bg-white/10 outline-none transition-all placeholder:text-white/20"
              />
              <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`absolute right-1 top-1 h-10 w-10 flex items-center justify-center rounded-lg transition-all ${
                      inputText.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-transparent text-white/10 cursor-default'
                  }`}
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
          </div>
      </form>
    </div>
  );
};

export default TeamChat;
