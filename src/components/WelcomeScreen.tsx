'use client';

import { Plus, Zap, FolderOpen, Key } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';

interface WelcomeScreenProps {
  onCreateCanvas: () => void;
  onOpenSettings: () => void;
}

export default function WelcomeScreen({ onCreateCanvas, onOpenSettings }: WelcomeScreenProps) {
  const { canvases, loadCanvas } = useCanvasStore();

  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950">
      <div className="max-w-2xl w-full mx-4 text-center">
        {/* Logo */}
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Trails
          </span>
        </h1>
        <p className="text-xl text-zinc-400 mb-8">
          A visual, branchable, parallel canvas for exploring ideas with AI
        </p>

        {/* Quick Start */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={onCreateCanvas}
            className="flex items-center gap-4 bg-blue-600 hover:bg-blue-500 p-6 rounded-xl text-left transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <div>
              <div className="font-semibold text-lg">New Canvas</div>
              <div className="text-blue-200 text-sm">Start a fresh exploration</div>
            </div>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-6 rounded-xl text-left transition-colors group"
          >
            <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Key size={24} />
            </div>
            <div>
              <div className="font-semibold text-lg">Configure API Keys</div>
              <div className="text-zinc-400 text-sm">OpenAI, Anthropic, Google</div>
            </div>
          </button>
        </div>

        {/* Recent Canvases */}
        {canvases.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
              <FolderOpen size={16} />
              Recent Canvases
            </div>
            <div className="space-y-2">
              {canvases.slice(0, 5).map((canvas) => (
                <button
                  key={canvas.id}
                  onClick={() => loadCanvas(canvas.id)}
                  className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-lg transition-colors text-left"
                >
                  <span className="font-medium">{canvas.name}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(canvas.updatedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-center text-sm text-zinc-500">
          <div className="flex flex-col items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            <span>Parallel Prompts</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 9h4v2H8V9z" />
            </svg>
            <span>Branch & Fork</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
            </svg>
            <span>Merge Responses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
