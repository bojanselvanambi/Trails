import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { 
  TrailNode, 
  TrailEdge, 
  Canvas, 
  APIKeys, 
  Attachment,
  TrailNodeData, 
  AVAILABLE_MODELS, 
  Persona,
  AppSettings 
} from '@/types';

// Helper to define message content structure for AI SDK
type MessageContentPart = 
  | { type: 'text'; text: string }
  | { type: 'image'; image: string };

type MessageContent = string | MessageContentPart[];

interface CanvasStore {
  // Current canvas state
  currentCanvasId: string | null;
  canvases: Canvas[];
  nodes: TrailNode[];
  edges: TrailEdge[];
  
  // API Keys
  apiKeys: APIKeys;
  
  // Settings & Personas
  settings: AppSettings;
  personas: Persona[];
  lastUsedModelId: string | null;
  
  // Selected nodes for merging
  selectedNodeIds: string[];
  
  // Actions
  setApiKeys: (keys: APIKeys) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setLastUsedModelId: (id: string) => void;
  
  // Persona Actions
  addPersona: (persona: Omit<Persona, 'id'>) => void;
  updatePersona: (id: string, persona: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  
  createCanvas: (name: string) => string;
  loadCanvas: (id: string) => void;
  deleteCanvas: (id: string) => void;
  renameCanvas: (id: string, name: string) => void;
  saveCurrentCanvas: () => void;
  unloadCanvas: () => void; // Go back to empty state
  
  // Node operations
  addPromptNode: (content: string, model: string, position: { x: number; y: number }, parentId?: string, personaId?: string, attachments?: Attachment[]) => string;
  addResponseNode: (promptId: string, content: string, model: string, position: { x: number; y: number }) => string;
  updateNodeContent: (id: string, content: string) => void;
  updateNodeStatus: (id: string, status: TrailNodeData['status']) => void;
  deleteNode: (id: string) => void;
  hideNode: (id: string, hidden: boolean) => void;
  
  // Branch operations
  forkFromNode: (nodeId: string, newPrompt: string, model: string) => string;
  mergeNodes: (nodeIds: string[], mergedContent: string) => string;
  
  // React Flow handlers
  onNodesChange: (changes: NodeChange<TrailNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<TrailEdge>[]) => void;
  
  // Selection
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Context building
  buildContextForNode: (nodeId: string) => { role: 'user' | 'assistant' | 'system'; content: MessageContent }[];
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'acrylic',
  showAllModels: false,
  llmCouncil: false,
  memorySearch: false,
  panningSpeed: 1.0,
};

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      currentCanvasId: null,
      canvases: [],
      nodes: [],
      edges: [],
      apiKeys: {},
      settings: DEFAULT_SETTINGS,
      personas: [],
      lastUsedModelId: null,
      selectedNodeIds: [],

      setApiKeys: (keys) => set({ apiKeys: keys }),
      
      updateSettings: (newSettings) => 
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      setLastUsedModelId: (id) => set({ lastUsedModelId: id }),

      addPersona: (persona) => 
        set((state) => ({ 
          personas: [...state.personas, { ...persona, id: nanoid() }] 
        })),
        
      updatePersona: (id, updatedPersona) =>
        set((state) => ({
          personas: state.personas.map((p) => 
            p.id === id ? { ...p, ...updatedPersona } : p
          ),
        })),
        
      deletePersona: (id) =>
        set((state) => ({
          personas: state.personas.filter((p) => p.id !== id),
        })),

      createCanvas: (name) => {
        const id = nanoid();
        const canvas: Canvas = {
          id,
          name,
          nodes: [],
          edges: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          canvases: [...state.canvases, canvas],
          currentCanvasId: id,
          nodes: [],
          edges: [],
        }));
        return id;
      },

      loadCanvas: (id) => {
        const canvas = get().canvases.find((c) => c.id === id);
        if (canvas) {
          set({
            currentCanvasId: id,
            nodes: canvas.nodes,
            edges: canvas.edges,
          });
        }
      },

      unloadCanvas: () => {
        set({
          currentCanvasId: null,
          nodes: [],
          edges: [],
        });
      },

      deleteCanvas: (id) => {
        set((state) => ({
          canvases: state.canvases.filter((c) => c.id !== id),
          currentCanvasId: state.currentCanvasId === id ? null : state.currentCanvasId,
          nodes: state.currentCanvasId === id ? [] : state.nodes,
          edges: state.currentCanvasId === id ? [] : state.edges,
        }));
      },

      renameCanvas: (id, name) => {
        set((state) => ({
          canvases: state.canvases.map((c) =>
            c.id === id ? { ...c, name, updatedAt: Date.now() } : c
          ),
        }));
      },

      saveCurrentCanvas: () => {
        const { currentCanvasId, nodes, edges, canvases } = get();
        if (!currentCanvasId) return;
        
        set({
          canvases: canvases.map((c) =>
            c.id === currentCanvasId
              ? { ...c, nodes, edges, updatedAt: Date.now() }
              : c
          ),
        });
      },

      addPromptNode: (content, model, position, parentId, personaId, attachments) => {
        const id = nanoid();
        const newNode: TrailNode = {
          id,
          type: 'prompt',
          position,
          data: {
            id,
            type: 'prompt',
            content,
            attachments,
            model,
            status: 'idle',
            parentId,
            personaId,
            createdAt: Date.now(),
          },
        };

        const newEdges: TrailEdge[] = [];
        if (parentId) {
          newEdges.push({
            id: `e-${parentId}-${id}`,
            source: parentId,
            target: id,
            type: 'smoothstep',
            animated: true,
          });
        }

        set((state) => ({
          nodes: [...state.nodes, newNode],
          edges: [...state.edges, ...newEdges],
        }));

        get().saveCurrentCanvas();
        return id;
      },

      addResponseNode: (promptId, content, model, position) => {
        const id = nanoid();
        const newNode: TrailNode = {
          id,
          type: 'response',
          position,
          data: {
            id,
            type: 'response',
            content,
            model,
            promptId,
            status: 'complete',
            createdAt: Date.now(),
          },
        };

        const newEdge: TrailEdge = {
          id: `e-${promptId}-${id}`,
          source: promptId,
          target: id,
          type: 'smoothstep',
          animated: false,
        };

        set((state) => ({
          nodes: [...state.nodes, newNode],
          edges: [...state.edges, newEdge],
        }));

        get().saveCurrentCanvas();
        return id;
      },

      updateNodeContent: (id, content) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, content } } : n
          ),
        }));
        get().saveCurrentCanvas();
      },

      updateNodeStatus: (id, status) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, status } } : n
          ),
        }));
      },

      deleteNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        }));
        get().saveCurrentCanvas();
      },

      hideNode: (id, hidden) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, hidden } } : n
          ),
        }));
        get().saveCurrentCanvas();
      },

      forkFromNode: (nodeId, newPrompt, model) => {
        const sourceNode = get().nodes.find((n) => n.id === nodeId);
        if (!sourceNode) return '';

        const position = {
          x: sourceNode.position.x + 400,
          y: sourceNode.position.y + 100,
        };

        return get().addPromptNode(newPrompt, model, position, nodeId);
      },

      mergeNodes: (nodeIds, mergedContent) => {
        const id = nanoid();
        const sourceNodes = get().nodes.filter((n) => nodeIds.includes(n.id));
        
        if (sourceNodes.length === 0) return '';

        // Calculate position as center of source nodes
        const avgX = sourceNodes.reduce((sum, n) => sum + n.position.x, 0) / sourceNodes.length;
        const avgY = Math.max(...sourceNodes.map((n) => n.position.y)) + 200;

        const newNode: TrailNode = {
          id,
          type: 'merge',
          position: { x: avgX, y: avgY },
          data: {
            id,
            type: 'merge',
            content: mergedContent,
            sourceIds: nodeIds,
            status: 'complete',
            createdAt: Date.now(),
          },
        };

        const newEdges: TrailEdge[] = nodeIds.map((sourceId) => ({
          id: `e-${sourceId}-${id}`,
          source: sourceId,
          target: id,
          type: 'smoothstep',
          style: { stroke: '#8b5cf6' },
        }));

        set((state) => ({
          nodes: [...state.nodes, newNode],
          edges: [...state.edges, ...newEdges],
          selectedNodeIds: [],
        }));

        get().saveCurrentCanvas();
        return id;
      },

      onNodesChange: (changes) => {
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
        }));
      },

      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        }));
      },

      toggleNodeSelection: (id) => {
        set((state) => ({
          selectedNodeIds: state.selectedNodeIds.includes(id)
            ? state.selectedNodeIds.filter((nid) => nid !== id)
            : [...state.selectedNodeIds, id],
        }));
      },

      clearSelection: () => set({ selectedNodeIds: [] }),

      buildContextForNode: (nodeId) => {
        const { nodes, edges, personas } = get();
        const messages: { role: 'user' | 'assistant' | 'system'; content: MessageContent }[] = [];
        
        // Build path from root to this node
        const buildPath = (currentId: string, visited: Set<string> = new Set()): string[] => {
          if (visited.has(currentId)) return [];
          visited.add(currentId);
          
          const incomingEdge = edges.find((e) => e.target === currentId);
          if (!incomingEdge) return [currentId];
          
          return [...buildPath(incomingEdge.source, visited), currentId];
        };

        const path = buildPath(nodeId);
        
        // Check for persona on the first prompt in the chain
        if (path.length > 0) {
          const firstNode = nodes.find(n => n.id === path[0]);
          if (firstNode?.data.type === 'prompt' && firstNode.data.personaId) {
             const persona = personas.find(p => p.id === firstNode.data.personaId);
             if (persona) {
               messages.push({ role: 'system', content: persona.content });
             }
          }
        }

        for (const nid of path) {
          const node = nodes.find((n) => n.id === nid);
          if (!node || node.data.hidden) continue;

          if (node.data.type === 'prompt') {
            const promptData = node.data as any; // Cast for attachments access
            if (promptData.attachments && promptData.attachments.length > 0) {
              const content: MessageContentPart[] = [{ type: 'text', text: promptData.content }];
              
              // Add images
              promptData.attachments.forEach((att: Attachment) => {
                if (att.type === 'image') {
                  content.push({ type: 'image', image: att.url });
                }
                // TODO: Handle file attachments (text extraction?) for now only images supported by API
              });
              
              messages.push({ role: 'user', content });
            } else {
              messages.push({ role: 'user', content: node.data.content });
            }
          } else if (node.data.type === 'response') {
            messages.push({ role: 'assistant', content: node.data.content });
          } else if (node.data.type === 'merge') {
            messages.push({ role: 'assistant', content: node.data.content });
          }
        }

        return messages;
      },
    }),
    {
      name: 'trails-storage',
      partialize: (state) => ({
        canvases: state.canvases,
        apiKeys: state.apiKeys,
        settings: state.settings,
        personas: state.personas,
        lastUsedModelId: state.lastUsedModelId,
      }),
    }
  )
);
