import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { 
  ArrowLeft, MessageSquare, BookOpen, Users, Map, 
  Settings, Send, Loader2, User, Plus, Trash2, 
  Edit3, Save, X, ChevronRight, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { criarNotificacao } from '../services/notificacoesService';

// Importando tipos e componentes necessários (ou simulando se necessário)
import { Character, Location, Story } from '../types';

interface SalaColaborativaProps {
  sala: any;
  usuario: { id: string; nome: string; foto?: string; };
  onVoltar: () => void;
  t: any;
}

type Aba = 'chat' | 'capitulos' | 'personagens' | 'mundos';

export const SalaColaborativa: React.FC<SalaColaborativaProps> = ({ sala, usuario, onVoltar, t }) => {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('chat');
  const [carregando, setCarregando] = useState(true);
  const [membros, setMembros] = useState<any[]>([]);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  
  // Estados das abas
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [capitulos, setCapitulos] = useState<any[]>([]);
  const [personagens, setPersonagens] = useState<any[]>([]);
  const [mundos, setMundos] = useState<any[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const eDono = sala.dono_id === usuario.id;

  const carregarMembros = async () => {
    const { data } = await supabase
      .from('membros_sala')
      .select('*, usuarios(*)')
      .eq('sala_id', sala.id);
    setMembros(data || []);
  };

  const carregarMensagens = async () => {
    const { data } = await supabase
      .from('mensagens_sala')
      .select('*, usuarios(nome, foto)')
      .eq('sala_id', sala.id)
      .order('criado_em', { ascending: true });
    setMensagens(data || []);
  };

  const carregarCapitulos = async () => {
    const { data } = await supabase
      .from('capitulos')
      .select('*')
      .eq('sala_id', sala.id)
      .order('ordem', { ascending: true });
    setCapitulos(data || []);
  };

  const carregarPersonagens = async () => {
    const { data } = await supabase
      .from('personagens')
      .select('*')
      .eq('sala_id', sala.id);
    setPersonagens(data || []);
  };

  const carregarMundos = async () => {
    const { data } = await supabase
      .from('mundos')
      .select('*')
      .eq('sala_id', sala.id);
    setMundos(data || []);
  };

  useEffect(() => {
    const init = async () => {
      setCarregando(true);
      await Promise.all([
        carregarMembros(),
        carregarMensagens(),
        carregarCapitulos(),
        carregarPersonagens(),
        carregarMundos()
      ]);
      setCarregando(false);
    };
    init();
  }, [sala.id]);

  // Realtime subscription for the chat
  useEffect(() => {
    const channel = supabase
      .channel(`sala-${sala.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_sala',
          filter: `sala_id=eq.${sala.id}`
        },
        async (payload) => {
          // Fetch the full message with user info when a new one arrives
          const { data, error } = await supabase
            .from('mensagens_sala')
            .select('*, usuarios(nome, foto)')
            .eq('id', payload.new.id)
            .single();
          
          if (!error && data) {
            setMensagens(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sala.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    const texto = novaMensagem;
    setNovaMensagem('');

    try {
      // Ensure IDs are numbers if the DB expects integers
      const salaId = isNaN(Number(sala.id)) ? sala.id : Number(sala.id);
      const usuarioId = isNaN(Number(usuario.id)) ? usuario.id : Number(usuario.id);

      const { error } = await supabase.from('mensagens_sala').insert({
        sala_id: salaId,
        usuario_id: usuarioId,
        texto
      });
      
      if (error) throw error;
      // No need to manually call carregarMensagens, the Realtime subscription will handle it
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleEncerrarSala = async () => {
    if (!confirm('Tem certeza que deseja encerrar esta sala? Todos os dados serão perdidos.')) return;

    try {
      // Notificar membros
      for (const membro of membros) {
        if (membro.usuario_id !== usuario.id) {
          await criarNotificacao(
            membro.usuario_id,
            'colaboracao',
            `A sala "${sala.nome}" foi encerrada pelo dono.`
          );
        }
      }

      // Apagar sala (cascade deve cuidar do resto se configurado, senão apagar manual)
      await supabase.from('colaboracoes').delete().eq('id', sala.id);
      onVoltar();
    } catch (error) {
      console.error('Erro ao encerrar sala:', error);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 fade-in">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={onVoltar}
            className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl hover:bg-[var(--accent)] hover:text-white hover:border-transparent transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-serif">{sala.nome}</h1>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {membros.map((m, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--card)] bg-[var(--bg)] overflow-hidden" title={m.usuarios?.nome}>
                    {m.usuarios?.foto ? (
                      <img src={m.usuarios.foto} alt={m.usuarios.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--accent)] text-[10px] font-bold">
                        {m.usuarios?.nome?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-xs opacity-40 font-bold uppercase tracking-widest">{membros.length} membros</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {eDono && (
            <button 
              onClick={() => setModalConfigAberto(true)}
              className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl hover:bg-[var(--accent)] hover:text-white hover:border-transparent transition-all"
            >
              <Settings size={24} />
            </button>
          )}
        </div>
      </header>

      {/* NAVEGAÇÃO ABAS */}
      <nav className="flex bg-[var(--card)] border border-[var(--border)] rounded-3xl p-2 shadow-sm overflow-x-auto">
        {[
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'capitulos', icon: BookOpen, label: 'Capítulos' },
          { id: 'personagens', icon: Users, label: 'Personagens' },
          { id: 'mundos', icon: Globe, label: 'Mundos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id as Aba)}
            className={`
              flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap
              ${abaAtiva === tab.id 
                ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                : 'opacity-60 hover:opacity-100 hover:bg-[var(--bg)]'}
            `}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTEÚDO ABAS */}
      <main className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {abaAtiva === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm min-h-[500px] max-h-[70vh] md:max-h-[600px]"
            >
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {mensagens.map((msg, i) => {
                  const eMeu = msg.usuario_id === usuario.id;
                  const data = new Date(msg.criado_em);
                  const hora = data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={i} className={`flex ${eMeu ? 'justify-end' : 'justify-start'} items-end gap-3`}>
                      {!eMeu && (
                        <div className="w-8 h-8 rounded-full bg-[var(--bg)] overflow-hidden flex-shrink-0 mb-1">
                          {msg.usuarios?.foto ? (
                            <img src={msg.usuarios.foto} alt={msg.usuarios.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--accent)] text-[10px] font-bold">
                              {msg.usuarios?.nome?.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[70%] space-y-1 ${eMeu ? 'items-end' : 'items-start'}`}>
                        {!eMeu && <span className="text-[10px] font-bold opacity-40 ml-2">{msg.usuarios?.nome}</span>}
                        <div className={`
                          px-6 py-3 rounded-[1.5rem] text-sm leading-relaxed shadow-sm
                          ${eMeu ? 'bg-[var(--accent)] text-white rounded-br-none' : 'bg-[var(--bg)] rounded-bl-none'}
                        `}>
                          {msg.texto}
                        </div>
                        <span className="text-[9px] opacity-30 font-bold px-2">{hora}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleEnviarMensagem} className="p-6 bg-[var(--bg)] border-t border-[var(--border)] flex gap-4">
                <input 
                  type="text"
                  value={novaMensagem}
                  onChange={e => setNovaMensagem(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-6 py-4 outline-none focus:border-[var(--accent)] transition-all"
                />
                <button 
                  type="submit"
                  disabled={!novaMensagem.trim()}
                  className="p-4 bg-[var(--accent)] text-white rounded-2xl hover:opacity-90 disabled:opacity-20 transition-all shadow-lg shadow-[var(--accent)]/20"
                >
                  <Send size={24} />
                </button>
              </form>
            </motion.div>
          )}

          {abaAtiva === 'capitulos' && (
            <motion.div 
              key="capitulos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif">Capítulos da Sala</h2>
                <button className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg">
                  <Plus size={20} /> Novo Capítulo
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {capitulos.map((cap, i) => (
                  <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 flex items-center justify-between group hover:border-[var(--accent)]/40 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--bg)] rounded-2xl flex items-center justify-center font-bold text-[var(--accent)]">
                        {cap.ordem}
                      </div>
                      <div>
                        <h3 className="font-bold">{cap.titulo}</h3>
                        <p className="text-xs opacity-40 uppercase tracking-widest font-bold">Status: {cap.status}</p>
                      </div>
                    </div>
                    <button className="p-3 opacity-0 group-hover:opacity-100 bg-[var(--bg)] rounded-xl hover:text-[var(--accent)] transition-all">
                      <Edit3 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {abaAtiva === 'personagens' && (
            <motion.div 
              key="personagens"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif">Personagens Compartilhados</h2>
                <button className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg">
                  <Plus size={20} /> Criar Personagem
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {personagens.map((p, i) => (
                  <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-4 text-center space-y-3 hover:shadow-lg transition-all cursor-pointer">
                    <div className="aspect-square bg-[var(--bg)] rounded-2xl flex items-center justify-center overflow-hidden">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <User size={32} className="opacity-20" />}
                    </div>
                    <h3 className="font-bold text-sm">{p.basicInfo?.name}</h3>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {abaAtiva === 'mundos' && (
            <motion.div 
              key="mundos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif">Mundo da História</h2>
                <button className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg">
                  <Plus size={20} /> Adicionar Local
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mundos.map((m, i) => (
                  <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                    <div className="aspect-video bg-[var(--bg)]">
                      {m.imageUrl && <img src={m.imageUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="font-bold text-lg">{m.name}</h3>
                      <p className="text-xs opacity-60 line-clamp-2">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODAL CONFIGURAÇÕES */}
      <AnimatePresence>
        {modalConfigAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalConfigAberto(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-10 shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif">Configurações da Sala</h2>
                <button onClick={() => setModalConfigAberto(false)} className="opacity-40 hover:opacity-100">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Membros</h3>
                  <div className="space-y-3">
                    {membros.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--card)]">
                            {m.usuarios?.foto && <img src={m.usuarios.foto} alt={m.usuarios.nome} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{m.usuarios?.nome}</p>
                            <p className="text-[10px] opacity-40 uppercase font-bold">{m.papel}</p>
                          </div>
                        </div>
                        {eDono && m.usuario_id !== usuario.id && (
                          <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--border)]">
                  <button 
                    onClick={handleEncerrarSala}
                    className="w-full py-4 border border-red-500/30 text-red-500 rounded-2xl font-bold hover:bg-red-500/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={20} />
                    Encerrar Sala Permanentemente
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
