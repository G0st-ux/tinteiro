import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
  Search, User, Users, BookOpen, Loader2, 
  UserPlus, UserMinus, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { criarNotificacao } from '../services/notificacoesService';

interface UsuarioResultado {
  id: string;
  nome: string;
  foto?: string;
  biografia?: string;
  seguidores_count?: number;
  historias_count?: number;
}

interface BuscaUsuariosProps {
  usuario: { id: string; nome: string; foto?: string; };
  t: any;
}

export const BuscaUsuarios: React.FC<BuscaUsuariosProps> = ({ usuario, t }) => {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<UsuarioResultado[]>([]);
  const [sugestoes, setSugestoes] = useState<UsuarioResultado[]>([]);
  const [seguindoIds, setSeguindoIds] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const navigate = useNavigate();

  const buscarSugestoes = async () => {
    try {
      // Buscar usuários populares (simulado por limite, já que não temos contagem real fácil sem rpc)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .neq('id', usuario.id)
        .eq('banido', false)
        .limit(10);

      if (error) throw error;
      
      // Para cada sugestão, vamos buscar contagem de histórias e seguidores (opcional se as tabelas permitirem)
      setSugestoes(data || []);
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    } finally {
      setCarregandoSugestoes(false);
    }
  };

  const buscarSeguindo = async () => {
    if (!usuario?.id) return;
    try {
      const { data, error } = await supabase
        .from('seguidores')
        .select('seguido_id')
        .eq('seguidor_id', usuario.id);

      if (error) throw error;
      setSeguindoIds(new Set(data.map(s => s.seguido_id)));
    } catch (err: any) {
      console.error('Erro ao buscar seguindo:', err);
      // Não alertar aqui para não atrapalhar o carregamento inicial, mas logar detalhado
    }
  };

  useEffect(() => {
    buscarSugestoes();
    buscarSeguindo();
  }, [usuario.id]);

  const realizarBusca = useCallback(async (termo: string) => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nome', `%${termo}%`)
        .neq('id', usuario.id)
        .eq('banido', false)
        .limit(20);

      if (error) throw error;
      setResultados(data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      realizarBusca(busca);
    }, 500);

    return () => clearTimeout(timer);
  }, [busca, realizarBusca]);

  const handleSeguir = async (alvo: UsuarioResultado, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const meuId = usuario?.id || (usuario as any)?.uid;
    
    if (!meuId) return;

    if (processandoId) return;
    setProcessandoId(alvo.id);
    
    const jaSegue = seguindoIds.has(alvo.id);

    try {
      if (jaSegue) {
        const { error } = await supabase
          .from('seguidores')
          .delete()
          .eq('seguidor_id', meuId)
          .eq('seguido_id', alvo.id);

        if (error) throw error;
        
        setSeguindoIds(prev => {
          const next = new Set(prev);
          next.delete(alvo.id);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('seguidores')
          .insert({ seguidor_id: meuId, seguido_id: alvo.id });

        if (error) throw error;
        
        setSeguindoIds(prev => new Set(prev).add(alvo.id));
        
        await criarNotificacao(
          alvo.id, 
          'seguidor', 
          `${usuario.nome} começou a te seguir!`, 
          '/perfil'
        );
      }
    } catch (err: any) {
      console.error('Erro ao processar seguir:', err);
    } finally {
      setProcessandoId(null);
    }
  };

  const renderUsuario = (u: UsuarioResultado) => (
    <div 
      key={u.id}
      onClick={() => navigate(`/perfil?id=${u.id}`)}
      className="group flex items-center gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl hover:border-[var(--accent)]/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--border)] flex-shrink-0">
        {u.foto ? (
          <img src={u.foto} alt={u.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--accent)] bg-[var(--accent)]/10 font-bold text-xl">
            {u.nome.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg truncate">{u.nome}</h3>
        <div className="flex items-center gap-3 text-xs opacity-50 font-medium">
          <span className="flex items-center gap-1"><Users size={12} /> {u.seguidores_count || 0} seguidores</span>
          <span className="flex items-center gap-1"><BookOpen size={12} /> {u.historias_count || 0} histórias</span>
        </div>
      </div>

      <button 
        onClick={(e) => handleSeguir(u, e)}
        disabled={processandoId === u.id}
        className={`
          relative z-10 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2
          ${seguindoIds.has(u.id) 
            ? 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]' 
            : 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'}
          ${processandoId === u.id ? 'opacity-50' : 'hover:scale-105 active:scale-95'}
        `}
      >
        {processandoId === u.id ? (
          <Loader2 size={16} className="animate-spin" />
        ) : seguindoIds.has(u.id) ? (
          <><UserMinus size={16} /> Seguindo</>
        ) : (
          <><UserPlus size={16} /> Seguir</>
        )}
      </button>
      
      <ChevronRight size={18} className="opacity-0 group-hover:opacity-40 transition-all -translate-x-2 group-hover:translate-x-0" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 fade-in pb-20">
      <header className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--accent)] text-white rounded-2xl shadow-lg shadow-[var(--accent)]/20">
            <Search size={28} />
          </div>
          <h1 className="text-3xl font-bold font-serif">Buscar Escritores</h1>
        </div>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--accent)] opacity-40 group-focus-within:opacity-100 transition-all" size={24} />
          <input 
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Busque por nome ou @usuário..."
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[2rem] pl-16 pr-8 py-5 text-lg outline-none focus:border-[var(--accent)] focus:shadow-xl focus:shadow-[var(--accent)]/5 transition-all"
          />
        </div>
      </header>

      {busca.trim() ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif opacity-60">Resultados para "{busca}"</h2>
            {carregando && <Loader2 className="animate-spin text-[var(--accent)]" size={20} />}
          </div>

          {resultados.length === 0 && !carregando ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-40">
              <User size={64} />
              <p className="text-xl font-medium italic">Nenhum usuário encontrado para "{busca}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultados.map(renderUsuario)}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          <h2 className="text-xl font-bold font-serif opacity-60">Sugestões para você</h2>
          
          {carregandoSugestoes ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sugestoes.map(renderUsuario)}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
