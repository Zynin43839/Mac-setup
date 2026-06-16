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

// ── Working Station Types ──

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  description: string;
  department: Department;
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  targetDate: string;
  completedDate?: string;
  progress: number;
  lead: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  module: string;
  quarter: string;
  year: number;
  department: Department;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  featureIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BriefingItem {
  id: string;
  category: 'news' | 'competitor' | 'tech';
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  tags: string[];
}

export type WorkingTab = 'dashboard' | 'upload' | 'history' | 'projects' | 'roadmap' | 'briefing' | 'jira' | 'assistant' | 'settings';
