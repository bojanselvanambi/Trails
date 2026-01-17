'use client';

import { useState } from 'react';
import { X, Settings, User, Moon, Sun, Layers, Users, Search, Move, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas';
import { AppSettings, Persona, ThemeMode } from '@/types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'settings' | 'apikeys' | 'personas';

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const { 
    apiKeys, 
    setApiKeys, 
    settings, 
    updateSettings,
    personas,
    addPersona,
    updatePersona,
    deletePersona
  } = useCanvasStore();

  const [editingPersona, setEditingPersona] = useState<Partial<Persona> | null>(null);

  if (!isOpen) return null;

  const Toggle = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string; 
    description: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
  }) => (
    <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
      <div>
        <div className="font-medium text-[var(--text-primary)]">{label}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-emerald-500' : 'bg-[var(--border-secondary)]'
        }`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  );

  const ThemeSelector = ({ 
    currentTheme, 
    onChange 
  }: { 
    currentTheme: ThemeMode; 
    onChange: (theme: ThemeMode) => void; 
  }) => {
    const themes: { value: ThemeMode; label: string; description: string; icon: React.ReactNode }[] = [
      { 
        value: 'light', 
        label: 'Light', 
        description: 'Clean, bright interface', 
        icon: <Sun size={16} /> 
      },
      { 
        value: 'dark', 
        label: 'Dark', 
        description: 'Classic dark theme', 
        icon: <Moon size={16} /> 
      },
      { 
        value: 'acrylic', 
        label: 'Acrylic', 
        description: 'Microsoft Fluent blur effect', 
        icon: <Layers size={16} /> 
      },
    ];

    return (
      <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
        <div className="font-medium text-[var(--text-primary)] mb-3">Theme</div>
        <div className="text-xs text-[var(--text-tertiary)] mb-3">Choose your preferred visual style</div>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => onChange(theme.value)}
              className={`p-3 rounded-lg border transition-all ${
                currentTheme === theme.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {theme.icon}
                <div className="text-sm font-medium">{theme.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${settings.theme === 'acrylic' ? 'acrylic-card' : 'bg-[var(--bg-secondary)]'} border border-[var(--border-primary)] rounded-xl w-full max-w-2xl h-[600px] flex overflow-hidden shadow-2xl`}>
        {/* Sidebar */}
        <div className="w-48 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col p-4 gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] px-2 mb-2">Configuration</h2>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'settings' 
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' 
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={() => setActiveTab('apikeys')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'apikeys' 
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' 
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <Layers size={16} />
            API Keys
          </button>
          
          <button
            onClick={() => setActiveTab('personas')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'personas' 
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' 
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <User size={16} />
            Personas
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              {activeTab === 'settings' && 'Global Settings'}
              {activeTab === 'apikeys' && 'API Configuration'}
              {activeTab === 'personas' && 'Manage Personas'}
            </h3>
            <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Application</h4>
                  
                  <ThemeSelector
                    currentTheme={settings.theme}
                    onChange={(theme) => updateSettings({ theme })}
                  />
                  
                  <Toggle
                    label="Show All Models"
                    description="Display all available models in the selector"
                    checked={settings.showAllModels}
                    onChange={(v) => updateSettings({ showAllModels: v })}
                  />
                  <Toggle
                    label="LLM Council"
                    description="Enable models to vote on each other's responses (Ensemble)"
                    checked={settings.llmCouncil}
                    onChange={(v) => updateSettings({ llmCouncil: v })}
                  />
                   <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] opacity-60">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">Memory Search</div>
                      <div className="text-xs text-[var(--text-tertiary)]">Search through previous conversations (coming soon)</div>
                    </div>
                    <div className="w-12 h-6 rounded-full bg-[var(--border-secondary)] relative">
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[var(--text-tertiary)]" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-[var(--text-primary)]">Panning Speed</div>
                      <div className="text-sm text-[var(--text-secondary)]">{settings.panningSpeed}x</div>
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mb-3">Adjust scroll panning sensitivity on the canvas</div>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={settings.panningSpeed}
                      onChange={(e) => updateSettings({ panningSpeed: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500 h-1 bg-[var(--border-secondary)] rounded-full appearance-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'apikeys' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Provider Keys</h4>
                <div className="space-y-3">
                  {['openai', 'anthropic', 'google', 'mistral', 'groq', 'cerebras', 'openrouter'].map((provider) => (
                    <div key={provider}>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-1 capitalize">{provider}</label>
                      <input
                        type="password"
                        value={apiKeys[provider as keyof typeof apiKeys] || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, [provider]: e.target.value })}
                        placeholder={`Enter ${provider} API key...`}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-emerald-500 placeholder-[var(--text-tertiary)]"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Ollama Base URL</label>
                    <input
                      type="text"
                      value={apiKeys.ollama || ''}
                      onChange={(e) => setApiKeys({ ...apiKeys, ollama: e.target.value })}
                      placeholder="http://localhost:11434/v1"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-emerald-500 placeholder-[var(--text-tertiary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'personas' && (
              <div className="space-y-4">
                {!editingPersona ? (
                  <>
                    <button
                      onClick={() => setEditingPersona({ name: '', content: '' })}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-secondary)] transition-colors"
                    >
                      <Plus size={16} />
                      Create New Persona
                    </button>

                    <div className="grid gap-3">
                      {personas.map((persona) => (
                        <div key={persona.id} className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] flex items-start justify-between group">
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{persona.name}</div>
                            <div className="text-xs text-[var(--text-tertiary)] line-clamp-2 mt-1">{persona.content}</div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingPersona(persona)}
                              className="p-1.5 text-[var(--text-tertiary)] hover:text-blue-400 rounded hover:bg-[var(--bg-secondary)]"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deletePersona(persona.id)}
                              className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 rounded hover:bg-[var(--bg-secondary)]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-1">Name</label>
                      <input
                        value={editingPersona.name}
                        onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })}
                        placeholder="e.g. Coding Expert"
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-1">System Prompt</label>
                      <textarea
                        value={editingPersona.content}
                        onChange={(e) => setEditingPersona({ ...editingPersona, content: e.target.value })}
                        placeholder="You are an expert..."
                        rows={6}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setEditingPersona(null)}
                        className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (editingPersona.name && editingPersona.content) {
                            if ('id' in editingPersona && editingPersona.id) {
                              updatePersona(editingPersona.id, editingPersona);
                            } else {
                              addPersona(editingPersona as any);
                            }
                            setEditingPersona(null);
                          }
                        }}
                        disabled={!editingPersona.name || !editingPersona.content}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ml-auto"
                      >
                        Save Persona
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
