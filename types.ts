
export interface Lead {
  id: string;
  name: string; // Cuenta
  location: string;
  category: string;
  phone: string;
  email: string;
  whatsapp?: string;
  status: 'frio' | 'contacted' | 'negotiation' | 'client';
  sourceUrl?: string;
  savedAt?: number;
  contactName?: string; // POC
  isClient?: boolean;   
  notes?: string; // Comentarios
  
  // Geo
  coordinates?: {
      lat: number;
      lng: number;
  };
  
  // Gestión de Tiempos y Acciones
  lastContactDate?: string; // Fecha de contacto (Automática) - Se usa como FECHA DE CIERRE si status es client
  
  nextAction?: 'call' | 'whatsapp' | 'email' | 'visit' | 'quote' | 'offer' | 'sale'; // Próxima Acción
  nextActionDate?: string; // Fecha Próxima Acción
  
  priceList?: 'special' | 'wholesale' | 'discount_15' | 'regular'; // Lista de Precios
  
  // Venta y Bono
  saleValue?: number; // Valor de la primera venta en ARS
  
  // Campos Ficha Técnica (Legacy/Optional)
  decisionMaker?: string;
  businessPotential?: 'low' | 'medium' | 'high';
  deliveryZone?: string;
  paymentTerms?: string;
  followUpDate?: string; // Deprecated in favor of nextActionDate, but kept for compatibility
  
  // Multi-user ownership
  owner?: string; // Changed from literal union to string to support config file
}

export interface PipelineState {
  leads: Lead[];
  isSearching: boolean;
  error: string | null;
  currentStep: 'idle' | 'searching' | 'scrapping' | 'structuring' | 'done';
}

export interface CRMState {
  savedLeads: Lead[];
}

export type User = string; // Changed to string to allow dynamic users from projectConfig

export interface OperationLog {
  id: string;
  user: User;
  action: 'SEARCH' | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'TRANSFER_REQUEST' | 'TRANSFER_ACCEPT' | 'LOGIN' | 'LOGOUT' | 'ADMIN_ASSIGN';
  details: string;
  timestamp: number;
}

export interface TransferRequest {
  id: string;
  leadId: string;
  leadName: string;
  fromUser: User; // Quien pide
  toUser: User;   // Dueño actual
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  createdBy: string;
  isSystem: boolean; // true for default channels
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: User;
  timestamp: number;
  type: 'text' | 'system'; 
  channelId?: string; // Optional for backward compatibility (defaults to 'general')
}

export interface DirectTask {
  id: string;
  fromUser: User;
  toUser: User;
  message: string;
  status: 'pending' | 'completed';
  createdAt: number;
  completedAt?: number;
}
