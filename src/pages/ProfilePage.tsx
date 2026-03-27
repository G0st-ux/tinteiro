import React, { useState, useEffect, useCallback } from 'react';
import { db, UserProfile } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { 
  User, Pencil, Book, Heart, Users, 
  Camera, X, Loader2, BookOpen, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { criarNotificacao } from '../services/notificacoesService';

interface ProfilePageProps {
  usuario: UserProfile;
  setUsuario: (u: any) => void;
  t: any;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ usuario, setUsuario, t }) => {
  const [searchParams] = useSearchParams();
  const perfilIdParam = searchParams.get('id');
  
  const [perfilVisualizado, setPerfilVisualizado] = useState<any>(usuario);
  const [historias, setHistorias] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [seguidores, setSeguidores] = useState(0);
  const [seguindo, setSeguindo] = useState(0);
  const [jaSeguindo, setJaSeguindo] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'historias' | 'favoritos'>('historias');
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [processandoSeguir, setProcessandoSeguir] = useState(false);

  // Estados de edição
  const [editNome, setEditNome] = useState(usuario.nome);
  const [editBio, setEditBio] = useState(usuario.bio || '');
  const [editFoto, setEditFoto] = useState(usuario.foto || '');

  const carregarDadosPerfil = useCallback(async (perfilId: string) => {
    setCarregando(true);
    try {
      // Se não for o próprio usuário, buscar dados do perfil
      if (perfilId !== usuario.uid) {
        const userRef = doc(db, 'users_public', perfilId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setPerfilVisualizado(userSnap.data());
        }
      } else {
        setPerfilVisualizado(usuario);
      }

      // Buscar histórias do usuário
      const storiesQ = query(collection(db, 'stories'), where('authorId', '==', perfilId));
      const storiesSnap = await getDocs(storiesQ);
      setHistorias(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar favoritos (simplificado para Firebase por enquanto)
      // No Supabase era uma query complexa, aqui vamos buscar da coleção 'favoritos'
      const favsQ = query(collection(db, 'favoritos'), where('userId', '==', perfilId));
      const favsSnap = await getDocs(favsQ);
      setFavoritos([]); // TODO: Implementar busca detalhada de favoritos se necessário

      // Contar seguidores
      const followersQ = query(collection(db, 'seguidores'), where('seguido_id', '==', perfilId));
      const followersSnap = await getDocs(followersQ);
      setSeguidores(followersSnap.size);

      // Contar seguindo
      const followingQ = query(collection(db, 'seguidores'), where('seguidor_id', '==', perfilId));
      const followingSnap = await getDocs(followingQ);
      setSeguindo(followingSnap.size);

      // Verificar se já segue
      if (perfilId !== usuario.uid) {
        const checkQ = query(
          collection(db, 'seguidores'), 
          where('seguidor_id', '==', usuario.uid),
          where('seguido_id', '==', perfilId)
        );
        const checkSnap = await getDocs(checkQ);
        setJaSeguindo(!checkSnap.empty);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setCarregando(false);
    }
  }, [usuario.uid]);

  useEffect(() => {
    const idParaCarregar = perfilIdParam || usuario.uid;
    carregarDadosPerfil(idParaCarregar);
  }, [perfilIdParam, usuario.uid, carregarDadosPerfil]);

  const handleSeguir = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!usuario?.uid) return;
    if (processandoSeguir) return;
    setProcessandoSeguir(true);

    try {
      if (jaSeguindo) {
        const q = query(
          collection(db, 'seguidores'),
          where('seguidor_id', '==', usuario.uid),
          where('seguido_id', '==', perfilVisualizado.uid)
        );
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        
        setSeguidores(prev => prev - 1);
      } else {
        await addDoc(collection(db, 'seguidores'), {
          seguidor_id: usuario.uid,
          seguido_id: perfilVisualizado.uid,
          criado_em: new Date().toISOString()
        });
        
        setSeguidores(prev => prev + 1);
        
        await criarNotificacao(
          perfilVisualizado.uid,
          'seguidor',
          `${usuario.nome} começou a te seguir!`,
          '/perfil'
        );
      }
      setJaSeguindo(!jaSeguindo);
    } catch (error: any) {
      console.error('Erro ao seguir/deixar de seguir:', error);
    } finally {
      setProcessandoSeguir(false);
    }
  };

  const handleSalvarPerfil = async () => {
    setCarregando(true);
    try {
      const userRef = doc(db, 'users', usuario.uid);
      const publicRef = doc(db, 'users_public', usuario.uid);
      const updates = {
        nome: editNome,
        bio: editBio,
        foto: editFoto
      };

      await Promise.all([
        updateDoc(userRef, updates),
        updateDoc(publicRef, updates)
      ]);
      
      const updatedUser = { ...usuario, ...updates };
      setUsuario(updatedUser);
      setPerfilVisualizado(updatedUser);
      setModalEdicaoAberto(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (carregando && !perfilVisualizado) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      {/* SEÇÃO 1 — CABEÇALHO */}
      <section className="card-ink p-8 relative overflow-hidden">
        {/* Background Decorativo */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--accent)]/10 to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Foto */}
          <div className="relative group">
            {perfilVisualizado.foto ? (
              <img 
                src={perfilVisualizado.foto} 
                alt={perfilVisualizado.nome}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-[var(--card)] shadow-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-4xl font-serif font-bold border-4 border-[var(--card)] shadow-xl">
                {perfilVisualizado.nome.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-bold font-serif">{perfilVisualizado.nome}</h1>
              <p className="opacity-60 text-sm font-sans">{perfilVisualizado.email}</p>
            </div>

            {perfilVisualizado.bio && (
              <p className="text-sm max-w-lg font-sans">{perfilVisualizado.bio}</p>
            )}

            {/* Contadores */}
            <div className="flex justify-center md:justify-start gap-8 pt-2">
              <div className="text-center">
                <p className="font-bold text-xl font-serif">{historias.length}</p>
                <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest font-sans">Histórias</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl font-serif">{seguidores}</p>
                <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest font-sans">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl font-serif">{seguindo}</p>
                <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest font-sans">Seguindo</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-3 w-full md:w-auto pt-4 md:pt-0">
            {perfilVisualizado.uid === usuario.uid ? (
              <button 
                onClick={() => setModalEdicaoAberto(true)}
                className="btn-ghost flex items-center justify-center gap-2 px-6 py-2 text-sm"
              >
                <Pencil size={16} />
                Editar perfil
              </button>
            ) : (
              <button 
                onClick={(e) => handleSeguir(e)}
                disabled={processandoSeguir}
                className={`relative z-10 flex items-center justify-center gap-2 px-8 py-2 rounded-[2px] font-bold text-sm transition-all ${
                  jaSeguindo 
                    ? 'border border-[var(--border)] opacity-70 hover:bg-white/5' 
                    : 'bg-[var(--accent)] text-white hover:opacity-90 shadow-lg'
                } ${processandoSeguir ? 'opacity-50' : ''}`}
              >
                {processandoSeguir ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Users size={16} />
                )}
                {jaSeguindo ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — ABAS */}
      <section className="space-y-6">
        <div className="flex border-b border-[var(--border)]">
          <button 
            onClick={() => setAbaAtiva('historias')}
            className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${
              abaAtiva === 'historias' 
                ? 'border-[var(--accent)] text-[var(--accent)]' 
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            Histórias
          </button>
          <button 
            onClick={() => setAbaAtiva('favoritos')}
            className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${
              abaAtiva === 'favoritos' 
                ? 'border-[var(--accent)] text-[var(--accent)]' 
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            Favoritos
          </button>
        </div>

        {/* SEÇÃO 3 — CONTEÚDO */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {abaAtiva === 'historias' ? (
            historias.length > 0 ? (
              historias.map((historia) => (
                <StoryCard key={historia.id} historia={historia} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                <BookOpen size={48} className="mx-auto" />
                <p className="font-medium">Nenhuma história publicada ainda</p>
              </div>
            )
          ) : (
            favoritos.length > 0 ? (
              favoritos.map((historia) => (
                <StoryCard key={historia.id} historia={historia} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                <Heart size={48} className="mx-auto" />
                <p className="font-medium">Nenhum favorito ainda</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* SEÇÃO 4 — MODAL DE EDIÇÃO */}
      <AnimatePresence>
        {modalEdicaoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalEdicaoAberto(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md card-ink p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-serif">Editar Perfil</h2>
                <button onClick={() => setModalEdicaoAberto(false)} className="opacity-60 hover:opacity-100">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Upload Foto */}
                <div className="flex justify-center">
                  <label className="relative group cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--border)] group-hover:border-[var(--accent)] transition-all relative">
                      {editFoto ? (
                        <img src={editFoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--bg)] flex items-center justify-center">
                          <User size={32} className="opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Camera className="text-white" size={24} />
                      </div>
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="label">Nome</label>
                    <input 
                      type="text"
                      value={editNome}
                      onChange={e => setEditNome(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label">Bio</label>
                    <textarea 
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      placeholder="Fale um pouco sobre você..."
                      rows={4}
                      className="input-field w-full resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setModalEdicaoAberto(false)}
                    className="btn-ghost flex-1 py-3"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSalvarPerfil}
                    disabled={carregando}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    {carregando && <Loader2 className="animate-spin" size={18} />}
                    Salvar
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

const StoryCard = ({ historia }: { historia: any }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="card-story cursor-pointer group"
    >
      <div className="aspect-[2/3] relative bg-[var(--bg)] overflow-hidden">
        {historia.capa ? (
          <img 
            src={historia.capa} 
            alt={historia.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-[var(--accent)]/10 flex items-center justify-center">
            <Book size={48} className="text-[var(--accent)] opacity-40" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <h3 className="font-bold font-serif text-sm line-clamp-1">{historia.title}</h3>
        <p className="text-xs opacity-60 line-clamp-2 leading-relaxed font-sans">
          {historia.description || historia.content || 'Sem descrição disponível.'}
        </p>
      </div>
    </motion.div>
  );
};
