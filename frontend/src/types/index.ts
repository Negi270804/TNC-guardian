export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AnalysisRecord {
  id: string;
  document_title: string;
  source_type: 'URL' | 'Text' | 'PDF' | 'Image' | 'Video';
  source_url?: string;
  risk_score?: number;
  risk_classification?: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  created_at: string;
  completed_at?: string;
}
