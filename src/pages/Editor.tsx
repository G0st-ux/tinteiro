import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Story, AppSettings } from '../types';
import { 
  Save, ArrowLeft, Trash2, Zap, Maximize2, Minimize2, 
  Layout, Type, Eye, Bold, Italic, Strikethrough, 
  Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote as QuoteIcon, Minus, Image as ImageIcon, 
  Copy, Plus, Loader2, Sparkles, X, Check, Menu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CATEGORIES } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface EditorProps {
  stories: Story[];
  setStories: (s: Story[]) => void;
  settings: AppSettings;
  t: any;
}

type ViewMode = 'split' | 'write' | 'preview';

export const Editor: React.FC<EditorProps> = ({ stories, setStories, settings, t }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const storyId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // AI Panel State
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (storyId) {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        setTitle(story.title);
        setContent(story.content);
        setCategory(story.category || 'other');
        setLastSaved(story.updatedAt);
      }
    } else {
      setTitle('');
      setContent('');
      setCategory('other');
      setLastSaved(null);
    }
  }, [storyId, stories]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFocusMode]);

  // Statistics
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);
  const paragraphCount = content.split(/\n\s*\n/).filter(Boolean).length;

  const handleSave = () => {
    const now = Date.now();
    const newStory: Story = {
      id: storyId || Math.random().toString(36).substr(2, 9),
      title: title || "Sem título",
      content,
      category,
      createdAt: stories.find(s => s.id === storyId)?.createdAt || now,
      updatedAt: now,
      charCount,
      wordCount
    };

    if (storyId) {
      setStories(stories.map(s => s.id === storyId ? newStory : s));
    } else {
      setStories([...stories, newStory]);
      navigate(`/editor?id=${newStory.id}`, { replace: true });
    }
    setLastSaved(now);
  };

  const handleNew = () => {
    if (content.trim()) {
      if (!window.confirm("Você tem alterações não salvas. Deseja criar uma nova história mesmo assim?")) {
        return;
      }
    }
    
    // Navigate to clear the URL ID, useEffect will handle the reset
    navigate('/editor');
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setStories(stories.filter(s => s.id !== storyId));
    setShowDeleteConfirm(false);
    navigate('/library');
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleAiAction = async (action: 'continue' | 'review' | 'summarize' | 'rewrite') => {
    if (!content.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiAction(action);
    setAiPanelOpen(true);
    setAiResult('');

    try {
      const apiKey = settings.geminiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key não configurada");

      const ai = new GoogleGenAI({ apiKey });
      
      let prompt = "";
      switch(action) {
        case 'continue': prompt = `Continue esta história de forma criativa e fluida:\n\n${content}`; break;
        case 'review': prompt = `Revise este texto, corrigindo gramática e sugerindo melhorias de estilo:\n\n${content}`; break;
        case 'summarize': prompt = `Resuma esta história em um parágrafo envolvente:\n\n${content}`; break;
        case 'rewrite': prompt = `Reescreva este texto com um tom mais dramático e descritivo:\n\n${content}`; break;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Você é um editor literário experiente e um mestre contador de histórias."
        }
      });

      setAiResult(response.text || "");
    } catch (error) {
      console.error(error);
      setAiResult("Erro ao processar com IA. Verifique sua API Key.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (aiAction === 'continue') {
      setContent(prev => prev + "\n\n" + aiResult);
    } else {
      setContent(aiResult);
    }
    setAiPanelOpen(false);
  };

  return (
    <div className={`h-full flex flex-col gap-4 fade-in ${isFocusMode ? 'focus-mode-active' : ''}`}>
      {/* Top Bar */}
      {!isFocusMode && (
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button onClick={() => navigate('/library')} className="p-2 hover:bg-[var(--bg)] rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="relative flex flex-col items-center gap-1">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors" title="Menu">
                <Menu size={20} />
              </button>
              <button onClick={() => setAiPanelOpen(true)} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors" title="Abrir Painel IA">
                <Zap size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50 p-4 space-y-4">
                  {/* Formatting */}
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-[var(--bg)] rounded-lg" title="Negrito"><Bold size={16} /></button>
                    <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-[var(--bg)] rounded-lg" title="Itálico"><Italic size={16} /></button>
                    <button onClick={() => insertText('# ')} className="p-2 hover:bg-[var(--bg)] rounded-lg" title="H1"><Heading1 size={16} /></button>
                    <button onClick={() => insertText('- ')} className="p-2 hover:bg-[var(--bg)] rounded-lg" title="Lista"><List size={16} /></button>
                  </div>
                  {/* View Modes */}
                  <div className="flex bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)]">
                    <button onClick={() => setViewMode('write')} className={`flex-1 p-1.5 rounded-md ${viewMode === 'write' ? 'bg-[var(--accent)] text-white' : ''}`} title="Escrever"><Type size={16} /></button>
                    <button onClick={() => setViewMode('split')} className={`flex-1 p-1.5 rounded-md ${viewMode === 'split' ? 'bg-[var(--accent)] text-white' : ''}`} title="Dividir"><Layout size={16} /></button>
                    <button onClick={() => setViewMode('preview')} className={`flex-1 p-1.5 rounded-md ${viewMode === 'preview' ? 'bg-[var(--accent)] text-white' : ''}`} title="Preview"><Eye size={16} /></button>
                    <button onClick={() => { setIsFocusMode(true); setIsMenuOpen(false); }} className="flex-1 p-1.5 rounded-md hover:bg-[var(--card)]" title="Modo Foco"><Maximize2 size={16} /></button>
                  </div>
                  {/* AI Actions */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-50 px-4 py-2">IA</div>
                    <button onClick={() => { setAiPanelOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-[var(--bg)] rounded-lg text-sm flex items-center gap-2">
                      <Zap size={16} />
                      Abrir Painel
                    </button>
                    <div className="h-px bg-[var(--border)] my-2" />
                    <button onClick={() => { handleAiAction('continue'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-[var(--bg)] rounded-lg text-sm">Continuar</button>
                    <button onClick={() => { handleAiAction('review'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-[var(--bg)] rounded-lg text-sm">Revisar</button>
                    <button onClick={() => { handleAiAction('summarize'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-[var(--bg)] rounded-lg text-sm">Resumir</button>
                    <button onClick={() => { handleAiAction('rewrite'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-[var(--bg)] rounded-lg text-sm">Reescrever</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 lg:w-64">
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da sua história..."
                className="text-xl font-bold bg-transparent border-none focus:outline-none w-full font-serif"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[var(--accent)]"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            <div className="h-6 w-px bg-[var(--border)] mx-2 hidden sm:block" />

            <button onClick={handleNew} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors" title={t.new}>
              <Plus size={20} />
            </button>
            
            <div className="relative group">
              <button onClick={() => {
                const fullText = `${title}\n\n${content}`;
                navigator.clipboard.writeText(fullText);
                alert('História copiada!');
              }} className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors" title="Copiar história">
                <Copy size={20} />
              </button>
            </div>

            <button onClick={handleSave} className="inkwell-button flex items-center gap-2 py-2 px-4">
              <Save size={18} />
              <span className="hidden sm:inline">{t.save}</span>
            </button>

            {storyId && (
              <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </header>
      )}

      {/* Editor Area */}
      <div className={`flex-1 flex gap-4 overflow-hidden min-h-0 ${isFocusMode ? 'max-w-3xl mx-auto w-full py-12' : ''}`}>
        {(viewMode === 'write' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden relative">
            <textarea 
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck="true"
              placeholder="Era uma vez..."
              className="flex-1 w-full p-8 bg-transparent focus:outline-none resize-none font-serif text-lg leading-relaxed"
            />
            {isFocusMode && (
              <button 
                onClick={() => setIsFocusMode(false)}
                className="absolute top-4 right-4 p-2 bg-[var(--bg)]/50 hover:bg-[var(--bg)] rounded-full transition-colors"
              >
                <Minimize2 size={20} />
              </button>
            )}
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-y-auto p-8 prose prose-invert max-w-none prose-headings:font-serif prose-p:font-serif prose-p:text-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "*O preview aparecerá aqui...*"}
            </ReactMarkdown>
          </div>
        )}

        {/* AI Panel */}
        {aiPanelOpen && (
          <div className="w-80 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--accent)]" />
                {t.aiTools}
              </h3>
              <button onClick={() => setAiPanelOpen(false)} className="p-1 hover:bg-[var(--card)] rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-xs uppercase font-bold tracking-widest opacity-50">
                Resultado: {aiAction && t[aiAction]}
              </div>
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                  <p className="text-sm italic opacity-60">{t.aiThinking}</p>
                </div>
              ) : (
                <div className="text-sm leading-relaxed font-serif whitespace-pre-wrap bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)]">
                  {aiResult}
                </div>
              )}
            </div>
            {!isAiLoading && aiResult && (
              <div className="p-4 border-t border-[var(--border)] flex gap-2">
                <button 
                  onClick={applyAiResult}
                  className="flex-1 inkwell-button flex items-center justify-center gap-2 py-2"
                >
                  <Check size={16} />
                  {t.apply}
                </button>
                <button 
                  onClick={() => setAiPanelOpen(false)}
                  className="flex-1 p-2 border border-[var(--border)] rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-bold"
                >
                  {t.discard}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {!isFocusMode && (
        <footer className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm text-[10px] uppercase font-bold tracking-widest opacity-60">
          <div className="flex gap-6">
            <span>{wordCount} {t.words}</span>
            <span>{charCount} {t.chars}</span>
            <span>{paragraphCount} {t.paragraphs}</span>
            <span>{readingTime} {t.readingTime}</span>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-[var(--accent)]">
                Salvo às {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
        </footer>
      )}

      {/* Floating AI Trigger (Mobile or Focus Mode) */}
      {isFocusMode && !aiPanelOpen && (
        <button 
          onClick={() => setAiPanelOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-[var(--accent)] text-white rounded-full shadow-2xl hover:scale-110 transition-transform z-50"
        >
          <Zap size={24} />
        </button>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Excluir história?</h3>
            <p className="opacity-60">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 hover:bg-[var(--bg)] rounded-lg">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
