import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
  User, Pencil, Book, Heart, Users, 
  Camera, X, Loader2, BookOpen, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { criarNotificacao } from '../services/notificacoesService';

interface ProfilePageProps {
  usuario: {
    id: string;
    nome: string;
    email: string;
    foto?: string;
    bio?: string;
    idioma?: string;
  };
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
      if (perfilId !== usuario.id) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', perfilId)
          .single();
        
        if (userError) throw userError;
        setPerfilVisualizado(userData);
      } else {
        setPerfilVisualizado(usuario);
      }

      // Buscar histórias do usuário
      const { data: storiesData } = await supabase
        .from('historias')
        .select('*')
        .eq('autor_id', perfilId);
      setHistorias(storiesData || []);

      // Buscar favoritos
      const { data: favsData } = await supabase
        .from('favoritos')
        .select('*, historias(*)')
        .eq('usuario_id', perfilId);
      setFavoritos(favsData?.map(f => f.historias).filter(Boolean) || []);

      // Contar seguidores
      const { count: followersCount } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguido_id', perfilId);
      setSeguidores(followersCount || 0);

      // Contar seguindo
      const { count: followingCount } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguidor_id', perfilId);
      setSeguindo(followingCount || 0);

      // Verificar se já segue (se não for o próprio perfil)
      if (perfilId !== usuario.id) {
        const { data: followData } = await supabase
          .from('seguidores')
          .select('*')
          .eq('seguidor_id', usuario.id)
          .eq('seguido_id', perfilId)
          .maybeSingle();
        setJaSeguindo(!!followData);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setCarregando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    const idParaCarregar = perfilIdParam || usuario.id;
    carregarDadosPerfil(idParaCarregar);
  }, [perfilIdParam, usuario.id, carregarDadosPerfil]);

  const handleSeguir = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const meuId = usuario?.id || (usuario as any)?.uid;
    if (!meuId) return;

    if (processandoSeguir) return;
    setProcessandoSeguir(true);

    try {
      if (jaSeguindo) {
        const { error } = await supabase
          .from('seguidores')
          .delete()
          .eq('seguidor_id', meuId)
          .eq('seguido_id', perfilVisualizado.id);
        
        if (error) throw error;
        setSeguidores(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('seguidores')
          .insert({ seguidor_id: meuId, seguido_id: perfilVisualizado.id });
        
        if (error) throw error;
        setSeguidores(prev => prev + 1);
        
        await criarNotificacao(
          perfilVisualizado.id,
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
      const updates = {
        nome: editNome,
        bio: editBio,
        foto: editFoto
      };

      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', usuario.id)
        .select()
        .single();

      if (error) throw error;

      setUsuario(data);
      setPerfilVisualizado(data);
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
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Foto */}
          <div className="relative">
            {perfilVisualizado.foto ? (
              <img 
                src={perfilVisualizado.foto} 
                alt={perfilVisualizado.nome}
                className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-3xl font-bold">
                {perfilVisualizado.nome.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-bold font-serif">{perfilVisualizado.nome}</h1>
              <p className="opacity-60 text-sm">{perfilVisualizado.email}</p>
            </div>

            {perfilVisualizado.bio && (
              <p className="text-sm max-w-lg">{perfilVisualizado.bio}</p>
            )}

            {/* Contadores */}
            <div className="flex justify-center md:justify-start gap-8">
              <div className="text-center">
                <p className="font-bold text-lg">{historias.length}</p>
                <p className="text-xs opacity-60 uppercase font-bold tracking-wider">Histórias</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{seguidores}</p>
                <p className="text-xs opacity-60 uppercase font-bold tracking-wider">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{seguindo}</p>
                <p className="text-xs opacity-60 uppercase font-bold tracking-wider">Seguindo</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {perfilVisualizado.id === usuario.id ? (
              <button 
                onClick={() => setModalEdicaoAberto(true)}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl hover:opacity-90 transition-all font-bold text-sm"
              >
                <Pencil size={16} />
                Editar perfil
              </button>
            ) : (
              <button 
                onClick={(e) => handleSeguir(e)}
                disabled={processandoSeguir}
                className={`relative z-10 flex items-center justify-center gap-2 px-8 py-2 rounded-xl font-bold text-sm transition-all ${
                  jaSeguindo 
                    ? 'border border-[var(--border)] opacity-70' 
                    : 'bg-emerald-500 text-white'
                } ${processandoSeguir ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
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
              className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl space-y-6"
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
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">Nome</label>
                    <input 
                      type="text"
                      value={editNome}
                      onChange={e => setEditNome(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase opacity-50 ml-1">Bio</label>
                    <textarea 
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      placeholder="Fale um pouco sobre você..."
                      rows={4}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setModalEdicaoAberto(false)}
                    className="flex-1 py-3 border border-[var(--border)] rounded-xl font-bold hover:bg-[var(--bg)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSalvarPerfil}
                    disabled={carregando}
                    className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
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
      whileHover={{ scale: 1.05 }}
      className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm cursor-pointer group"
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
          <div className="w-full h-full bg-[var(--accent)]/10 flex items-center justify-center">
            <Book size={48} className="text-[var(--accent)] opacity-40" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <h3 className="font-bold text-sm line-clamp-1">{historia.titulo}</h3>
        <p className="text-xs opacity-60 line-clamp-2 leading-relaxed">
          {historia.descricao || 'Sem descrição disponível.'}
        </p>
      </div>
    </motion.div>
  );
};
