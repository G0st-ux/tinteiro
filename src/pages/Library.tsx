import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Story } from '../types';
import { 
  Book, Plus, Search, Clock, FileText, Trash2, 
  Copy, Filter, ArrowUpDown, ChevronDown, ArrowRight 
} from 'lucide-react';
import { CATEGORIES } from '../constants';

interface LibraryProps {
  stories: Story[];
  setStories: (s: Story[]) => void;
  t: any;
}

export const Library: React.FC<LibraryProps> = ({ stories, setStories, t }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'az' | 'mostWords'>('recent');

  const filteredStories = stories.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'recent') return b.updatedAt - a.updatedAt;
    if (sortBy === 'oldest') return a.updatedAt - b.updatedAt;
    if (sortBy === 'az') return a.title.localeCompare(b.title);
    if (sortBy === 'mostWords') return (b.wordCount || 0) - (a.wordCount || 0);
    return 0;
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      setStories(stories.filter(s => s.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
      if (window.location.pathname === '/editor') navigate('/library');
    }
  };

  const handleDuplicate = (story: Story, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStory: Story = {
      ...story,
      id: Math.random().toString(36).substr(2, 9),
      title: `${story.title} (${t.duplicate})`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setStories([...stories, newStory]);
  };

  return (
    <div className="space-y-12 fade-in pb-20">
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="section-tag">
            <Book size={12} />
            Acervo Literário
          </div>
          <h1 className="h1">{t.library}</h1>
          <p className="font-serif italic text-lg text-white/40">Sua coleção de mundos e palavras imortalizadas.</p>
        </div>
        <Link to="/editor" className="btn-primary">
          <Plus size={18} />
          Nova História
        </Link>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-6 card-ink p-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--accent)] transition-colors" size={18} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar manuscritos..."
            className="input-field w-full pl-12"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="relative group">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field appearance-none pl-10 pr-10 cursor-pointer"
            >
              <option value="all" className="bg-[#07070e]">Todas Categorias</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#07070e]">{cat.label}</option>
              ))}
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-[var(--accent)] transition-colors" size={16} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          </div>
          <div className="relative group">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field appearance-none pl-10 pr-10 cursor-pointer"
            >
              <option value="recent" className="bg-[#07070e]">{t.recent}</option>
              <option value="oldest" className="bg-[#07070e]">{t.oldest}</option>
              <option value="az" className="bg-[#07070e]">{t.az}</option>
              <option value="mostWords" className="bg-[#07070e]">{t.mostWords}</option>
            </select>
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-[var(--accent)] transition-colors" size={16} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredStories.length > 0 ? (
          filteredStories.map((story) => {
            const category = CATEGORIES.find(c => c.id === story.category) || CATEGORIES[CATEGORIES.length - 1];
            return (
              <Link 
                key={story.id} 
                to={`/editor?id=${story.id}`}
                className="card-ink card-story group"
              >
                <div className="page-number">#{story.id.slice(0, 3)}</div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="section-tag">
                      {category.label}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDuplicate(story, e)}
                      className="p-2 text-white/40 hover:text-[var(--accent)] transition-colors" title={t.duplicate}
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(story.id, e)}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors" title={t.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 flex-1">
                  <h3 className="font-display text-[24px] font-semibold text-white group-hover:text-[var(--accent)] transition-colors leading-tight line-clamp-2">
                    {story.title || "Sem título"}
                  </h3>
                  <p className="font-serif text-[15px] italic text-white/40 line-clamp-3 leading-relaxed">
                    {story.content || "O silêncio da página em branco..."}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 pt-6 mt-4 border-t border-[var(--border)]">
                  <div className="flex flex-col">
                    <span className="label">DATA</span>
                    <span className="font-mono text-[11px] text-white/40">{new Date(story.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="label">PALAVRAS</span>
                    <span className="font-mono text-[11px] text-[var(--accent)]">{story.wordCount}</span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center card-ink">
            <div className="w-16 h-16 bg-[var(--accent)]/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Book size={24} className="text-[var(--accent)]/50" />
            </div>
            <p className="font-display text-[24px] italic text-white/40 mb-4">{t.noStories}</p>
            <p className="font-sans text-[13px] text-white/30 mb-8">Que tal começar uma nova jornada hoje? ✨</p>
            <Link to="/editor" className="btn-ghost inline-block">Começar agora</Link>
          </div>
        )}
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative card-ink max-w-md w-full space-y-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold font-serif">Excluir história?</h3>
              <p className="opacity-60 text-base leading-relaxed">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={confirmDelete} className="btn-primary flex-1 !bg-red-500 !text-white hover:!bg-red-600 shadow-lg shadow-red-500/20">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
