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
  
  // Extended OCR fields
  processing_status: string;
  text_extracted: boolean;
  extracted_text?: string;
  page_count?: number | null;
  word_count?: number | null;
  processing_started_at?: string;
  processing_completed_at?: string;

  // Analysis reference
  analysis?: {
    id: string;
    overall_risk_score: number;
    processing_time: number;
    provider: string;
    model_name: string;
    created_at: string;
  } | null;
}

export interface AnalysisItem {
  id: string;
  analysis_id: string;
  title: string;
  category: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  original_text: string;
  suggestion: string;
  created_at: string;
}

export interface Analysis {
  id: string;
  document_id: string;
  overall_risk_score: number;
  summary: string;
  recommendations: string;
  processing_time: number;
  provider: string;
  model_name: string;
  created_at: string;
  items: AnalysisItem[];
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
