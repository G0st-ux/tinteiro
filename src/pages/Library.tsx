import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Story } from '../types';
import { 
  Book, Plus, Search, Clock, FileText, Trash2, 
  Copy, Filter, ArrowUpDown, ChevronDown 
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
    <div className="space-y-8 fade-in">
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t.library}</h1>
          <p className="opacity-60">Sua coleção de mundos e palavras</p>
        </div>
        <Link to="/editor" className="inkwell-button flex items-center gap-2">
          <Plus size={20} />
          Nova História
        </Link>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar histórias..."
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:border-[var(--accent)] text-sm font-medium"
            >
              <option value="all">Todas Categorias</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          </div>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:border-[var(--accent)] text-sm font-medium"
            >
              <option value="recent">{t.recent}</option>
              <option value="oldest">{t.oldest}</option>
              <option value="az">{t.az}</option>
              <option value="mostWords">{t.mostWords}</option>
            </select>
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStories.length > 0 ? (
          filteredStories.map((story) => {
            const category = CATEGORIES.find(c => c.id === story.category) || CATEGORIES[CATEGORIES.length - 1];
            return (
              <Link 
                key={story.id} 
                to={`/editor?id=${story.id}`}
                className="inkwell-card group hover:border-[var(--accent)] flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg">
                      <FileText size={20} />
                    </div>
                    <span 
                      className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.label}
                    </span>
                  </div>
                  <div className="flex gap-1 transition-opacity">
                    <button 
                      onClick={(e) => handleDuplicate(story, e)}
                      className="p-2 hover:bg-[var(--bg)] rounded-lg" title={t.duplicate}
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(story.id, e)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title={t.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold font-serif mb-2 line-clamp-1">{story.title}</h3>
                <p className="text-sm opacity-60 line-clamp-3 mb-6 flex-1 italic">
                  {story.content || "Sem conteúdo..."}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] opacity-50 text-[10px] uppercase font-bold tracking-tighter">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(story.updatedAt).toLocaleDateString()}
                  </span>
                  <span>{story.wordCount} {t.wordCount}</span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center opacity-50 italic">
            <Book size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl mb-2">{t.noStories}</p>
            <p className="text-sm">Que tal começar uma nova jornada hoje? ✨</p>
          </div>
        )}
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Excluir história?</h3>
            <p className="opacity-60">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 hover:bg-[var(--bg)] rounded-lg">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
