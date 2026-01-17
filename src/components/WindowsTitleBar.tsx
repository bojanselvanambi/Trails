'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';

interface WindowsTitleBarProps {
  onToggleSidebar: () => void;
  title: string;
  onRename: (newTitle: string) => void;
}

export default function WindowsTitleBar({ onToggleSidebar, title, onRename }: WindowsTitleBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const { settings } = useCanvasStore();

  useEffect(() => {
    // Update native window controls to match theme
    if (typeof window !== 'undefined' && (window as any).electron) {
      // Light theme uses dark symbols, Dark/Acrylic themes use light symbols
      const symbolColor = settings.theme === 'light' ? '#0f172a' : '#fafafa';
      
      (window as any).electron.ipcRenderer.send('update-titlebar-overlay', {
        color: '#00000000', // Always transparent to let React background show through
        symbolColor: symbolColor
      });
    }
  }, [settings.theme]);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editTitle.trim()) {
      onRename(editTitle);
    } else {
      setEditTitle(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className={`h-[32px] ${settings.theme === 'acrylic' ? 'bg-transparent' : 'bg-[var(--bg-primary)]'} flex items-center justify-between select-none border-b border-[var(--border-primary)] w-full z-50`}>
      {/* Left: Menu & Drag Region */}
      <div className="flex items-center h-full">
        {/* Menu Button - No Drag */}
        <button 
          onClick={onToggleSidebar}
          className="h-full px-3 hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors app-region-no-drag flex items-center justify-center"
        >
          <Menu size={16} />
        </button>
        
        {/* Drag Region Spacer */}
        <div className="w-4 h-full app-region-drag" />
      </div>

      {/* Center: Title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-full app-region-no-drag max-w-[400px]">
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} text-[var(--text-primary)] text-xs text-center px-2 py-0.5 rounded border border-[var(--border-primary)] outline-none w-[200px]`}
          />
        ) : (
          <span 
            onDoubleClick={() => setIsEditing(true)}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-text font-medium truncate max-w-[300px]"
          >
            {title}
          </span>
        )}
      </div>

      {/* Right: Drag Region (Window Controls are overlayed by Electron here) */}
      <div className="flex-1 h-full app-region-drag" />
    </div>
  );
}
