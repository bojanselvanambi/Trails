'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Sparkles, Clock, ArrowRight, Paperclip, ImageIcon, FileText } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import { AVAILABLE_MODELS, VISION_MODELS, Attachment } from '@/types';
import { nanoid } from 'nanoid';

interface FloatingInputProps {
  onSubmit: (content: string, models: string[], attachments: Attachment[]) => void;
}

export default function FloatingInput({ onSubmit }: FloatingInputProps) {
  const [content, setContent] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings, apiKeys, lastUsedModelId, setLastUsedModelId, canvases, loadCanvas } = useCanvasStore();

  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize selected models from store, handling hydration
  useEffect(() => {
    setIsHydrated(true);
    if (lastUsedModelId && AVAILABLE_MODELS.find(m => m.id === lastUsedModelId)) {
      setSelectedModels([lastUsedModelId]);
    } else {
      setSelectedModels([AVAILABLE_MODELS[0].id]);
    }
  }, [lastUsedModelId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelSelector && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelSelector]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInternalSubmit();
    }
  };

  const handleInternalSubmit = () => {
    if (!content.trim() && attachments.length === 0) return;

    // Vision Check
    const hasImages = attachments.some(a => a.type === 'image');
    if (hasImages) {
        const unsupportedModels = selectedModels.filter(m => !VISION_MODELS.includes(m) && !m.startsWith('claude-3') && !m.startsWith('gemini'));
        if (unsupportedModels.length > 0) {
            const modelNames = unsupportedModels.map(id => AVAILABLE_MODELS.find(m => m.id === id)?.name || id).join(', ');
            setError(`The following models do not support images: ${modelNames}`);
            setTimeout(() => setError(null), 5000);
            return;
        }
    }

    onSubmit(content, selectedModels, attachments);
    setContent('');
    setAttachments([]);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const type = file.type.startsWith('image/') ? 'image' : 'file';
          setAttachments(prev => [...prev, {
            id: nanoid(),
            type,
            name: file.name,
            url: base64,
            mimeType: file.type
          }]);
        };
        reader.readAsDataURL(file);
      });
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const toggleModel = (modelId: string) => {
    setLastUsedModelId(modelId);
    if (settings.llmCouncil) {
        if (selectedModels.includes(modelId)) {
          if (selectedModels.length > 1) {
            setSelectedModels(selectedModels.filter(id => id !== modelId));
          }
        } else {
          setSelectedModels([...selectedModels, modelId]);
        }
    } else {
        setSelectedModels([modelId]);
        setShowModelSelector(false);
    }
  };

  // ... (visibleModels logic remains same)
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

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-500';
      case 'anthropic': return 'bg-purple-500';
      case 'google': return 'bg-blue-500';
      case 'mistral': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Sort canvases by recently updated
  const recentCanvases = [...canvases]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  if (!isHydrated) return null; // Prevent hydration mismatch

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Error Toast */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm font-medium animate-in slide-in-from-bottom-2">
            {error}
        </div>
      )}

      {/* Input Card */}
      <div className={`w-full ${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--node-bg)]'} border border-[var(--node-border)] rounded-xl shadow-2xl overflow-visible`}>
        {/* Header (Models) */}
        <div className="flex items-center gap-2 p-3 pb-0">
          {selectedModels.map(modelId => {
            const model = AVAILABLE_MODELS.find(m => m.id === modelId);
            return (
              <div key={modelId} className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-full border border-[var(--border-primary)]">
                <div className={`w-1.5 h-1.5 rounded-full ${getProviderColor(model?.provider || '')}`} />
                {model?.name}
                <button 
                  onClick={() => toggleModel(modelId)}
                  className="hover:text-[var(--text-primary)] transition-colors ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-secondary)] transition-colors"
            >
              <Plus size={14} />
            </button>

            {showModelSelector && (
              <div className={`absolute top-full left-0 mt-2 w-64 ${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} border border-[var(--border-primary)] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1 nopan nodrag`}>
                {finalVisibleModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                      selectedModels.includes(model.id) 
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' 
                        : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${getProviderColor(model.provider)}`} />
                    <div className="flex-1 truncate">{model.name}</div>
                    {selectedModels.includes(model.id) && settings.llmCouncil && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a prompt..."
            rows={1}
            className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-lg resize-none outline-none min-h-[48px] max-h-[200px]"
            style={{ height: 'auto', minHeight: '48px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map(att => (
                    <div key={att.id} className="relative group">
                        {att.type === 'image' ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-primary)]">
                                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center flex-col gap-1 text-[var(--text-secondary)]">
                                <FileText size={20} />
                                <span className="text-[10px] truncate w-full text-center px-1">{att.name}</span>
                            </div>
                        )}
                        <button 
                            onClick={() => removeAttachment(att.id)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={10} />
                        </button>
                    </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-3 pb-3">
             <div className="flex items-center gap-1">
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*,application/pdf,text/*"
                    onChange={handleFileSelect}
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                    title="Attach file"
                 >
                    <Paperclip size={18} />
                 </button>
             </div>
             <div className="text-[10px] text-[var(--text-tertiary)]">
                {settings.llmCouncil ? 'Council Mode Active' : `${selectedModels.length} Model${selectedModels.length > 1 ? 's' : ''} Selected`}
             </div>
        </div>
      </div>

      {/* Recent History Chips */}
      {recentCanvases.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {recentCanvases.map((canvas) => (
            <button
              key={canvas.id}
              onClick={() => loadCanvas(canvas.id)}
              className={`flex items-center gap-2 px-4 py-2 ${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--node-bg)]'} hover:bg-[var(--bg-tertiary)] border border-[var(--node-border)] hover:border-[var(--border-secondary)] rounded-full text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all group`}
            >
              <Clock size={14} className="group-hover:text-blue-400 transition-colors" />
              <span className="max-w-[200px] truncate">{canvas.name}</span>
              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
