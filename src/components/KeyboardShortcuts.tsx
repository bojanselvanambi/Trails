'use client';

import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Ctrl', 'Enter'], description: 'Send prompt' },
  { keys: ['Ctrl', 'S'], description: 'Save canvas' },
  { keys: ['Ctrl', 'N'], description: 'New prompt node' },
  { keys: ['Ctrl', 'Shift', 'N'], description: 'New canvas' },
  { keys: ['Delete'], description: 'Delete selected node' },
  { keys: ['Escape'], description: 'Clear selection / Close dialogs' },
  { keys: ['Ctrl', 'A'], description: 'Select all nodes' },
  { keys: ['Ctrl', '+'], description: 'Zoom in' },
  { keys: ['Ctrl', '-'], description: 'Zoom out' },
  { keys: ['Ctrl', '0'], description: 'Reset zoom' },
];

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Keyboard size={20} className="text-zinc-400" />
            Keyboard Shortcuts
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-zinc-300 text-sm">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i}>
                    <kbd className="bg-zinc-800 border border-zinc-600 px-2 py-1 rounded text-xs font-mono">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className="text-zinc-500 mx-1">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 text-center">
            Press <kbd className="bg-zinc-800 border border-zinc-600 px-1 rounded text-xs">?</kbd> anytime to show shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}
