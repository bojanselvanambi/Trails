import { Node, Edge } from '@xyflow/react';

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral' | 'ollama' | 'openrouter' | 'cerebras';

export interface LLMModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  contextWindow?: number;
}

export const VISION_MODELS = [
  'gpt-4o', 
  'gpt-4o-mini',
  'claude-3-5-sonnet-20241022', 
  'claude-3-opus-20240229',
  'gemini-2.0-flash', 
  'gemini-1.5-pro',
  'google/gemini-pro-1.5',
  'anthropic/claude-3-opus'
];

export const AVAILABLE_MODELS: LLMModel[] = [
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Most capable OpenAI model' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Fast and affordable' },
  
  // Anthropic
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Best for coding' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most powerful Claude' },
  
  // Google
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Fast Gemini model' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'Advanced reasoning' },
  
  // Cerebras
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B (Cerebras)', provider: 'cerebras', description: 'Fastest Llama 3.3 inference' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B (Cerebras)', provider: 'cerebras', description: 'Fast Llama 3.1 inference' },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B (Cerebras)', provider: 'cerebras', description: 'Extremely fast small model' },

  // Groq
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'groq', description: 'Fast open source on Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', description: 'High performance mixture' },
  
  // Mistral
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', description: 'Flagship Mistral model' },
  { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', description: 'Cost-efficient' },
  
  // Ollama (Local) - These are common defaults, user can add more
  { id: 'llama3', name: 'Llama 3 (Local)', provider: 'ollama', description: 'Local Llama 3' },
  { id: 'mistral', name: 'Mistral (Local)', provider: 'ollama', description: 'Local Mistral' },
  { id: 'phi3', name: 'Phi 3 (Local)', provider: 'ollama', description: 'Microsoft Phi 3' },

  // OpenRouter (Generic)
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (OR)', provider: 'openrouter', description: 'Via OpenRouter' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (OR)', provider: 'openrouter', description: 'Via OpenRouter' },
];

export interface Persona {
  id: string;
  name: string;
  content: string;
  description?: string;
  color?: string;
}

export type ThemeMode = 'light' | 'dark' | 'acrylic';

export interface AppSettings {
  theme: ThemeMode;
  showAllModels: boolean;
  llmCouncil: boolean;
  memorySearch: boolean;
  panningSpeed: number;
}

export type NodeStatus = 'idle' | 'loading' | 'complete' | 'error' | 'hidden';

export interface BaseNodeData {
  id: string;
  status: NodeStatus;
  hidden?: boolean;
  createdAt: number;
  [key: string]: unknown;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url: string; // Base64 data URL
  mimeType: string;
}

export interface PromptNodeData extends BaseNodeData {
  type: 'prompt';
  content: string;
  attachments?: Attachment[];
  model: string;
  personaId?: string;
  parentId?: string;
}

export interface ResponseNodeData extends BaseNodeData {
  type: 'response';
  content: string;
  model: string;
  promptId: string;
  error?: string;
}

export interface MergeNodeData extends BaseNodeData {
  type: 'merge';
  content: string;
  sourceIds: string[];
}

export type TrailNodeData = PromptNodeData | ResponseNodeData | MergeNodeData;

export type TrailNode = Node<TrailNodeData>;
export type TrailEdge = Edge;

export interface Canvas {
  id: string;
  name: string;
  nodes: TrailNode[];
  edges: TrailEdge[];
  createdAt: number;
  updatedAt: number;
}

export interface APIKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  groq?: string;
  mistral?: string;
  openrouter?: string;
  cerebras?: string;
  ollama?: string; // Base URL, default http://localhost:11434
}
