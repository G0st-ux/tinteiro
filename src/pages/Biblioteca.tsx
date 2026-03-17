import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Search, Filter, Heart, Eye, BookOpen, 
  Loader2, User, ChevronRight, Hash, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BibliotecaProps {
  onVerHistoria: (historia: any) => void;
  t: any;
}

const GENEROS = ['Todos', 'Fantasia', 'Romance', 'Ficção Científica', 'Terror', 'Mistério', 'Aventura', 'Drama', 'Comédia', 'Poesia', 'Outros'];
const CLASSIFICACOES = ['Todos', 'Livre', '+13', '+18'];

export const Biblioteca: React.FC<BibliotecaProps> = ({ onVerHistoria, t }) => {
  const [historias, setHistorias] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('Todos');
  const [filtroClassificacao, setFiltroClassificacao] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'populares' | 'curtidas'>('recentes');

  const carregarHistorias = async () => {
    setCarregando(true);
    try {
      let query = supabase
        .from('historias')
        .select('*, usuarios(nome, foto), curtidas(count)')
        .eq('status', 'publicada');

      if (busca) {
        query = query.ilike('titulo', `%${busca}%`);
      }

      if (filtroGenero !== 'Todos') {
        query = query.eq('genero', filtroGenero);
      }

      if (filtroClassificacao !== 'Todos') {
        query = query.eq('classificacao', filtroClassificacao);
      }

      if (ordenacao === 'recentes') {
        query = query.order('criado_em', { ascending: false });
      } else if (ordenacao === 'populares') {
        query = query.order('visualizacoes', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];
      
      // Sort by likes if needed (since it's a count join, we might need to sort client-side if query doesn't support it directly)
      if (ordenacao === 'curtidas') {
        result = result.sort((a, b) => (b.curtidas?.[0]?.count || 0) - (a.curtidas?.[0]?.count || 0));
      }

      setHistorias(result);
    } catch (error) {
      console.error('Erro ao carregar biblioteca:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarHistorias();
    }, 300);
    return () => clearTimeout(timer);
  }, [busca, filtroGenero, filtroClassificacao, ordenacao]);

  return (
    <div className="space-y-12 fade-in pb-20">
      {/* HERO */}
      <section className="relative h-[300px] rounded-[3rem] overflow-hidden bg-[var(--accent)] flex items-center justify-center text-center p-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-black rounded-full blur-[100px]" />
        </div>
        <div className="relative space-y-6 max-w-2xl">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-bold font-serif text-white tracking-tight">Explorar</h1>
            <p className="text-white/80 text-lg font-medium">Descubra histórias incríveis de escritores do mundo todo.</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[var(--accent)] transition-all" size={24} />
            <input 
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título ou autor..."
              className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] pl-16 pr-8 py-5 text-white placeholder:text-white/40 outline-none focus:bg-white focus:text-black transition-all shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--accent)]">
              <Filter size={20} />
            </div>
            {GENEROS.map(g => (
              <button 
                key={g}
                onClick={() => setFiltroGenero(g)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  filtroGenero === g 
                    ? 'bg-[var(--accent)] text-white shadow-lg' 
                    : 'bg-[var(--card)] border border-[var(--border)] opacity-60 hover:opacity-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          
          <select 
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value as any)}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:border-[var(--accent)] transition-all"
          >
            <option value="recentes">Mais recentes</option>
            <option value="populares">Mais populares</option>
            <option value="curtidas">Mais curtidas</option>
          </select>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <div className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--accent)]">
            <Star size={20} />
          </div>
          {CLASSIFICACOES.map(c => (
            <button 
              key={c}
              onClick={() => setFiltroClassificacao(c)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                filtroClassificacao === c 
                  ? 'bg-[var(--accent)] text-white shadow-lg' 
                  : 'bg-[var(--card)] border border-[var(--border)] opacity-60 hover:opacity-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* GRID DE HISTÓRIAS */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
        </div>
      ) : historias.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {historias.map((historia) => (
            <motion.div 
              key={historia.id}
              whileHover={{ y: -10 }}
              onClick={() => onVerHistoria(historia)}
              className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group"
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
                    <h3 className="text-lg font-bold font-serif text-white drop-shadow-lg">{historia.titulo}</h3>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg ${
                    historia.classificacao === 'Livre' ? 'bg-blue-500' : 
                    historia.classificacao === '+13' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {historia.classificacao}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-6">
                  <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    Ler agora <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-[var(--accent)] transition-all">{historia.titulo}</h3>
                  <div className="flex items-center gap-2 opacity-60">
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)]/10 flex items-center justify-center overflow-hidden">
                      {historia.usuarios?.foto ? (
                        <img src={historia.usuarios.foto} alt={historia.usuarios.nome} className="w-full h-full object-cover" />
                      ) : (
                        <User size={10} />
                      )}
                    </div>
                    <span className="text-xs font-medium">{historia.usuarios?.nome}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-3 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Heart size={12} /> {historia.curtidas?.[0]?.count || 0}</span>
                    <span className="flex items-center gap-1"><Eye size={12} /> {historia.visualizacoes || 0}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">{historia.genero}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
          <div className="p-8 bg-[var(--accent)]/5 rounded-full">
            <BookOpen size={80} strokeWidth={1} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-serif">Nenhuma história encontrada</h3>
            <p className="max-w-xs mx-auto">Tente ajustar seus filtros ou buscar por outro termo.</p>
          </div>
        </div>
      )}
    </div>
  );
};
