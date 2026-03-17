import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  ArrowLeft, Plus, Edit3, Trash2, Eye, EyeOff, 
  GripVertical, Loader2, Save, X, BookOpen, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

interface CapitulosProps {
  usuario: { id: string; nome: string; };
  historia?: { id: string; titulo: string; capa?: string; status: string; };
  onVoltar?: () => void;
  t: any;
}

export const Capitulos: React.FC<CapitulosProps> = ({ usuario, historia: historiaProp, onVoltar, t }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historia, setHistoria] = useState<any>(historiaProp);
  const [capitulos, setCapitulos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editorAberto, setEditorAberto] = useState(false);
  const [capituloEditando, setCapituloEditando] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);

  // Editor state
  const [tituloCapitulo, setTituloCapitulo] = useState('');
  const [conteudoEditor, setConteudoEditor] = useState('');
  const [statusCapitulo, setStatusCapitulo] = useState<'rascunho' | 'publicado'>('rascunho');

  const carregarCapitulos = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('capitulos')
        .select('*')
        .eq('historia_id', historia.id)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setCapitulos(data || []);
    } catch (error) {
      console.error('Erro ao carregar capítulos:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const carregarHistoria = async () => {
      if (!historia && id) {
        const { data, error } = await supabase
          .from('historias')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Erro ao carregar história:', error);
          navigate('/minhas-historias');
          return;
        }
        setHistoria(data);
      }
    };
    carregarHistoria();
  }, [id, historia, navigate]);

  useEffect(() => {
    if (historia?.id) {
      carregarCapitulos();
    }
  }, [historia?.id]);

  const handleNovoCapitulo = () => {
    setCapituloEditando(null);
    setTituloCapitulo('');
    setConteudoEditor('');
    setStatusCapitulo('rascunho');
    setEditorAberto(true);
  };

  const handleEditarCapitulo = (cap: any) => {
    setCapituloEditando(cap);
    setTituloCapitulo(cap.titulo);
    setConteudoEditor(cap.conteudo || '');
    setStatusCapitulo(cap.status || 'rascunho');
    setEditorAberto(true);
  };

  const handleSalvarCapitulo = async () => {
    if (!tituloCapitulo) return;
    setSalvando(true);

    try {
      if (capituloEditando) {
        const { error } = await supabase
          .from('capitulos')
          .update({
            titulo: tituloCapitulo,
            conteudo: conteudoEditor,
            status: statusCapitulo
          })
          .eq('id', capituloEditando.id);
        if (error) throw error;
      } else {
        const proximaOrdem = capitulos.length + 1;
        const { error } = await supabase
          .from('capitulos')
          .insert([{
            historia_id: historia.id,
            titulo: tituloCapitulo,
            conteudo: conteudoEditor,
            ordem: proximaOrdem,
            status: statusCapitulo,
            criado_em: new Date().toISOString()
          }]);
        if (error) throw error;
      }

      setEditorAberto(false);
      carregarCapitulos();
    } catch (error) {
      console.error('Erro ao salvar capítulo:', error);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirCapitulo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este capítulo?')) return;
    try {
      const { error } = await supabase.from('capitulos').delete().eq('id', id);
      if (error) throw error;
      carregarCapitulos();
    } catch (error) {
      console.error('Erro ao excluir capítulo:', error);
    }
  };

  const handleToggleStatus = async (cap: any) => {
    const novoStatus = cap.status === 'publicado' ? 'rascunho' : 'publicado';
    try {
      const { error } = await supabase
        .from('capitulos')
        .update({ status: novoStatus })
        .eq('id', cap.id);
      if (error) throw error;
      carregarCapitulos();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  if (carregando && !historia) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
      </div>
    );
  }

  if (!historia) return null;

  return (
    <div className="space-y-8 fade-in">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onVoltar ? onVoltar() : navigate('/minhas-historias')}
            className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:bg-[var(--bg)] transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-24 bg-[var(--bg)] rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0 shadow-sm">
              {historia.capa ? (
                <img src={historia.capa} alt={historia.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--accent)]/10 flex items-center justify-center">
                  <BookOpen size={24} className="text-[var(--accent)] opacity-40" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold font-serif line-clamp-1">{historia.titulo}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${historia.status === 'publicada' ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                  {historia.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                </span>
              </div>
              <p className="opacity-60 text-sm">Gerencie os capítulos da sua história</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleNovoCapitulo}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
        >
          <Plus size={20} />
          Novo Capítulo
        </button>
      </header>

      {/* LISTA DE CAPÍTULOS */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
        </div>
      ) : capitulos.length > 0 ? (
        <div className="space-y-4">
          {capitulos.map((cap, index) => (
            <motion.div 
              key={cap.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-4 group hover:border-[var(--accent)]/30 transition-all"
            >
              <div className="p-2 opacity-20 cursor-grab active:cursor-grabbing">
                <GripVertical size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest">Capítulo {cap.ordem}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-white ${cap.status === 'publicado' ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                    {cap.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <h3 className="font-bold text-lg line-clamp-1">{cap.titulo}</h3>
                <div className="flex items-center gap-3 text-xs opacity-40 mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(cap.criado_em).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggleStatus(cap)}
                  title={cap.status === 'publicado' ? 'Despublicar' : 'Publicar'}
                  className={`p-2 rounded-xl transition-all ${cap.status === 'publicado' ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-gray-400 hover:bg-gray-400/10'}`}
                >
                  {cap.status === 'publicado' ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
                <button 
                  onClick={() => handleEditarCapitulo(cap)}
                  className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={() => handleExcluirCapitulo(cap.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
          <div className="p-8 bg-[var(--accent)]/5 rounded-full">
            <Edit3 size={80} strokeWidth={1} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-serif">Nenhum capítulo ainda</h3>
            <p className="max-w-xs mx-auto">Comece escrevendo o primeiro capítulo da sua obra prima.</p>
          </div>
        </div>
      )}

      {/* EDITOR DE CAPÍTULO */}
      <AnimatePresence>
        {editorAberto && (
          <div className="fixed inset-0 z-[60] bg-[var(--bg)] flex flex-col">
            <header className="p-4 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => setEditorAberto(false)}
                  className="p-2 hover:bg-[var(--bg)] rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
                <div className="flex-1 max-w-xl">
                  <input 
                    type="text"
                    value={tituloCapitulo}
                    onChange={e => setTituloCapitulo(e.target.value)}
                    placeholder="Título do Capítulo"
                    className="w-full bg-transparent text-xl font-bold font-serif outline-none placeholder:opacity-30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={statusCapitulo}
                  onChange={e => setStatusCapitulo(e.target.value as any)}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-bold outline-none"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="publicado">Publicado</option>
                </select>
                <button 
                  onClick={handleSalvarCapitulo}
                  disabled={salvando}
                  className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40">Título do Capítulo</label>
                  <input 
                    type="text"
                    value={tituloCapitulo}
                    onChange={e => setTituloCapitulo(e.target.value)}
                    placeholder="Ex: Prólogo, Capítulo 1..."
                    className="w-full bg-transparent text-4xl font-bold font-serif outline-none placeholder:opacity-20"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[500px]">
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40">Conteúdo (Markdown)</label>
                    <textarea 
                      value={conteudoEditor}
                      onChange={e => setConteudoEditor(e.target.value)}
                      placeholder="Comece a escrever sua história..."
                      className="flex-1 w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6 outline-none focus:border-[var(--accent)] transition-all resize-none font-mono text-sm leading-relaxed"
                    />
                  </div>
                  
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40">Visualização</label>
                    <div className="flex-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 overflow-y-auto prose prose-invert max-w-none">
                      <Markdown>{conteudoEditor || '*Nenhum conteúdo para visualizar*'}</Markdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
