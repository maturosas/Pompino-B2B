
export interface Lead {
  id: string;
  name: string;
  location: string;
  category: string;
  phone: string;
  email: string;
  website?: string;
  instagram?: string;
  whatsapp?: string; // Nuevo: Para links directos
  status: 'discovered' | 'qualified' | 'contacted' | 'closed';
  sourceUrl?: string;
  savedAt?: number;
  contactName?: string; 
  isClient?: boolean;   
  notes?: string;
  followUpDate?: string;
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
