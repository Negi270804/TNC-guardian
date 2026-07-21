export interface User {
  id: string;
  email: string;
  plan_tier: 'Free' | 'Pro' | 'Business';
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
