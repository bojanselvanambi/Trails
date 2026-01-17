'use client';

import { useState, useMemo } from 'react';
import { Search, X, MessageSquare, ArrowRight, FileText } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import { Canvas, TrailNode } from '@/types';

interface MemorySearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  canvasId: string;
  canvasName: string;
  nodeId: string;
  content: string;
  type: 'prompt' | 'response' | 'merge';
  date: number;
}

export default function MemorySearch({ isOpen, onClose }: MemorySearchProps) {
  const [query, setQuery] = useState('');
  const { canvases, loadCanvas, settings } = useCanvasStore();

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    const found: SearchResult[] = [];

    canvases.forEach((canvas) => {
      canvas.nodes.forEach((node) => {
        // Skip empty content
        if (!node.data.content) return;
        
        const content = node.data.content.toLowerCase();
        const matches = searchTerms.every((term) => content.includes(term));

        if (matches) {
          found.push({
            canvasId: canvas.id,
            canvasName: canvas.name,
            nodeId: node.id,
            content: node.data.content,
            type: node.data.type as 'prompt' | 'response' | 'merge',
            date: node.data.createdAt || 0,
          });
        }
      });
    });

    return found.sort((a, b) => b.date - a.date);
  }, [query, canvases]);

  const handleSelect = (canvasId: string, nodeId: string) => {
    loadCanvas(canvasId);
    onClose();
    // TODO: Ideally we would focus/center on the node, 
    // but ReactFlow state is local to Canvas component.
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 z-[100] animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl flex flex-col max-h-[70vh] rounded-xl shadow-2xl overflow-hidden ${
          settings.theme === 'acrylic' 
            ? 'acrylic-card border border-[var(--border-primary)]' 
            : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
        }`}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
          <Search className="text-[var(--text-tertiary)]" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Search through previous conversations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-lg"
          />
          <button 
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-[100px] p-2 bg-[var(--bg-primary)]/50">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
              {query.length > 0 ? (
                <>
                  <Search size={48} className="mb-4 opacity-20" />
                  <p>No matches found for "{query}"</p>
                </>
              ) : (
                <>
                  <MessageSquare size={48} className="mb-4 opacity-20" />
                  <p>Type to search across all your canvases</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-2 py-1 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result) => (
                <button
                  key={`${result.canvasId}-${result.nodeId}`}
                  onClick={() => handleSelect(result.canvasId, result.nodeId)}
                  className="w-full text-left p-3 rounded-lg hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-primary)] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <FileText size={12} />
                      <span className="font-medium text-[var(--text-secondary)]">{result.canvasName}</span>
                      <span>•</span>
                      <span className="capitalize">{result.type}</span>
                      <span>•</span>
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] transform group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] line-clamp-2 pl-5 border-l-2 border-[var(--border-secondary)] group-hover:border-blue-500/50 transition-colors">
                    {result.content}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)] flex justify-between">
            <span>Press <kbd className="bg-[var(--bg-primary)] px-1 rounded border border-[var(--border-primary)]">Esc</kbd> to close</span>
            <span>{canvases.length} Canvases indexed</span>
        </div>
      </div>
    </div>
  );
}
