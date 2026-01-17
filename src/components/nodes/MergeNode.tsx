'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Merge, Copy, Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MergeNodeData } from '@/types';
import { useCanvasStore } from '@/store/canvas';

function MergeNode({ data, id }: NodeProps) {
  const nodeData = data as unknown as MergeNodeData;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(nodeData.content);

  const { deleteNode, updateNodeContent } = useCanvasStore();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(nodeData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    updateNodeContent(id, editContent);
    setIsEditing(false);
  };

  return (
    <div className="bg-zinc-900 border border-purple-500/50 rounded-xl shadow-xl min-w-[400px] max-w-[500px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-purple-500/10">
        <div className="flex items-center gap-2">
          <Merge size={14} className="text-purple-400" />
          <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Merged</span>
          <span className="text-xs text-zinc-500">({nodeData.sourceIds.length} sources)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 transition-colors"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-sm text-zinc-100 resize-none outline-none focus:border-purple-500 min-h-[200px]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="prose prose-sm prose-invert max-w-none max-h-[400px] overflow-y-auto cursor-pointer hover:bg-zinc-800/50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {nodeData.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-zinc-700 bg-zinc-800/50 rounded-b-xl">
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1.5 rounded-lg transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => deleteNode(id)}
          className="flex items-center gap-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-2 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
}

export default memo(MergeNode);
