import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Plus, Book, Edit3, Eye, Heart, MessageSquare, 
  MoreVertical, X, Camera, Loader2, Trash2, Globe, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MinhasHistoriasProps {
  usuario: UserProfile;
  t: any;
  onVerCapitulos: (historia: any) => void;
}

const GENEROS = ['Fantasia', 'Romance', 'Ficção Científica', 'Terror', 'Mistério', 'Aventura', 'Drama', 'Comédia', 'Poesia', 'Outros'];
const CLASSIFICACOES = [
  { id: 'Livre', label: 'Livre', color: 'bg-blue-500', desc: 'Para todos os públicos' },
  { id: '+13', label: '+13', color: 'bg-yellow-500', desc: 'Conteúdo jovem adulto' },
  { id: '+18', label: '+18', color: 'bg-red-500', desc: 'Conteúdo adulto' }
];

export const MinhasHistorias: React.FC<MinhasHistoriasProps> = ({ usuario, t, onVerCapitulos }) => {
  const [historias, setHistorias] = useState<any[]>([]);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [historiaSelecionada, setHistoriaSelecionada] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    capa: '',
    genero: 'Fantasia',
    classificacao: 'Livre',
    tags: [] as string[],
    idioma: 'Português',
    status: 'rascunho'
  });
  const [tagInput, setTagInput] = useState('');

  const carregarHistorias = async () => {
    if (!usuario?.uid) return;
    setCarregando(true);
    try {
      const q = query(
        collection(db, 'stories'),
        where('authorId', '==', usuario.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snap = await getDocs(q);
      const docs = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        
        // Count chapters
        const chaptersQ = query(collection(db, 'chapters'), where('storyId', '==', d.id));
        const chaptersSnap = await getDocs(chaptersQ);
        
        // Count likes
        const likesQ = query(collection(db, 'likes'), where('storyId', '==', d.id));
        const likesSnap = await getDocs(likesQ);

        return {
          id: d.id,
          ...data,
          capitulos_count: chaptersSnap.size,
          curtidas_count: likesSnap.size
        };
      }));
      
      setHistorias(docs);
    } catch (error) {
      console.error('Erro ao carregar histórias:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarHistorias();
  }, [usuario.uid]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo) return;
    setSalvando(true);

    try {
      const payload = {
        ...form,
        authorId: usuario.uid,
        authorName: usuario.nome,
        createdAt: historiaSelecionada ? historiaSelecionada.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (historiaSelecionada) {
        const storyRef = doc(db, 'stories', historiaSelecionada.id);
        await updateDoc(storyRef, payload);
      } else {
        await addDoc(collection(db, 'stories'), {
          ...payload,
          views: 0,
          likes: 0,
          comments: 0
        });
      }

      setModalCriarAberto(false);
      setHistoriaSelecionada(null);
      setForm({
        titulo: '',
        descricao: '',
        capa: '',
        genero: 'Fantasia',
        classificacao: 'Livre',
        tags: [],
        idioma: 'Português',
        status: 'rascunho'
      });
      carregarHistorias();
    } catch (error) {
      console.error('Erro ao salvar história:', error);
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (historia: any) => {
    setHistoriaSelecionada(historia);
    setForm({
      titulo: historia.titulo,
      descricao: historia.descricao || '',
      capa: historia.capa || '',
      genero: historia.genero || 'Fantasia',
      classificacao: historia.classificacao || 'Livre',
      tags: historia.tags || [],
      idioma: historia.idioma || 'Português',
      status: historia.status || 'rascunho'
    });
    setModalCriarAberto(true);
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta história? Todos os capítulos serão perdidos.')) return;
    try {
      await deleteDoc(doc(db, 'stories', id));
      carregarHistorias();
    } catch (error) {
      console.error('Erro ao excluir história:', error);
    }
  };

  const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, capa: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && form.tags.length < 5) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-8 fade-in">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--accent)]/10 rounded-2xl text-[var(--accent)]">
            <Book size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-serif">Minhas Histórias</h1>
            <p className="opacity-60 text-sm">Gerencie suas obras literárias</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setHistoriaSelecionada(null);
            setForm({
              titulo: '',
              descricao: '',
              capa: '',
              genero: 'Fantasia',
              classificacao: 'Livre',
              tags: [],
              idioma: 'Português',
              status: 'rascunho'
            });
            setModalCriarAberto(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
        >
          <Plus size={20} />
          Nova História
        </button>
      </header>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
        </div>
      ) : historias.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {historias.map((historia) => (
            <motion.div 
              key={historia.id}
              whileHover={{ scale: 1.02 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm flex flex-col group"
            >
              <div className="aspect-[2/3] relative bg-[var(--bg)] overflow-hidden">
                {historia.capa ? (
                  <img 
                    src={historia.capa} 
                    alt={historia.titulo}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--bg)] flex items-center justify-center p-6 text-center">
                    <h3 className="text-xl font-bold font-serif text-white drop-shadow-lg">{historia.titulo}</h3>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${historia.status === 'publicada' ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                    {historia.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white ${
                    CLASSIFICACOES.find(c => c.id === historia.classificacao)?.color || 'bg-blue-500'
                  }`}>
                    {historia.classificacao}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold line-clamp-1">{historia.titulo}</h3>
                  <p className="text-sm opacity-70 line-clamp-2 leading-relaxed">
                    {historia.descricao || 'Sem descrição disponível.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs opacity-60 font-medium">
                  <span className="flex items-center gap-1"><Book size={14} /> {historia.capitulos_count || 0} caps</span>
                  <span className="flex items-center gap-1"><Heart size={14} /> {historia.curtidas_count || 0}</span>
                  <span className="flex items-center gap-1"><Eye size={14} /> {historia.views || 0}</span>
                </div>

                <div className="pt-4 flex gap-2 mt-auto">
                  <button 
                    onClick={() => handleEditar(historia)}
                    className="flex-1 py-2 border border-[var(--border)] rounded-xl text-sm font-bold hover:bg-[var(--bg)] transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} /> Editar
                  </button>
                  <button 
                    onClick={() => onVerCapitulos(historia)}
                    className="flex-1 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Book size={16} /> Capítulos
                  </button>
                  <button 
                    onClick={() => handleExcluir(historia.id)}
                    className="p-2 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
          <div className="p-8 bg-[var(--accent)]/5 rounded-full">
            <Book size={80} strokeWidth={1} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-serif">Nenhuma história ainda</h3>
            <p className="max-w-xs mx-auto">Comece sua jornada literária criando sua primeira obra.</p>
          </div>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR */}
      <AnimatePresence>
        {modalCriarAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalCriarAberto(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl space-y-8 my-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif">
                  {historiaSelecionada ? 'Editar História' : 'Nova História'}
                </h2>
                <button onClick={() => setModalCriarAberto(false)} className="p-2 hover:bg-[var(--bg)] rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna Capa */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase opacity-50 ml-1">Capa da História</label>
                  <label className="block aspect-[2/3] relative group cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={handleCapaChange} />
                    {form.capa ? (
                      <>
                        <img src={form.capa} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Camera className="text-white" size={32} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-[var(--bg)] flex flex-col items-center justify-center gap-3 opacity-40">
                        <Camera size={48} />
                        <span className="text-xs font-bold uppercase tracking-widest">Upload Capa</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Coluna Campos */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">Título</label>
                    <input 
                      type="text"
                      required
                      value={form.titulo}
                      onChange={e => setForm({ ...form, titulo: e.target.value })}
                      placeholder="Dê um nome à sua obra"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold uppercase opacity-50">Descrição</label>
                      <span className="text-[10px] opacity-40">{form.descricao.length}/500</span>
                    </div>
                    <textarea 
                      maxLength={500}
                      value={form.descricao}
                      onChange={e => setForm({ ...form, descricao: e.target.value })}
                      placeholder="Sobre o que é sua história?"
                      rows={4}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase opacity-50 ml-1">Gênero</label>
                      <select 
                        value={form.genero}
                        onChange={e => setForm({ ...form, genero: e.target.value })}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] outline-none transition-all"
                      >
                        {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase opacity-50 ml-1">Classificação</label>
                      <select 
                        value={form.classificacao}
                        onChange={e => setForm({ ...form, classificacao: e.target.value })}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] outline-none transition-all"
                      >
                        {CLASSIFICACOES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">Tags (Enter para adicionar)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-xs font-bold">
                          #{tag}
                          <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                    <input 
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder={form.tags.length >= 5 ? "Máximo de 5 tags" : "fantasia, magia..."}
                      disabled={form.tags.length >= 5}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${form.status === 'publicada' ? 'bg-emerald-500' : 'bg-gray-400'}`}
                        onClick={() => setForm({ ...form, status: form.status === 'publicada' ? 'rascunho' : 'publicada' })}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.status === 'publicada' ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className="text-sm font-bold opacity-70">
                        {form.status === 'publicada' ? 'Publicar agora' : 'Salvar como rascunho'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-full flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setModalCriarAberto(false)}
                    className="flex-1 py-4 border border-[var(--border)] rounded-2xl font-bold hover:bg-[var(--bg)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={salvando}
                    className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {salvando ? <Loader2 className="animate-spin" size={20} /> : historiaSelecionada ? 'Salvar Alterações' : 'Criar História'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
