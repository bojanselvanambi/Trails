'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Eye, EyeOff, Trash2, Copy, Check, ChevronDown, ChevronUp, MessageSquarePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResponseNodeData, AVAILABLE_MODELS } from '@/types';
import { useCanvasStore } from '@/store/canvas';

function ResponseNode({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as ResponseNodeData;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { deleteNode, hideNode, forkFromNode, toggleNodeSelection, selectedNodeIds, settings } = useCanvasStore();

  const isSelected = selectedNodeIds.includes(id); 
  const isActive = selected; 
  
  const modelInfo = AVAILABLE_MODELS.find((m) => m.id === nodeData.model);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(nodeData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAsk = () => {
    forkFromNode(id, '', nodeData.model);
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
    const baseClasses = "relative border transition-all w-[600px] group flex flex-col rounded-xl";
    const themeClasses = settings.theme === 'acrylic' ? 'acrylic-node' : '';
    const selectedClasses = isActive 
      ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
      : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]';
    const bgClasses = settings.theme === 'acrylic' 
      ? '' 
      : `bg-[var(--node-bg)]`;
    const hiddenClasses = nodeData.hidden ? 'opacity-50' : '';
    const ringClasses = isSelected ? 'ring-1 ring-blue-500' : '';
    
    return `${baseClasses} ${themeClasses} ${selectedClasses} ${bgClasses} ${hiddenClasses} ${ringClasses}`;
  };

  return (
    <div 
      className={getNodeClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--text-tertiary)] !w-3 !h-3 !border-[var(--bg-secondary)]" />
      
      {/* Header Pill Style */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full px-3 py-1 text-xs text-[var(--text-secondary)]">
            <div className={`w-1.5 h-1.5 rounded-full ${getProviderColor(modelInfo?.provider || '')}`} />
            <span className="font-medium">{modelInfo?.name || nodeData.model}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button
            onClick={() => toggleNodeSelection(id)}
            className={`p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors ${
              isSelected ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)]' : 'text-[var(--text-tertiary)]'
            }`}
            title="Select for merge"
          >
            <Check size={14} />
          </button>
          
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            title="Copy content"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>

          <button
            onClick={() => hideNode(id, !nodeData.hidden)}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            title={nodeData.hidden ? 'Show in context' : 'Hide from context'}
          >
            {nodeData.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>

          <button
            onClick={() => deleteNode(id)}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 pt-1 relative">
          <div className="nopan nodrag prose prose-sm max-w-none leading-relaxed text-[var(--text-secondary)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {nodeData.content}
            </ReactMarkdown>
          </div>
          
          {/* Ask Button Overlay */}
          <div className={`absolute bottom-[-16px] left-1/2 -translate-x-1/2 transition-all duration-200 transform z-10 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-10px] pointer-events-none'
          }`}>
            <button
              onClick={handleAsk}
              className={`flex items-center gap-2 ${
                settings.theme === 'light' 
                  ? 'bg-black text-white hover:bg-zinc-800 border border-zinc-800' 
                  : 'bg-white text-black hover:bg-zinc-200 border border-zinc-200'
              } px-4 py-1.5 rounded-full text-xs font-bold shadow-lg transition-colors`}
            >
              <MessageSquarePlus size={14} />
              Ask
            </button>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--text-tertiary)] !w-3 !h-3 !border-[var(--bg-secondary)]" />
    </div>
  );
}

export default memo(ResponseNode);
