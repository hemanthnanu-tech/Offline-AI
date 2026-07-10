export interface GGUFMetadata {
  magic: string;
  version: number;
  tensorCount: number;
  metadataKVCount: number;
  properties: Record<string, any>;
  tensors: Array<{
    name: string;
    type: string;
    dimensions: number[];
    offset: number;
  }>;
}

export interface GGUFModelInfo {
  name: string;
  architecture?: string;
  quantization?: string;
  contextLength?: number;
  parameters?: string;
  fileSize?: string;
  fileName?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  tokensPerSecond?: number;
  images?: string[];
  thoughtProcess?: string;
  isThinking?: boolean;
  generationStats?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    tokensPerSecond: number;
    totalTimeMs: number;
  };
  loadingProgress?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  modelName: string;
}

export type InferenceEngine = 'local-webgpu' | 'server-assisted';

export interface ModelPreset {
  icon?: any;
  category?: string;
  prompt?: string;
  description?: string;
  id: string;
  name: string;
  architecture: string;
  quantization: string;
  parameters: string;
  contextLength: number;
  fileSize: string;
  recommended: boolean;
}

export interface InferenceSettings {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  contextSize: number;
  repeatPenalty: number;
  systemPrompt: string;
  engine: InferenceEngine;
  allocVramMb: number;
  floatPrecision: 'float16' | 'float32';
  appearance: 'system' | 'light' | 'dark';
  contrast: 'system' | 'high' | 'standard';
  accentColor: string;
  language: string;
  enableDictation: boolean;
  separateVoice: boolean;
  userName: string;
  assistantName: string;
  userDob: string;
  userDetails: string;
  useGPU: boolean;
  autoScroll: boolean;
}
