import React, { useState, useEffect, useCallback } from 'react';
import { db, UserProfile } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Search, User, Users, BookOpen, Loader2, 
  UserPlus, UserMinus, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { criarNotificacao } from '../services/notificacoesService';

interface UsuarioResultado {
  id: string;
  uid: string;
  nome: string;
  foto?: string;
  biografia?: string;
  seguidores_count?: number;
  historias_count?: number;
}

interface BuscaUsuariosProps {
  usuario: UserProfile;
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
      const q = query(
        collection(db, 'users_public'),
        where('uid', '!=', usuario.uid),
        limit(10)
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      const usuariosComContagem = await Promise.all(
        data.map(async (u) => {
          const followersQ = query(collection(db, 'seguidores'), where('seguido_id', '==', u.uid));
          const storiesQ = query(collection(db, 'stories'), where('authorId', '==', u.uid));
          
          const [followersSnap, storiesSnap] = await Promise.all([
            getDocs(followersQ),
            getDocs(storiesQ)
          ]);

          return {
            ...u,
            seguidores_count: followersSnap.size,
            historias_count: storiesSnap.size,
          };
        })
      );

      setSugestoes(usuariosComContagem);
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    } finally {
      setCarregandoSugestoes(false);
    }
  };

  const buscarSeguindo = async () => {
    if (!usuario?.uid) return;
    try {
      const q = query(collection(db, 'seguidores'), where('seguidor_id', '==', usuario.uid));
      const snap = await getDocs(q);
      setSeguindoIds(new Set(snap.docs.map(s => s.data().seguido_id)));
    } catch (err: any) {
      console.error('Erro ao buscar seguindo:', err);
    }
  };

  useEffect(() => {
    buscarSugestoes();
    buscarSeguindo();
  }, [usuario.uid]);

  const realizarBusca = useCallback(async (termo: string) => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    setCarregando(true);
    try {
      // Firebase doesn't support ilike naturally, we'll do a simple prefix search or just fetch and filter
      // For now, let's fetch all and filter client-side for better UX in this small app
      const q = query(collection(db, 'users_public'), limit(100));
      const snap = await getDocs(q);
      const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const filtered = allUsers.filter(u => 
        u.uid !== usuario.uid && 
        u.nome.toLowerCase().includes(termo.toLowerCase())
      );

      const usuariosComContagem = await Promise.all(
        filtered.slice(0, 20).map(async (u) => {
          const followersQ = query(collection(db, 'seguidores'), where('seguido_id', '==', u.uid));
          const storiesQ = query(collection(db, 'stories'), where('authorId', '==', u.uid));
          
          const [followersSnap, storiesSnap] = await Promise.all([
            getDocs(followersQ),
            getDocs(storiesQ)
          ]);

          return {
            ...u,
            seguidores_count: followersSnap.size,
            historias_count: storiesSnap.size,
          };
        })
      );

      setResultados(usuariosComContagem);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario.uid]);

  useEffect(() => {
    const timer = setTimeout(() => {
      realizarBusca(busca);
    }, 500);

    return () => clearTimeout(timer);
  }, [busca, realizarBusca]);

  const handleSeguir = async (alvo: UsuarioResultado, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!usuario?.uid) return;
    if (processandoId) return;
    setProcessandoId(alvo.uid);
    
    const jaSegue = seguindoIds.has(alvo.uid);

    try {
      if (jaSegue) {
        const q = query(
          collection(db, 'seguidores'),
          where('seguidor_id', '==', usuario.uid),
          where('seguido_id', '==', alvo.uid)
        );
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        
        setSeguindoIds(prev => {
          const next = new Set(prev);
          next.delete(alvo.uid);
          return next;
        });
      } else {
        await addDoc(collection(db, 'seguidores'), {
          seguidor_id: usuario.uid,
          seguido_id: alvo.uid,
          criado_em: new Date().toISOString()
        });
        
        setSeguindoIds(prev => new Set(prev).add(alvo.uid));
        
        await criarNotificacao(
          alvo.uid, 
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
      key={u.uid}
      onClick={() => navigate(`/perfil?id=${u.uid}`)}
      className="group flex items-center gap-4 p-4 card-ink hover:border-[var(--accent)]/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--border)] flex-shrink-0">
        {u.foto ? (
          <img src={u.foto} alt={u.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--accent)] bg-[var(--accent)]/10 font-bold font-serif text-xl">
            {u.nome.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold font-serif text-lg truncate">{u.nome}</h3>
        <div className="flex items-center gap-3 text-xs opacity-50 font-medium font-sans">
          <span className="flex items-center gap-1"><Users size={12} /> {u.seguidores_count || 0} seguidores</span>
          <span className="flex items-center gap-1"><BookOpen size={12} /> {u.historias_count || 0} histórias</span>
        </div>
      </div>

      <button 
        onClick={(e) => handleSeguir(u, e)}
        disabled={processandoId === u.uid}
        className={`
          relative z-10 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2
          ${seguindoIds.has(u.uid) 
            ? 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]' 
            : 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'}
          ${processandoId === u.uid ? 'opacity-50' : 'hover:scale-105 active:scale-95'}
        `}
      >
        {processandoId === u.uid ? (
          <Loader2 size={16} className="animate-spin" />
        ) : seguindoIds.has(u.uid) ? (
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
            className="input-field w-full pl-16 pr-8 py-5 text-lg"
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
