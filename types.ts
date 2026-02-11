
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
  
  // Gestión de Tiempos y Acciones
  lastContactDate?: string; // Fecha de contacto (Automática)
  
  nextAction?: 'call' | 'whatsapp' | 'email' | 'visit' | 'quote' | 'offer' | 'sale'; // Próxima Acción
  nextActionDate?: string; // Fecha Próxima Acción
  
  priceList?: 'special' | 'wholesale' | 'discount_15' | 'regular'; // Lista de Precios
  
  // Campos Ficha Técnica (Legacy/Optional)
  decisionMaker?: string;
  businessPotential?: 'low' | 'medium' | 'high';
  deliveryZone?: string;
  paymentTerms?: string;
  followUpDate?: string; // Deprecated in favor of nextActionDate, but kept for compatibility
  
  // Multi-user ownership
  owner?: User; 
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

export type User = 'Mati' | 'Diego' | 'Gaston' | 'TESTER';

export interface OperationLog {
  id: string;
  user: User;
  action: 'SEARCH' | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'TRANSFER_REQUEST' | 'TRANSFER_ACCEPT';
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
