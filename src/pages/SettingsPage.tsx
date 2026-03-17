import React, { useState, useEffect } from 'react';
import { THEMES, TRANSLATIONS } from '../constants';
import { AppSettings, defaultSettings } from '../types';
import { 
  Palette, Globe, Cpu, Database, Check, Trash2, Download, Upload
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  usuario: any;
  t: any;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  settings, setSettings, t, usuario
}) => {
  const handleClearData = () => {
    if (window.confirm(t.clear + "?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = { ...localStorage };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkwell-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        window.location.reload();
      } catch (err) {
        alert("Erro ao importar dados.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 fade-in pb-20">
      <header>
        <h1 className="text-4xl font-bold mb-2">{t.settings}</h1>
        <p className="opacity-60">Personalize sua experiência de escrita</p>
      </header>

      {/* Appearance */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <Palette size={24} />
          <h2 className="text-2xl font-bold">{t.appearance}</h2>
        </div>
        
        <div className="inkwell-card space-y-8">
          <div>
            <p className="font-bold mb-4">{t.theme}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setSettings({ ...settings, theme: key })}
                  className={`
                    group relative p-3 rounded-xl border-2 transition-all text-left
                    ${settings.theme === key ? 'border-[var(--accent)]' : 'border-transparent bg-[var(--bg)]'}
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span className="text-xs font-bold truncate">{theme.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: theme.bg }} />
                    <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: theme.card }} />
                    <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: theme.text }} />
                  </div>
                  {settings.theme === key && (
                    <div className="absolute top-1 right-1 text-[var(--accent)]">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--bg)] rounded-xl">
            <div>
              <p className="font-bold">{t.compactMode}</p>
              <p className="text-sm opacity-60">Reduz o espaçamento entre elementos</p>
            </div>
            <button 
              onClick={() => setSettings({ ...settings, compactMode: !settings.compactMode })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.compactMode ? 'bg-[var(--accent)]' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.compactMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <Globe size={24} />
          <h2 className="text-2xl font-bold">{t.language}</h2>
        </div>
        
        <div className="inkwell-card">
          <div className="grid grid-cols-3 gap-4">
            {Object.keys(TRANSLATIONS).map((lang) => (
              <button
                key={lang}
                onClick={() => setSettings({ ...settings, language: lang as any })}
                className={`
                  p-4 rounded-xl border-2 transition-all font-bold
                  ${settings.language === lang ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] hover:border-[var(--accent)]'}
                `}
              >
                {lang === 'pt' ? 'Português' : lang === 'en' ? 'English' : 'Español'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Config */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <Cpu size={24} />
          <h2 className="text-2xl font-bold">{t.aiConfig}</h2>
        </div>
        
        <div className="inkwell-card space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold opacity-70">Gemini API Key</label>
            <input 
              type="password"
              value={settings.geminiKey}
              onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
              placeholder="Sua chave da API do Gemini"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold opacity-70">Image API Key (Opcional)</label>
            <input 
              type="password"
              value={settings.imageKey}
              onChange={(e) => setSettings({ ...settings, imageKey: e.target.value })}
              placeholder="Chave para geração de imagens"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[var(--bg)] rounded-xl">
            <p className="text-sm opacity-70">{t.aiKeyInfo}</p>
            <button className="inkwell-button whitespace-nowrap">{t.testConnection}</button>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <Database size={24} />
          <h2 className="text-2xl font-bold">{t.data}</h2>
        </div>
        
        <div className="inkwell-card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white transition-all font-bold"
          >
            <Download size={20} />
            {t.exportAll}
          </button>
          
          <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white transition-all font-bold cursor-pointer">
            <Upload size={20} />
            {t.import}
            <input type="file" className="hidden" onChange={handleImport} accept=".json" />
          </label>

          <button 
            onClick={handleClearData}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold"
          >
            <Trash2 size={20} />
            {t.clear}
          </button>
        </div>
      </section>
    </div>
  );
};
