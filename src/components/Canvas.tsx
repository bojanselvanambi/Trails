'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  OnConnectEnd,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Plus, 
  Merge, 
  Settings as SettingsIcon, 
  Search, 
  HelpCircle,
  History,
  Trash2,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import PromptNode from './nodes/PromptNode';
import ResponseNode from './nodes/ResponseNode';
import MergeNodeComponent from './nodes/MergeNode';
import FloatingInput from './FloatingInput';
import SettingsDialog from './SettingsDialog';
import KeyboardShortcuts from './KeyboardShortcuts';
import WindowsTitleBar from './WindowsTitleBar';
import MemorySearch from './MemorySearch';
import { AVAILABLE_MODELS, Attachment } from '@/types';

const nodeTypes = {
  prompt: PromptNode,
  response: ResponseNode,
  merge: MergeNodeComponent,
};

  // Initial Floating Input Submission
  const handleFloatingSubmit = async (content: string, models: string[], attachments: Attachment[] = []) => {
    let canvasId = currentCanvasId;
    
    // If no canvas, create one first
    if (!canvasId) {
      // Generate a title from the prompt (first few words)
      const title = content.split(' ').slice(0, 4).join(' ') + (content.length > 30 ? '...' : '');
      canvasId = createCanvas(title || 'New Exploration');
    } else if (currentCanvas?.name === 'New Exploration' && nodes.length === 0) {
      // Auto-rename if it's the first prompt on a generic named canvas
      const title = content.split(' ').slice(0, 4).join(' ') + (content.length > 30 ? '...' : '');
      renameCanvas(canvasId, title);
    }

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    
    // Check for Council Mode (Ensemble)
    const { settings } = useCanvasStore.getState();

    // Prepare message content (handle attachments)
    let messageContent: any = content;
    if (attachments.length > 0) {
        messageContent = [{ type: 'text', text: content }];
        attachments.forEach(att => {
            if (att.type === 'image') {
                messageContent.push({ type: 'image', image: att.url });
            }
        });
    }

    if (settings.llmCouncil && models.length > 1) {
      // 1. Create SINGLE Prompt Node
      const position = screenToFlowPosition({
        x: startX,
        y: startY - 200,
      });
      
      const promptId = addPromptNode(content, models[0], position, undefined, undefined, attachments);
      
      setTimeout(() => fitView({ duration: 800 }), 100);
      updateNodeStatus(promptId, 'loading');

      try {
        const promises = models.map(async (modelId) => {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: messageContent }],
              model: modelId,
              apiKeys,
            }),
          });

          if (!response.ok) throw new Error(await response.text());
          const result = await response.json();
          return { model: modelId, content: result.content };
        });

        const results = await Promise.all(promises);

        const aggregatedContent = results.map(r => {
            const modelName = AVAILABLE_MODELS.find(m => m.id === r.model)?.name || r.model;
            return `### ${modelName}\n${r.content}`;
        }).join('\n\n---\n\n');

        const responsePosition = { x: position.x, y: position.y + 250 };
        addResponseNode(promptId, aggregatedContent, models[0], responsePosition);
        updateNodeStatus(promptId, 'complete');

      } catch (error) {
        console.error('Error:', error);
        updateNodeStatus(promptId, 'error');
      }

    } else {
      // Standard / Parallel (Separate Nodes)
      const promptNodes = models.map((model, index) => {
        const offsetX = models.length > 1 ? (index - (models.length - 1) / 2) * 450 : 0;
        const position = screenToFlowPosition({
          x: startX + offsetX,
          y: startY - 200, 
        });
        return {
          id: addPromptNode(content, model, position, undefined, undefined, attachments),
          model,
          position
        };
      });

      setTimeout(() => fitView({ duration: 800 }), 100);

      const promises = promptNodes.map(async (node) => {
        updateNodeStatus(node.id, 'loading');
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: messageContent }],
              model: node.model,
              apiKeys,
            }),
          });

          if (!response.ok) throw new Error(await response.text());
          const result = await response.json();
          
          const responsePosition = { x: node.position.x, y: node.position.y + 250 };
          addResponseNode(node.id, result.content, node.model, responsePosition);
          updateNodeStatus(node.id, 'complete');
        } catch (error) {
          console.error('Error:', error);
          updateNodeStatus(node.id, 'error');
        }
      });

      await Promise.all(promises);
    }
  };

function CanvasFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMemorySearch, setShowMemorySearch] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeContent, setMergeContent] = useState('');

  // Store
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addPromptNode,
    addResponseNode,
    updateNodeStatus,
    selectedNodeIds,
    clearSelection,
    mergeNodes,
    apiKeys,
    currentCanvasId,
    canvases,
    createCanvas,
    loadCanvas,
    deleteCanvas,
    renameCanvas,
    saveCurrentCanvas,
    settings,
  } = useCanvasStore();

  const currentCanvas = canvases.find((c) => c.id === currentCanvasId);

  // Initial Floating Input Submission
  const handleFloatingSubmit = async (content: string, models: string[]) => {
    let canvasId = currentCanvasId;
    
    // If no canvas, create one first
    if (!canvasId) {
      // Generate a title from the prompt (first few words)
      const title = content.split(' ').slice(0, 4).join(' ') + (content.length > 30 ? '...' : '');
      canvasId = createCanvas(title || 'New Exploration');
    } else if (currentCanvas?.name === 'New Exploration' && nodes.length === 0) {
      // Auto-rename if it's the first prompt on a generic named canvas
      const title = content.split(' ').slice(0, 4).join(' ') + (content.length > 30 ? '...' : '');
      renameCanvas(canvasId, title);
    }

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    
    // Check for Council Mode (Ensemble)
    const { settings } = useCanvasStore.getState();

    if (settings.llmCouncil && models.length > 1) {
      // 1. Create SINGLE Prompt Node
      const position = screenToFlowPosition({
        x: startX,
        y: startY - 200,
      });
      
      const promptId = addPromptNode(content, models[0], position);
      
      setTimeout(() => fitView({ duration: 800 }), 100);
      updateNodeStatus(promptId, 'loading');

      try {
        const promises = models.map(async (modelId) => {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content }],
              model: modelId,
              apiKeys,
            }),
          });

          if (!response.ok) throw new Error(await response.text());
          const result = await response.json();
          return { model: modelId, content: result.content };
        });

        const results = await Promise.all(promises);

        const aggregatedContent = results.map(r => {
            const modelName = AVAILABLE_MODELS.find(m => m.id === r.model)?.name || r.model;
            return `### ${modelName}\n${r.content}`;
        }).join('\n\n---\n\n');

        const responsePosition = { x: position.x, y: position.y + 250 };
        addResponseNode(promptId, aggregatedContent, models[0], responsePosition);
        updateNodeStatus(promptId, 'complete');

      } catch (error) {
        console.error('Error:', error);
        updateNodeStatus(promptId, 'error');
      }

    } else {
      // Standard / Parallel (Separate Nodes)
      const promptNodes = models.map((model, index) => {
        const offsetX = models.length > 1 ? (index - (models.length - 1) / 2) * 450 : 0;
        const position = screenToFlowPosition({
          x: startX + offsetX,
          y: startY - 200, 
        });
        return {
          id: addPromptNode(content, model, position),
          model,
          position
        };
      });

      setTimeout(() => fitView({ duration: 800 }), 100);

      const promises = promptNodes.map(async (node) => {
        updateNodeStatus(node.id, 'loading');
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content }],
              model: node.model,
              apiKeys,
            }),
          });

          if (!response.ok) throw new Error(await response.text());
          const result = await response.json();
          
          const responsePosition = { x: node.position.x, y: node.position.y + 250 };
          addResponseNode(node.id, result.content, node.model, responsePosition);
          updateNodeStatus(node.id, 'complete');
        } catch (error) {
          console.error('Error:', error);
          updateNodeStatus(node.id, 'error');
        }
      });

      await Promise.all(promises);
    }
  };

  const handleMerge = () => {
    if (selectedNodeIds.length < 2) return;
    
    const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
    const contents = selectedNodes
      .map((n) => {
        if (n.data.type === 'response' || n.data.type === 'merge') {
          return `### From ${n.data.type === 'response' ? 'Response' : 'Merge'} Node:\n${n.data.content}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
    
    setMergeContent(contents);
    setShowMergeDialog(true);
  };

  const handleConfirmMerge = () => {
    mergeNodes(selectedNodeIds, mergeContent);
    setShowMergeDialog(false);
    setMergeContent('');
  };

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid && connectionState.fromNode && reactFlowWrapper.current) {
        const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : (event as MouseEvent);
        const position = screenToFlowPosition({ x: clientX, y: clientY });
        position.x -= 200;
        position.y -= 50; 

        const sourceNode = nodes.find(n => n.id === connectionState.fromNode?.id);
        const defaultModel = sourceNode?.data.model as string || AVAILABLE_MODELS[0].id;

        addPromptNode('', defaultModel, position, connectionState.fromNode.id);
      }
    },
    [screenToFlowPosition, addPromptNode, nodes]
  );

  return (
    <div className={`flex flex-col h-screen ${settings.theme === 'acrylic' ? 'bg-transparent' : 'bg-[var(--bg-primary)]'} text-[var(--text-primary)] overflow-hidden`}>
      {/* Windows Title Bar */}
      <WindowsTitleBar 
        onToggleSidebar={() => setShowSidebar(!showSidebar)} 
        title={currentCanvas?.name || 'New Exploration'}
        onRename={(newTitle) => currentCanvasId && renameCanvas(currentCanvasId, newTitle)}
      />

      <div className="flex-1 relative flex overflow-hidden">
        {/* Sidebar Overlay */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/10 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-[32px] bottom-0 w-64 ${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} backdrop-blur-xl border-r border-[var(--border-primary)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4">
            <button 
              onClick={() => {
                createCanvas('New Exploration');
                setShowSidebar(false);
              }}
              className={`w-full flex items-center gap-2 ${
                settings.theme === 'light' 
                  ? 'bg-black/90 text-white hover:bg-black' 
                  : 'bg-zinc-100/90 text-zinc-900 hover:bg-white'
              } px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm`}
            >
              <Plus size={16} />
              New Canvas
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            <div className="text-xs font-medium text-[var(--text-tertiary)] px-3 py-2 uppercase tracking-wider">History</div>
            {canvases.map((c) => (
              <div 
                key={c.id} 
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentCanvasId === c.id 
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' 
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
                onClick={() => {
                  loadCanvas(c.id);
                  setShowSidebar(false);
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <History size={14} />
                  <span className="text-sm truncate">{c.name}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Delete canvas?')) deleteCanvas(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-red-400 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className={`p-2 border-t border-[var(--border-primary)] space-y-1 ${settings.theme === 'acrylic' ? 'bg-transparent' : 'bg-[var(--bg-primary)]'}`}>
            <button 
              onClick={() => { setShowMemorySearch(true); setShowSidebar(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Search size={16} />
              Memory Search
            </button>
            <button 
              onClick={() => { setShowSettings(true); setShowSidebar(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <SettingsIcon size={16} />
              Settings
            </button>
            <button 
              onClick={() => { setShowShortcuts(true); setShowSidebar(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <HelpCircle size={16} />
              Shortcuts
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnectEnd={onConnectEnd}
            nodeTypes={nodeTypes}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            proOptions={{ hideAttribution: true }}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(var(--text-tertiary-rgb), 0.15)" />
            <Controls className={`!${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} !border-[var(--border-primary)] !backdrop-blur-md !rounded-lg [&>button]:!bg-transparent [&>button]:!border-[var(--border-primary)] [&>button]:hover:!bg-[var(--bg-tertiary)] [&>button>svg]:!fill-[var(--text-tertiary)]`} />
            <MiniMap 
              className={`!${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} !border-[var(--border-primary)] !backdrop-blur-md !rounded-lg !mb-8 !mr-8`}
              nodeColor={(n) => {
                if (n.type === 'prompt') return '#3b82f6';
                if (n.type === 'response') return '#10b981';
                return '#8b5cf6';
              }}
              maskColor="rgba(0, 0, 0, 0.3)"
            />

            {/* Selection Actions Panel */}
            {selectedNodeIds.length > 0 && (
              <Panel position="bottom-center" className="mb-8">
                <div className={`flex items-center gap-2 ${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} backdrop-blur-md border border-[var(--border-primary)] rounded-full px-4 py-2 shadow-xl animate-in slide-in-from-bottom-4`}>
                  <span className="text-sm text-[var(--text-tertiary)]">{selectedNodeIds.length} selected</span>
                  <div className="w-px h-4 bg-[var(--border-primary)] mx-2" />
                  {selectedNodeIds.length >= 2 && (
                    <button
                      onClick={handleMerge}
                      className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Merge size={14} />
                      Merge
                    </button>
                  )}
                  <button
                    onClick={clearSelection}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors ml-2"
                  >
                    Clear
                  </button>
                </div>
              </Panel>
            )}
          </ReactFlow>

          {/* Empty State / Floating Input */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="pointer-events-auto w-full">
                <FloatingInput onSubmit={handleFloatingSubmit} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <MemorySearch isOpen={showMemorySearch} onClose={() => setShowMemorySearch(false)} />
      
      {/* Merge Dialog */}
      {showMergeDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-zinc-100">
              <Merge size={20} className="text-purple-400" />
              Merge {selectedNodeIds.length} Nodes
            </h2>
            <textarea
              value={mergeContent}
              onChange={(e) => setMergeContent(e.target.value)}
              className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-sm resize-none outline-none focus:border-purple-500 min-h-[300px] text-zinc-200 placeholder-zinc-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowMergeDialog(false); setMergeContent(''); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMerge}
                className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              >
                Create Merge Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  );
}
