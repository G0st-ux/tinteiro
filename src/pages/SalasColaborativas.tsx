import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
  Users, Plus, Search, X, Check, Trash2, 
  Loader2, ChevronRight, UserPlus, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { criarNotificacao } from '../services/notificacoesService';

interface SalasColaborativasProps {
  usuario: { id: string; nome: string; foto?: string; };
  t: any;
  onEntrarSala: (sala: any) => void;
}

export const SalasColaborativas: React.FC<SalasColaborativasProps> = ({ usuario, t, onEntrarSala }) => {
  const [salas, setSalas] = useState<any[]>([]);
  const [convitesPendentes, setConvitesPendentes] = useState<any[]>([]);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [nomeSala, setNomeSala] = useState('');
  const [descricaoSala, setDescricaoSala] = useState('');
  const [carregando, setCarregando] = useState(true);
  
  // Busca de usuários para convite
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [resultadosUsuarios, setResultadosUsuarios] = useState<any[]>([]);
  const [convidados, setConvidados] = useState<any[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      // 1. Buscar convites pendentes
      const { data: convites } = await supabase
        .from('colaboracoes')
        .select('*, usuarios!dono_id(nome, foto)')
        .eq('convidado_id', usuario.id)
        .eq('status', 'pendente');
      
      setConvitesPendentes(convites || []);

      // 2. Buscar salas onde é dono (aceitas)
      const { data: salasDono } = await supabase
        .from('colaboracoes')
        .select('*, membros_sala(*, usuarios(*))')
        .eq('dono_id', usuario.id)
        .eq('status', 'aceito');

      // 3. Buscar salas onde é membro
      const { data: participacoes } = await supabase
        .from('membros_sala')
        .select('*, colaboracoes(*, membros_sala(*, usuarios(*)))')
        .eq('usuario_id', usuario.id);

      const salasMembro = participacoes?.map(p => p.colaboracoes).filter(Boolean) || [];
      
      // Unificar e remover duplicatas por ID
      const todasSalas = [...(salasDono || []), ...salasMembro];
      const salasUnicas = Array.from(new Map(todasSalas.map(s => [s.id, s])).values());
      
      setSalas(salasUnicas);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    } finally {
      setCarregando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Busca de usuários com debounce
  useEffect(() => {
    if (!buscaUsuario.trim()) {
      setResultadosUsuarios([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoUsuarios(true);
      try {
        const { data } = await supabase
          .from('usuarios')
          .select('id, nome, foto')
          .ilike('nome', `%${buscaUsuario}%`)
          .neq('id', usuario.id)
          .limit(5);
        setResultadosUsuarios(data || []);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setBuscandoUsuarios(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [buscaUsuario, usuario.id]);

  const handleAceitarConvite = async (convite: any) => {
    try {
      // 1. Atualizar status da colaboração
      await supabase
        .from('colaboracoes')
        .update({ status: 'aceito' })
        .eq('id', convite.id);

      // 2. Inserir como membro
      await supabase
        .from('membros_sala')
        .insert({ 
          sala_id: convite.id, 
          usuario_id: usuario.id, 
          papel: 'colaborador' 
        });

      // 3. Notificar dono
      await criarNotificacao(
        convite.dono_id, 
        'colaboracao', 
        `${usuario.nome} aceitou seu convite para a sala "${convite.nome}"!`
      );

      carregarDados();
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
    }
  };

  const handleRecusarConvite = async (convite: any) => {
    try {
      await supabase
        .from('colaboracoes')
        .update({ status: 'recusado' })
        .eq('id', convite.id);

      await criarNotificacao(
        convite.dono_id, 
        'colaboracao', 
        `${usuario.nome} recusou seu convite para a sala "${convite.nome}"!`
      );

      carregarDados();
    } catch (error) {
      console.error('Erro ao recusar convite:', error);
    }
  };

  const handleCriarSala = async () => {
    if (!nomeSala.trim()) return;
    setCarregando(true);

    try {
      // 1. Criar a sala base (para o dono)
      const { data: novaSala, error: erroSala } = await supabase
        .from('colaboracoes')
        .insert({
          nome: nomeSala,
          descricao: descricaoSala,
          dono_id: usuario.id,
          status: 'aceito' // Dono já aceita automaticamente
        })
        .select()
        .single();

      if (erroSala) throw erroSala;

      // 2. Adicionar dono como membro
      await supabase
        .from('membros_sala')
        .insert({ 
          sala_id: novaSala.id, 
          usuario_id: usuario.id, 
          papel: 'dono' 
        });

      // 3. Enviar convites para os outros
      for (const convidado of convidados) {
        await supabase.from('colaboracoes').insert({
          nome: nomeSala,
          descricao: descricaoSala,
          dono_id: usuario.id,
          convidado_id: convidado.id,
          status: 'pendente'
        });
        
        await criarNotificacao(
          convidado.id, 
          'colaboracao', 
          `${usuario.nome} te convidou para a sala "${nomeSala}"!`
        );
      }

      setModalCriarAberto(false);
      setNomeSala('');
      setDescricaoSala('');
      setConvidados([]);
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar sala:', error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 fade-in pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--accent)] text-white rounded-2xl shadow-lg shadow-[var(--accent)]/20">
            <Users size={28} />
          </div>
          <h1 className="text-3xl font-bold font-serif">Salas Colaborativas</h1>
        </div>
        <button 
          onClick={() => setModalCriarAberto(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
        >
          <Plus size={20} />
          Nova Sala
        </button>
      </header>

      {/* CONVITES PENDENTES */}
      {convitesPendentes.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-serif opacity-60">Convites pendentes</h2>
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {convitesPendentes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {convitesPendentes.map((convite) => (
              <div key={convite.id} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 flex items-start gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[var(--bg)] flex-shrink-0">
                  {convite.usuarios?.foto ? (
                    <img src={convite.usuarios.foto} alt={convite.usuarios.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--accent)] bg-[var(--accent)]/10 font-bold">
                      {convite.usuarios?.nome?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{convite.nome}</h3>
                    <p className="text-xs opacity-60">Convidado por <span className="font-bold">{convite.usuarios?.nome}</span></p>
                  </div>
                  <p className="text-sm opacity-80 line-clamp-2">{convite.descricao}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAceitarConvite(convite)}
                      className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={14} /> Aceitar
                    </button>
                    <button 
                      onClick={() => handleRecusarConvite(convite)}
                      className="flex-1 py-2 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/5 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={14} /> Recusar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MINHAS SALAS */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold font-serif opacity-60">Minhas Salas</h2>
        
        {carregando ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
          </div>
        ) : salas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-40">
            <Users size={64} />
            <p className="text-xl font-medium italic">Você não participa de nenhuma sala ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {salas.map((sala) => {
              const eDono = sala.dono_id === usuario.id;
              const membros = sala.membros_sala || [];
              
              return (
                <div key={sala.id} className="group bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-8 space-y-6 hover:border-[var(--accent)]/40 transition-all shadow-sm hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <div className="p-4 bg-[var(--accent)]/10 text-[var(--accent)] rounded-3xl">
                      <Users size={32} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      eDono ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {eDono ? 'Dono' : 'Colaborador'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-serif">{sala.nome}</h3>
                    <p className="text-sm opacity-60 line-clamp-2 leading-relaxed">
                      {sala.descricao || 'Nenhuma descrição disponível.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex -space-x-3">
                      {membros.map((m: any, i: number) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--card)] bg-[var(--bg)] overflow-hidden">
                          {m.usuarios?.foto ? (
                            <img src={m.usuarios.foto} alt={m.usuarios.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--accent)] text-xs font-bold">
                              {m.usuarios?.nome?.charAt(0)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => onEntrarSala(sala)}
                      className="flex items-center gap-2 px-6 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl font-bold text-sm hover:bg-[var(--accent)] hover:text-white hover:border-transparent transition-all"
                    >
                      Entrar na sala
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL CRIAR SALA */}
      <AnimatePresence>
        {modalCriarAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalCriarAberto(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-10 shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif">Criar Nova Sala</h2>
                <button onClick={() => setModalCriarAberto(false)} className="opacity-40 hover:opacity-100">
                  <X size={28} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Nome da Sala</label>
                    <input 
                      type="text"
                      value={nomeSala}
                      onChange={e => setNomeSala(e.target.value)}
                      placeholder="Ex: Crônicas de Eldoria"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl px-6 py-4 outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Descrição</label>
                    <textarea 
                      value={descricaoSala}
                      onChange={e => setDescricaoSala(e.target.value)}
                      placeholder="Sobre o que é esta colaboração?"
                      rows={4}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl px-6 py-4 outline-none focus:border-[var(--accent)] transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Convidar Escritores ({convidados.length}/3)</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                      <input 
                        type="text"
                        value={buscaUsuario}
                        onChange={e => setBuscaUsuario(e.target.value)}
                        placeholder="Buscar por nome..."
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    
                    {/* Resultados da busca */}
                    <div className="space-y-2 mt-2">
                      {buscandoUsuarios ? (
                        <div className="flex justify-center py-2"><Loader2 className="animate-spin opacity-20" size={20} /></div>
                      ) : resultadosUsuarios.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--card)]">
                              {u.foto && <img src={u.foto} alt={u.nome} className="w-full h-full object-cover" />}
                            </div>
                            <span className="text-sm font-bold">{u.nome}</span>
                          </div>
                          <button 
                            disabled={convidados.some(c => c.id === u.id) || convidados.length >= 3}
                            onClick={() => {
                              setConvidados([...convidados, u]);
                              setBuscaUsuario('');
                              setResultadosUsuarios([]);
                            }}
                            className="p-1.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-20 transition-all"
                          >
                            <UserPlus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lista de convidados */}
                  <div className="flex flex-wrap gap-2">
                    {convidados.map(c => (
                      <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl border border-[var(--accent)]/20">
                        <span className="text-xs font-bold">{c.nome}</span>
                        <button onClick={() => setConvidados(convidados.filter(x => x.id !== c.id))}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCriarSala}
                disabled={!nomeSala.trim() || carregando}
                className="w-full py-5 bg-[var(--accent)] text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-[var(--accent)]/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {carregando ? <Loader2 className="animate-spin" size={24} /> : <Users size={24} />}
                Criar Sala Colaborativa
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
