export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  company?: string;
  designation?: string;
  bio?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Document {
  id: string;
  user_id: string;
  original_filename: string;
  stored_filename: string;
  file_type: string;
  file_size: number;
  upload_status: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
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
