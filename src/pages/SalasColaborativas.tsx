import React, { useState, useEffect, useCallback } from 'react';
import { db, UserProfile, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, onSnapshot, addDoc, 
  updateDoc, doc, deleteDoc, getDocs, getDoc, 
  serverTimestamp, orderBy, limit, writeBatch
} from 'firebase/firestore';
import { 
  Users, Plus, Search, X, Check, Trash2, 
  Loader2, ChevronRight, UserPlus, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { criarNotificacao } from '../services/notificacoesService';

interface SalasColaborativasProps {
  usuario: UserProfile;
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

  // Real-time listener for invitations
  useEffect(() => {
    if (!usuario?.uid) return;

    const q = query(
      collection(db, 'room_invitations'),
      where('receiverId', '==', usuario.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const invites = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const senderSnap = await getDoc(doc(db, 'users_public', data.senderId));
        const roomSnap = await getDoc(doc(db, 'rooms', data.roomId));
        return {
          id: d.id,
          ...data,
          sender: senderSnap.exists() ? senderSnap.data() : null,
          room: roomSnap.exists() ? roomSnap.data() : null
        };
      }));
      setConvitesPendentes(invites);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'room_invitations');
    });

    return () => unsubscribe();
  }, [usuario?.uid]);

  // Real-time listener for rooms (where user is a member)
  useEffect(() => {
    if (!usuario?.uid) return;

    const q = query(
      collection(db, 'room_members'),
      where('userId', '==', usuario.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setCarregando(true);
      try {
        const roomsData = await Promise.all(snapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          const roomSnap = await getDoc(doc(db, 'rooms', memberData.roomId));
          if (!roomSnap.exists()) return null;
          
          const roomData = roomSnap.data();
          // Fetch members for each room
          const membersQ = query(collection(db, 'room_members'), where('roomId', '==', memberData.roomId));
          const membersSnap = await getDocs(membersQ);
          const members = await Promise.all(membersSnap.docs.map(async (m) => {
            const mData = m.data();
            const uSnap = await getDoc(doc(db, 'users_public', mData.userId));
            return { ...mData, user: uSnap.exists() ? uSnap.data() : null };
          }));

          return {
            id: roomSnap.id,
            ...roomData,
            members
          };
        }));
        setSalas(roomsData.filter(Boolean));
      } catch (error) {
        console.error('Erro ao carregar salas:', error);
      } finally {
        setCarregando(false);
      }
    });

    return () => unsubscribe();
  }, [usuario?.uid]);

  // Busca de usuários com debounce
  useEffect(() => {
    if (!buscaUsuario.trim()) {
      setResultadosUsuarios([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoUsuarios(true);
      try {
        const q = query(
          collection(db, 'users_public'),
          orderBy('nome'),
          limit(20)
        );
        const snap = await getDocs(q);
        const users = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((u: any) => 
            u.id !== usuario.uid && 
            u.nome?.toLowerCase().includes(buscaUsuario.toLowerCase())
          )
          .slice(0, 5);
        setResultadosUsuarios(users);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setBuscandoUsuarios(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [buscaUsuario, usuario.uid]);

  const handleAceitarConvite = async (invitation: any) => {
    try {
      const batch = writeBatch(db);

      // 1. Atualizar status do convite
      batch.update(doc(db, 'room_invitations', invitation.id), { status: 'accepted' });

      // 2. Inserir como membro
      const memberRef = doc(collection(db, 'room_members'));
      batch.set(memberRef, {
        roomId: invitation.roomId,
        userId: usuario.uid,
        role: 'colaborador',
        joinedAt: new Date().toISOString()
      });

      await batch.commit();

      // 3. Notificar dono
      await criarNotificacao(
        invitation.senderId, 
        'colaboracao', 
        `${usuario.nome} aceitou seu convite para a sala "${invitation.room?.name}"!`
      );
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
    }
  };

  const handleRecusarConvite = async (invitation: any) => {
    try {
      await updateDoc(doc(db, 'room_invitations', invitation.id), { status: 'rejected' });

      await criarNotificacao(
        invitation.senderId, 
        'colaboracao', 
        `${usuario.nome} recusou seu convite para a sala "${invitation.room?.name}"!`
      );
    } catch (error) {
      console.error('Erro ao recusar convite:', error);
    }
  };

  const handleCriarSala = async () => {
    if (!nomeSala.trim()) return;
    setCarregando(true);

    try {
      // 1. Criar a sala
      const roomRef = await addDoc(collection(db, 'rooms'), {
        name: nomeSala,
        description: descricaoSala,
        ownerId: usuario.uid,
        createdAt: new Date().toISOString()
      });

      // 2. Adicionar dono como membro
      await addDoc(collection(db, 'room_members'), {
        roomId: roomRef.id,
        userId: usuario.uid,
        role: 'dono',
        joinedAt: new Date().toISOString()
      });

      // 3. Enviar convites para os outros
      for (const convidado of convidados) {
        await addDoc(collection(db, 'room_invitations'), {
          roomId: roomRef.id,
          senderId: usuario.uid,
          receiverId: convidado.id,
          status: 'pending',
          createdAt: new Date().toISOString()
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
                  {convite.sender?.foto ? (
                    <img src={convite.sender.foto} alt={convite.sender.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--accent)] bg-[var(--accent)]/10 font-bold">
                      {convite.sender?.nome?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{convite.room?.name}</h3>
                    <p className="text-xs opacity-60">Convidado por <span className="font-bold">{convite.sender?.nome}</span></p>
                  </div>
                  <p className="text-sm opacity-80 line-clamp-2">{convite.room?.description}</p>
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
              const eDono = sala.ownerId === usuario.uid;
              const membros = sala.members || [];
              
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
                    <h3 className="text-2xl font-bold font-serif">{sala.name}</h3>
                    <p className="text-sm opacity-60 line-clamp-2 leading-relaxed">
                      {sala.description || 'Nenhuma descrição disponível.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex -space-x-3">
                      {membros.map((m: any, i: number) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--card)] bg-[var(--bg)] overflow-hidden">
                          {m.user?.foto ? (
                            <img src={m.user.foto} alt={m.user.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--accent)] text-xs font-bold">
                              {m.user?.nome?.charAt(0)}
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
