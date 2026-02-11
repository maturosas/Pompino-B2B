
export interface Lead {
  id: string;
  name: string;
  location: string;
  category: string;
  phone: string;
  email: string;
  whatsapp?: string;
  status: 'discovered' | 'qualified' | 'contacted' | 'closed';
  sourceUrl?: string;
  savedAt?: number;
  contactName?: string; 
  isClient?: boolean;   
  notes?: string;
  followUpDate?: string;
  // Campos para la Ficha Técnica (Ficha del Cliente)
  decisionMaker?: string;
  lastContactDate?: string;
  businessPotential?: 'low' | 'medium' | 'high';
  deliveryZone?: string;
  paymentTerms?: string;
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
