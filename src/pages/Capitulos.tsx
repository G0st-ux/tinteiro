import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../firebase';
import { 
  doc, getDoc, updateDoc, collection, query, where, 
  orderBy, getDocs, addDoc, deleteDoc, setDoc 
} from 'firebase/firestore';
import { 
  ArrowLeft, Plus, Edit3, Trash2, Eye, EyeOff, 
  GripVertical, Loader2, Save, X, BookOpen, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

interface CapitulosProps {
  usuario: UserProfile;
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
  const [pages, setPages] = useState<string[]>(['']);
  const [activePage, setActivePage] = useState(0);
  const [statusCapitulo, setStatusCapitulo] = useState<'rascunho' | 'publicado'>('rascunho');

  const carregarCapitulos = async () => {
    if (!historia?.id) return;
    setCarregando(true);
    try {
      const q = query(
        collection(db, 'chapters'),
        where('storyId', '==', historia.id),
        orderBy('order', 'asc')
      );
      const snap = await getDocs(q);
      setCapitulos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Erro ao carregar capítulos:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const carregarHistoria = async () => {
      if (!historia && id) {
        const storyRef = doc(db, 'stories', id);
        const storySnap = await getDoc(storyRef);
        
        if (!storySnap.exists()) {
          console.error('Erro ao carregar história');
          navigate('/minhas-historias');
          return;
        }
        setHistoria({ id: storySnap.id, ...storySnap.data() });
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
    setPages(['']);
    setActivePage(0);
    setStatusCapitulo('rascunho');
    setEditorAberto(true);
  };

  const handleEditarCapitulo = (cap: any) => {
    setCapituloEditando(cap);
    setTituloCapitulo(cap.titulo);
    setPages(cap.pages || ['']);
    setActivePage(0);
    setStatusCapitulo(cap.status || 'rascunho');
    setEditorAberto(true);
  };

  const handleSalvarCapitulo = async () => {
    if (!tituloCapitulo) return;
    setSalvando(true);

    try {
      if (capituloEditando) {
        const capRef = doc(db, 'chapters', capituloEditando.id);
        await updateDoc(capRef, {
          titulo: tituloCapitulo,
          pages: pages,
          status: statusCapitulo
        });
      } else {
        const proximaOrdem = capitulos.length + 1;
        await addDoc(collection(db, 'chapters'), {
          storyId: historia.id,
          titulo: tituloCapitulo,
          pages: pages,
          order: proximaOrdem,
          status: statusCapitulo,
          createdAt: new Date().toISOString()
        });
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
      await deleteDoc(doc(db, 'chapters', id));
      carregarCapitulos();
    } catch (error) {
      console.error('Erro ao excluir capítulo:', error);
    }
  };

  const handleToggleStatus = async (cap: any) => {
    const novoStatus = cap.status === 'publicado' ? 'rascunho' : 'publicado';
    try {
      const capRef = doc(db, 'chapters', cap.id);
      await updateDoc(capRef, { status: novoStatus });
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
            className="p-3 card-ink hover:bg-[var(--bg)] transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-24 bg-[var(--bg)] rounded-[2px] overflow-hidden border border-[var(--border)] flex-shrink-0 shadow-sm">
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
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white font-sans ${historia.status === 'publicada' ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                  {historia.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                </span>
              </div>
              <p className="opacity-60 text-sm font-sans">Gerencie os capítulos da sua história</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleNovoCapitulo}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
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
              className="card-ink p-4 flex items-center gap-4 group hover:border-[var(--accent)]/30 transition-all"
            >
              <div className="p-2 opacity-20 cursor-grab active:cursor-grabbing">
                <GripVertical size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest font-sans">Capítulo {cap.order}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-white font-sans ${cap.status === 'publicado' ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                    {cap.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <h3 className="font-bold font-serif text-lg line-clamp-1">{cap.titulo}</h3>
                <div className="flex items-center gap-3 text-xs opacity-40 mt-1 font-sans">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(cap.createdAt).toLocaleDateString()}</span>
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
            <p className="max-w-xs mx-auto font-sans">Comece escrevendo o primeiro capítulo da sua obra prima.</p>
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
                  className="input-field px-4 py-2 text-sm font-bold"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="publicado">Publicado</option>
                </select>
                <button 
                  onClick={handleSalvarCapitulo}
                  disabled={salvando}
                  className="btn-primary flex items-center gap-2 px-6 py-2"
                >
                  {salvando ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                  <label className="label">Título do Capítulo</label>
                  <input 
                    type="text"
                    value={tituloCapitulo}
                    onChange={e => setTituloCapitulo(e.target.value)}
                    placeholder="Ex: Prólogo, Capítulo 1..."
                    className="w-full bg-transparent text-4xl font-bold font-serif outline-none placeholder:opacity-20"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[500px]">
                  <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="label">Conteúdo (Página {activePage + 1})</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const newPages = [...pages];
                            newPages.splice(activePage + 1, 0, '');
                            setPages(newPages);
                            setActivePage(activePage + 1);
                          }}
                          className="btn-ghost text-xs px-2 py-1"
                        >+ Página</button>
                        {pages.length > 1 && (
                          <button 
                            onClick={() => {
                              const newPages = pages.filter((_, i) => i !== activePage);
                              setPages(newPages);
                              setActivePage(Math.max(0, activePage - 1));
                            }}
                            className="btn-ghost text-xs px-2 py-1 text-red-500"
                          >- Página</button>
                        )}
                      </div>
                    </div>
                    <textarea 
                      value={pages[activePage]}
                      onChange={e => {
                        const newPages = [...pages];
                        newPages[activePage] = e.target.value;
                        setPages(newPages);
                      }}
                      placeholder="Comece a escrever esta página..."
                      className="input-field flex-1 w-full p-6 resize-none font-mono text-sm leading-relaxed"
                    />
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {pages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePage(i)}
                          className={`px-3 py-1 rounded text-xs ${activePage === i ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg)]'}`}
                        >
                          Pág {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 flex flex-col">
                    <label className="label">Visualização (Página {activePage + 1})</label>
                    <div className="flex-1 w-full card-ink p-6 overflow-y-auto prose prose-invert max-w-none">
                      <Markdown>{pages[activePage] || '*Nenhum conteúdo para visualizar*'}</Markdown>
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
