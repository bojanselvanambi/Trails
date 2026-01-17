'use client';

import { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/types';
import { useCanvasStore } from '@/store/canvas';

interface ParallelPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function ParallelPromptDialog({ isOpen, onClose, position }: ParallelPromptDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([AVAILABLE_MODELS[0].id]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addPromptNode, addResponseNode, apiKeys, updateNodeStatus } = useCanvasStore();

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;

    setIsSubmitting(true);

    // Create prompt nodes for each selected model
    const promptNodes = selectedModels.map((model, index) => {
      const nodePosition = {
        x: position.x + index * 450,
        y: position.y,
      };
      return {
        id: addPromptNode(prompt, model, nodePosition),
        model,
        position: nodePosition,
      };
    });

    // Send all requests in parallel
    const promises = promptNodes.map(async (node) => {
      updateNodeStatus(node.id, 'loading');
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: node.model,
            apiKeys,
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const result = await response.json();
        
        const responsePosition = {
          x: node.position.x,
          y: node.position.y + 250,
        };

        addResponseNode(node.id, result.content, node.model, responsePosition);
        updateNodeStatus(node.id, 'complete');
      } catch (error) {
        console.error('Error:', error);
        updateNodeStatus(node.id, 'error');
      }
    });

    await Promise.all(promises);
    
    setIsSubmitting(false);
    setPrompt('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Parallel Prompt
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-zinc-400 mb-4">
          Send the same prompt to multiple models simultaneously and compare their responses.
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg p-4 text-sm resize-none outline-none focus:border-blue-500 min-h-[120px] mb-4"
        />

        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">Select Models</label>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
                  selectedModels.includes(model.id)
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  selectedModels.includes(model.id) ? 'bg-blue-500' : 'bg-zinc-700'
                }`}>
                  {selectedModels.includes(model.id) && <Check size={14} />}
                </div>
                <div>
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className="text-xs text-zinc-500">{model.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !prompt.trim() || selectedModels.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isSubmitting ? (
              <>Sending to {selectedModels.length} models...</>
            ) : (
              <>
                <Zap size={16} />
                Send to {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
