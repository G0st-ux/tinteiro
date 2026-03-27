import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Story, AppSettings } from '../types';
import { 
  Save, ArrowLeft, Trash2, Zap, Maximize2, Minimize2, 
  Layout, Type, Eye, Bold, Italic, Strikethrough, 
  Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote as QuoteIcon, Minus, Image as ImageIcon, 
  Copy, Plus, Loader2, Sparkles, X, Check, Menu, PenTool
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CATEGORIES } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { motion } from 'motion/react';

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
    <div className={`h-full flex flex-col gap-6 fade-in ${isFocusMode ? 'focus-mode-active' : ''}`}>
      {/* Top Bar */}
      {!isFocusMode && (
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 card-ink p-6">
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <button onClick={() => navigate('/library')} className="p-3 hover:bg-white/5 rounded-[2px] transition-all active:scale-90 text-white/40 hover:text-[var(--accent)]">
              <ArrowLeft size={22} />
            </button>
            
            <div className="flex-1 lg:w-80 group relative">
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da sua história..."
                className="text-2xl font-serif font-semibold bg-transparent border-none focus:outline-none w-full placeholder:text-white/10 text-white group-hover:text-[var(--accent)] transition-colors"
              />
              <div className="absolute bottom-0 left-0 h-[1px] w-0 group-focus-within:w-full bg-[var(--accent)] transition-all duration-500" />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex bg-[#07070e] p-1 rounded-[2px] border border-[var(--border)]">
              <button onClick={() => setViewMode('write')} className={`p-2.5 rounded-[2px] transition-all ${viewMode === 'write' ? 'bg-[var(--accent)] text-black' : 'text-white/30 hover:text-white'}`} title="Escrever"><Type size={18} /></button>
              <button onClick={() => setViewMode('split')} className={`p-2.5 rounded-[2px] transition-all ${viewMode === 'split' ? 'bg-[var(--accent)] text-black' : 'text-white/30 hover:text-white'}`} title="Dividir"><Layout size={18} /></button>
              <button onClick={() => setViewMode('preview')} className={`p-2.5 rounded-[2px] transition-all ${viewMode === 'preview' ? 'bg-[var(--accent)] text-black' : 'text-white/30 hover:text-white'}`} title="Preview"><Eye size={18} /></button>
            </div>

            <div className="h-8 w-[1px] bg-[var(--border)] mx-2 hidden sm:block" />

            <button onClick={() => setIsFocusMode(true)} className="p-3 hover:bg-white/5 rounded-[2px] transition-all text-white/30 hover:text-[var(--accent)]" title="Modo Foco">
              <Maximize2 size={20} />
            </button>

            <button onClick={handleSave} className="btn-primary flex items-center gap-3 py-3 px-8">
              <Save size={18} />
              <span className="hidden sm:inline uppercase tracking-[0.2em] text-[10px] font-bold">{t.save}</span>
            </button>

            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-3 rounded-[2px] transition-all ${isMenuOpen ? 'bg-[var(--accent)] text-black' : 'hover:bg-white/5 text-white/30'}`}>
                <Menu size={20} />
              </button>
              
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-4 w-72 card-ink z-50 p-6 space-y-6"
                >
                  <div className="space-y-4">
                    <p className="label">CATEGORIA</p>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-field w-full"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#07070e]">{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="space-y-4">
                    <p className="label">AÇÕES</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleNew} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-[2px] hover:bg-[var(--accent)] hover:text-black transition-all group">
                        <Plus size={20} className="text-[var(--accent)] group-hover:text-black" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Novo</span>
                      </button>
                      <button onClick={() => {
                        const fullText = `${title}\n\n${content}`;
                        navigator.clipboard.writeText(fullText);
                        setIsMenuOpen(false);
                      }} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-[2px] hover:bg-[var(--accent)] hover:text-black transition-all group">
                        <Copy size={20} className="text-[var(--accent)] group-hover:text-black" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Copiar</span>
                      </button>
                    </div>
                    {storyId && (
                      <button onClick={handleDelete} className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/5 text-red-500 rounded-[2px] hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={18} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Excluir Manuscrito</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Editor Area */}
      <div className={`flex-1 flex gap-8 overflow-hidden min-h-0 ${isFocusMode ? 'max-w-4xl mx-auto w-full py-12' : ''}`}>
        {(viewMode === 'write' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col card-ink overflow-hidden relative group">
            <div className="absolute inset-0 paper-texture opacity-40 pointer-events-none" />
            <textarea 
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck="true"
              placeholder="A página em branco é um convite ao infinito..."
              className="flex-1 w-full p-12 bg-transparent focus:outline-none resize-none font-serif text-xl leading-[1.8] text-white/80 placeholder:text-white/5 relative z-10 selection:bg-[var(--accent)]/30"
            />
            {isFocusMode && (
              <button 
                onClick={() => setIsFocusMode(false)}
                className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-[var(--accent)] hover:text-black rounded-[2px] transition-all z-20 group-hover:opacity-100 opacity-0"
              >
                <Minimize2 size={24} />
              </button>
            )}
            
            {/* Floating Toolbar (Focus Mode) */}
            {isFocusMode && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 card-ink z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <button onClick={() => insertText('**', '**')} className="p-3 hover:bg-[var(--accent)] hover:text-black rounded-[2px] transition-all"><Bold size={18} /></button>
                <button onClick={() => insertText('*', '*')} className="p-3 hover:bg-[var(--accent)] hover:text-black rounded-[2px] transition-all"><Italic size={18} /></button>
                <button onClick={() => insertText('# ')} className="p-3 hover:bg-[var(--accent)] hover:text-black rounded-[2px] transition-all"><Heading1 size={18} /></button>
                <div className="w-px h-6 bg-[var(--border)] mx-1" />
                <button onClick={() => setAiPanelOpen(true)} className="p-3 hover:bg-[var(--accent)] hover:text-black rounded-[2px] transition-all text-[var(--accent)]"><Zap size={18} /></button>
              </div>
            )}
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 card-ink overflow-y-auto p-12 custom-scrollbar">
            <div className="prose prose-invert max-w-none prose-headings:font-serif prose-p:font-serif prose-p:text-xl prose-p:leading-[1.8] prose-p:text-white/70 prose-headings:text-[var(--accent)] prose-strong:text-[var(--accent)]/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || "*O eco das suas palavras aparecerá aqui...*"}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* AI Panel */}
        {aiPanelOpen && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-96 card-ink flex flex-col overflow-hidden"
          >
            <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--accent)]/10 rounded-[2px] text-[var(--accent)]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg">Oráculo de IA</h3>
                  <p className="label">MUSA INSPIRADORA</p>
                </div>
              </div>
              <button onClick={() => setAiPanelOpen(false)} className="p-2 hover:bg-white/5 rounded-[2px] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleAiAction('continue')} className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-[2px] hover:bg-[var(--accent)]/10 border border-transparent hover:border-[var(--accent)]/20 transition-all group">
                  <PenTool size={18} className="text-[var(--accent)]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Continuar</span>
                </button>
                <button onClick={() => handleAiAction('review')} className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-[2px] hover:bg-[var(--accent)]/10 border border-transparent hover:border-[var(--accent)]/20 transition-all group">
                  <Eye size={18} className="text-[var(--accent)]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Revisar</span>
                </button>
                <button onClick={() => handleAiAction('summarize')} className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-[2px] hover:bg-[var(--accent)]/10 border border-transparent hover:border-[var(--accent)]/20 transition-all group">
                  <QuoteIcon size={18} className="text-[var(--accent)]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Resumir</span>
                </button>
                <button onClick={() => handleAiAction('rewrite')} className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-[2px] hover:bg-[var(--accent)]/10 border border-transparent hover:border-[var(--accent)]/20 transition-all group">
                  <Zap size={18} className="text-[var(--accent)]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Reescrever</span>
                </button>
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="space-y-4">
                <p className="label">RESULTADO</p>
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                    <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
                    <p className="text-sm italic font-serif text-white/40">O oráculo está consultando as estrelas...</p>
                  </div>
                ) : aiResult ? (
                  <div className="text-lg leading-relaxed font-serif whitespace-pre-wrap bg-white/[0.02] p-6 rounded-[2px] border border-[var(--border)] text-white/60">
                    {aiResult}
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-4 opacity-20">
                    <Sparkles size={40} className="mx-auto" />
                    <p className="text-xs italic font-serif">Selecione uma ação para despertar a IA</p>
                  </div>
                )}
              </div>
            </div>

            {!isAiLoading && aiResult && (
              <div className="p-8 border-t border-[var(--border)] flex gap-3 bg-white/[0.02]">
                <button 
                  onClick={applyAiResult}
                  className="flex-1 btn-primary flex items-center justify-center gap-3 py-4"
                >
                  <Check size={18} />
                  <span className="uppercase tracking-widest text-[10px] font-bold">Aplicar</span>
                </button>
                <button 
                  onClick={() => setAiResult('')}
                  className="p-4 border border-[var(--border)] rounded-[2px] hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Stats */}
      {!isFocusMode && (
        <footer className="flex flex-wrap items-center justify-between gap-6 px-10 py-5 card-ink">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="label">PALAVRAS</span>
              <span className="font-mono text-sm font-bold text-[var(--accent)]">{wordCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="label">CARACTERES</span>
              <span className="font-mono text-sm font-bold text-[var(--accent)]">{charCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="label">LEITURA</span>
              <span className="font-mono text-sm font-bold text-[var(--accent)]">{readingTime} min</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {lastSaved && (
              <div className="text-right">
                <p className="label">ÚLTIMO SALVAMENTO</p>
                <p className="font-mono text-[10px] font-bold text-[var(--accent)]/60">{new Date(lastSaved).toLocaleTimeString()}</p>
              </div>
            )}
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]" />
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-ink p-8 max-w-sm w-full space-y-6">
            <h3 className="text-2xl font-bold font-serif text-red-500">Excluir história?</h3>
            <p className="opacity-60 font-sans">Esta ação não pode ser desfeita e a história será perdida para sempre no vazio.</p>
            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost">Cancelar</button>
              <button onClick={confirmDelete} className="btn-primary !bg-red-500/10 !text-red-500 !border-red-500/20 hover:!bg-red-500 hover:!text-white">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
