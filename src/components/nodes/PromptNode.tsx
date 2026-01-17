'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Send, ChevronDown, Loader2, X, Plus, FileText } from 'lucide-react';
import { PromptNodeData, AVAILABLE_MODELS, VISION_MODELS, Attachment } from '@/types';
import { useCanvasStore } from '@/store/canvas';

function PromptNode({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as PromptNodeData;
  const [content, setContent] = useState(nodeData.content);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    updateNodeContent, 
    updateNodeStatus, 
    addResponseNode, 
    nodes, 
    apiKeys, 
    buildContextForNode, 
    settings,
    lastUsedModelId,
    setLastUsedModelId
  } = useCanvasStore();

  const [selectedModels, setSelectedModels] = useState<string[]>([
    nodeData.model || (lastUsedModelId && AVAILABLE_MODELS.find(m => m.id === lastUsedModelId) ? lastUsedModelId : AVAILABLE_MODELS[0].id)
  ]);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(48, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelSelect && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelSelect]);

  // Filter models logic...
  const visibleModels = settings.showAllModels 
    ? AVAILABLE_MODELS 
    : AVAILABLE_MODELS.filter(m => {
        if (m.provider === 'openai') return !!apiKeys.openai;
        if (m.provider === 'anthropic') return !!apiKeys.anthropic;
        if (m.provider === 'google') return !!apiKeys.google;
        if (m.provider === 'mistral') return !!apiKeys.mistral;
        if (m.provider === 'groq') return !!apiKeys.groq;
        if (m.provider === 'openrouter') return !!apiKeys.openrouter;
        if (m.provider === 'ollama') return true; 
        return false;
      });
      
  const finalVisibleModels = visibleModels.length > 0 ? visibleModels : AVAILABLE_MODELS.filter(m => ['gpt-4o', 'claude-3-5-sonnet-20241022'].includes(m.id));

  const toggleModel = (modelId: string) => {
    setLastUsedModelId(modelId);
    
    if (settings.llmCouncil) {
      if (selectedModels.includes(modelId)) {
        if (selectedModels.length > 1) {
          setSelectedModels(prev => prev.filter(id => id !== modelId));
        }
      } else {
        setSelectedModels(prev => [...prev, modelId]);
      }
    } else {
      setSelectedModels([modelId]);
      setShowModelSelect(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if ((!content.trim() && (!nodeData.attachments || nodeData.attachments.length === 0)) || isSubmitting) return;

    // Vision Check
    const hasImages = nodeData.attachments?.some(a => a.type === 'image');
    if (hasImages) {
        const unsupportedModels = selectedModels.filter(m => !VISION_MODELS.includes(m) && !m.startsWith('claude-3') && !m.startsWith('gemini'));
        if (unsupportedModels.length > 0) {
            const modelNames = unsupportedModels.map(id => AVAILABLE_MODELS.find(m => m.id === id)?.name || id).join(', ');
            setError(`Models lack vision support: ${modelNames}`);
            setTimeout(() => setError(null), 5000);
            return;
        }
    }

    setIsSubmitting(true);
    setError(null);
    updateNodeContent(id, content);
    updateNodeStatus(id, 'loading');

    try {
      const context = buildContextForNode(id);
      
      // Prepare current message with attachments
      let currentMessageContent: any = content;
      if (nodeData.attachments && nodeData.attachments.length > 0) {
          currentMessageContent = [{ type: 'text', text: content }];
          nodeData.attachments.forEach(att => {
              if (att.type === 'image') {
                  currentMessageContent.push({ type: 'image', image: att.url });
              }
          });
      }

      const messages = [...context, { role: 'user' as const, content: currentMessageContent }];

      const fetchResponse = async (modelId: string) => {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, model: modelId, apiKeys }),
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
      };

      if (settings.llmCouncil && selectedModels.length > 1) {
        const results = await Promise.allSettled(selectedModels.map(m => fetchResponse(m)));
        const successfulResponses = results
          .map((r, i) => r.status === 'fulfilled' ? { model: selectedModels[i], content: r.value.content } : null)
          .filter(Boolean) as { model: string, content: string }[];

        if (successfulResponses.length === 0) throw new Error("All models failed.");

        const aggregatedContent = successfulResponses.map(r => {
            const modelName = AVAILABLE_MODELS.find(m => m.id === r.model)?.name || r.model;
            return `### ${modelName}\n${r.content}`;
        }).join('\n\n---\n\n');

        const responsePosition = {
          x: (nodes.find((n) => n.id === id)?.position.x || 0),
          y: (nodes.find((n) => n.id === id)?.position.y || 0) + 250,
        };

        addResponseNode(id, aggregatedContent, selectedModels[0], responsePosition);

      } else {
        await Promise.all(selectedModels.map(async (modelId, index) => {
            const result = await fetchResponse(modelId);
            const responsePosition = {
                x: (nodes.find((n) => n.id === id)?.position.x || 0) + (index * 450),
                y: (nodes.find((n) => n.id === id)?.position.y || 0) + 250,
            };
            addResponseNode(id, result.content, modelId, responsePosition);
        }));
      }

      updateNodeStatus(id, 'complete');
    } catch (error) {
      console.error('Error:', error);
      updateNodeStatus(id, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, selectedModels, id, isSubmitting, updateNodeContent, updateNodeStatus, addResponseNode, nodes, apiKeys, buildContextForNode, settings.llmCouncil]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-500';
      case 'anthropic': return 'bg-purple-500';
      case 'google': return 'bg-blue-500';
      case 'mistral': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getNodeClasses = () => {
    const baseClasses = "relative border transition-all w-[600px] group flex flex-col rounded-xl overflow-visible";
    const themeClasses = settings.theme === 'acrylic' ? 'acrylic-node' : '';
    const selectedClasses = selected 
      ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
      : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]';
    const bgClasses = settings.theme === 'acrylic' 
      ? '' 
      : `bg-[var(--node-bg)]`;
    
    return `${baseClasses} ${themeClasses} ${selectedClasses} ${bgClasses}`;
  };

  return (
    <div className={getNodeClasses()}>
      <Handle type="target" position={Position.Top} className="!bg-[var(--text-tertiary)] !w-3 !h-3 !border-[var(--bg-secondary)]" />
      
      {/* Header Pill Style */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <div className="flex flex-wrap gap-2">
            {selectedModels.map(modelId => {
                const m = AVAILABLE_MODELS.find(am => am.id === modelId);
                return (
                    <div key={modelId} className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full px-3 py-1 text-xs text-[var(--text-secondary)]">
                        <div className={`w-1.5 h-1.5 rounded-full ${getProviderColor(m?.provider || '')}`} />
                        <span className="font-medium">{m?.name}</span>
                        {selectedModels.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); toggleModel(modelId); }} className="hover:text-[var(--text-primary)] ml-1">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                );
            })}
            
            <div className="relative nodrag" ref={dropdownRef}>
                <button
                    onClick={() => setShowModelSelect(!showModelSelect)}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-secondary)] transition-colors"
                >
                    <Plus size={14} />
                </button>
                
                {showModelSelect && (
                    <div className={`absolute left-0 top-full mt-2 w-64 ${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} border border-[var(--border-primary)] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1 nopan nodrag`}>
                    {finalVisibleModels.map((m) => (
                        <button
                        key={m.id}
                        onClick={() => toggleModel(m.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                            selectedModels.includes(m.id) 
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' 
                                : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                        >
                        <div className={`w-2 h-2 rounded-full ${getProviderColor(m.provider)}`} />
                        <div className="flex-1 truncate">{m.name}</div>
                        {selectedModels.includes(m.id) && settings.llmCouncil && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </button>
                    ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Error Toast inside Node */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-500 rounded text-xs">
            {error}
        </div>
      )}

      {/* Attachments Display */}
      {nodeData.attachments && nodeData.attachments.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
            {nodeData.attachments.map(att => (
                <div key={att.id} className="relative group">
                    {att.type === 'image' ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-primary)] cursor-pointer hover:scale-105 transition-transform" title={att.name}>
                            <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center flex-col gap-1 text-[var(--text-secondary)]" title={att.name}>
                            <FileText size={20} />
                            <span className="text-[10px] truncate w-full text-center px-1">{att.name}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-2 pt-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a prompt..."
          className="w-full bg-transparent text-[var(--text-primary)] text-base resize-none outline-none placeholder-[var(--text-tertiary)] font-sans nopan nodrag leading-relaxed overflow-hidden min-h-[48px]"
          rows={1}
        />
      </div>

      {/* Footer Send Button */}
      {content.trim() && (
        <div className="flex justify-end px-4 pb-4 bg-transparent shrink-0 animate-in fade-in slide-in-from-top-1 duration-200">
            <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 ${
              settings.theme === 'light' 
                ? 'bg-black text-white hover:bg-zinc-800' 
                : 'bg-white text-black hover:bg-zinc-200'
            } disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] px-4 py-1.5 rounded-full text-sm font-semibold transition-colors`}
            >
            {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <>
                <Send size={16} />
                Send
                </>
            )}
            </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--text-tertiary)] !w-3 !h-3 !border-[var(--bg-secondary)]" />
    </div>
  );
}

export default memo(PromptNode);
