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
  isCodex?: boolean;
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
  maxTokens: number;
  repeatPenalty: number;
  systemPrompt: string;
  engine: InferenceEngine;
  codexEnabled: boolean;
  allocVramMb: number;
  floatPrecision: 'float16' | 'float32';
  appearance: 'system' | 'light' | 'dark';
  contrast: 'system' | 'high' | 'standard';
  accentColor: 'blue' | 'purple' | 'teal' | 'green';
  language: string;
  enableDictation: boolean;
  separateVoice: boolean;
  userName: string;
  userDob: string;
  userDetails: string;
}

