export interface Meeting {
  id: string;
  title: string;
  department: string;
  departments: Department[];
  date: string;
  transcript: string;
  summary: string;
  actionItems: string[];
  duration: number; // seconds
  status: 'recording' | 'transcribing' | 'summarizing' | 'completed';
  provider: STTProvider;
  fileName?: string;
  fileSize?: number;
}

export interface AnalysisItem {
  category: string;
  tech: string;
  pros: string[];
  cons: string[];
  recommendation: string;
  icon: string;
}

export interface Tab {
  id: string;
  label: string;
  icon: string;
}

export type Department = 'Engineering' | 'Marketing' | 'Sales' | 'HR' | 'Finance' | 'Operations' | 'All';

export type STTProvider = 'local' | 'openai' | 'google' | 'assemblyai' | 'deepgram';
export type SummProvider = 'local' | 'local-ai';

export interface LocalAISettings {
  endpoint: string;
  model: string;
}

export interface STTSettings {
  provider: STTProvider;
  apiKeys: {
    openai?: string;
    google?: string;
    assemblyai?: string;
    deepgram?: string;
    claude?: string;
  };
  localWhisper: {
    model: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    language: string;
  };
  summarization: {
    enabled: boolean;
    provider: SummProvider;
    localAI: LocalAISettings;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  meetingId?: string;
}

export interface ProviderInfo {
  id: STTProvider;
  name: string;
  description: string;
  pricing: string;
  requiresKey: boolean;
  features: string[];
  icon: string;
}

export interface WhisperModel {
  name: string;
  file: string;
  size: number;
  downloaded: boolean;
  url: string;
}
