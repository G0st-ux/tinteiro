import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { 
  ArrowLeft, Heart, Book, MessageSquare, Eye, Share2, 
  ChevronLeft, ChevronRight, Send, Loader2, User, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { criarNotificacao } from '../services/notificacoesService';

interface LeitorHistoriaProps {
  historia?: any;
  usuario: { id: string; nome: string; foto?: string; } | null;
  onVoltar?: () => void;
  t: any;
}

export const LeitorHistoria: React.FC<LeitorHistoriaProps> = ({ historia: historiaProp, usuario, onVoltar, t }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historia, setHistoria] = useState<any>(historiaProp);
  const [capitulos, setCapitulos] = useState<any[]>([]);
  const [capituloAtual, setCapituloAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [curtido, setCurtido] = useState(false);
  const [favoritado, setFavoritado] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(0);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [lendo, setLendo] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Incrementar visualizações
      await supabase
        .from('historias')
        .update({ visualizacoes: (historia.visualizacoes || 0) + 1 })
        .eq('id', historia.id);

      // Buscar capítulos publicados
      const { data: caps } = await supabase
        .from('capitulos')
        .select('*')
        .eq('historia_id', historia.id)
        .eq('status', 'publicado')
        .order('ordem', { ascending: true });
      setCapitulos(caps || []);

      // Buscar curtidas totais
      const { count: likesCount } = await supabase
        .from('curtidas')
        .select('*', { count: 'exact', head: true })
        .eq('historia_id', historia.id);
      setTotalCurtidas(likesCount || 0);

      if (usuario) {
        // Verificar se curtiu
        const { data: like } = await supabase
          .from('curtidas')
          .select('*')
          .eq('historia_id', historia.id)
          .eq('usuario_id', usuario.id)
          .maybeSingle();
        setCurtido(!!like);

        // Verificar se favoritou
        const { data: fav } = await supabase
          .from('favoritos')
          .select('*')
          .eq('historia_id', historia.id)
          .eq('usuario_id', usuario.id)
          .maybeSingle();
        setFavoritado(!!fav);
      }

      // Carregar comentários
      carregarComentarios();
    } catch (error) {
      console.error('Erro ao carregar dados da história:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarComentarios = async () => {
    const { data } = await supabase
      .from('comentarios')
      .select('*, usuarios(nome, foto)')
      .eq('historia_id', historia.id)
      .order('criado_em', { ascending: false });
    setComentarios(data || []);
  };

  useEffect(() => {
    const carregarHistoria = async () => {
      if (!historia && id) {
        const { data, error } = await supabase
          .from('historias')
          .select('*, usuarios(nome, foto)')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Erro ao carregar história:', error);
          navigate('/explorar');
          return;
        }
        setHistoria(data);
      }
    };
    carregarHistoria();
  }, [id, historia, navigate]);

  useEffect(() => {
    if (historia?.id) {
      carregarDados();
    }
  }, [historia?.id, usuario?.id]);

  const handleCurtir = async () => {
    if (!usuario) return alert('Faça login para curtir!');
    try {
      if (curtido) {
        await supabase.from('curtidas').delete().eq('historia_id', historia.id).eq('usuario_id', usuario.id);
        setTotalCurtidas(prev => prev - 1);
      } else {
        await supabase.from('curtidas').insert({ historia_id: historia.id, usuario_id: usuario.id });
        setTotalCurtidas(prev => prev + 1);
        
        await criarNotificacao(
          historia.autor_id,
          'curtida',
          `${usuario.nome} curtiu sua história "${historia.titulo}"!`,
          `/leitor/${historia.id}`
        );
      }
      setCurtido(!curtido);
    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  const handleFavoritar = async () => {
    if (!usuario) return alert('Faça login para favoritar!');
    try {
      if (favoritado) {
        await supabase.from('favoritos').delete().eq('historia_id', historia.id).eq('usuario_id', usuario.id);
      } else {
        await supabase.from('favoritos').insert({ historia_id: historia.id, usuario_id: usuario.id });
      }
      setFavoritado(!favoritado);
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  };

  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !novoComentario.trim()) return;
    setEnviandoComentario(true);

    try {
      const { error } = await supabase.from('comentarios').insert({
        historia_id: historia.id,
        capitulo_id: capitulos[capituloAtual]?.id,
        usuario_id: usuario.id,
        texto: novoComentario.trim()
      });

      if (error) throw error;
      setNovoComentario('');
      carregarComentarios();
      
      await criarNotificacao(
        historia.autor_id,
        'comentario',
        `${usuario.nome} comentou na sua história "${historia.titulo}"!`,
        `/leitor/${historia.id}`
      );
    } catch (error) {
      console.error('Erro ao comentar:', error);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const scrollParaTopo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  if (carregando && !historia) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
      </div>
    );
  }

  if (!historia) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12 fade-in pb-20">
      {/* HEADER DA HISTÓRIA (Capa e Info) */}
      {!lendo && (
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="aspect-[16/9] relative">
            {historia.capa ? (
              <img src={historia.capa} alt={historia.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--bg)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {historia.genero}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {historia.classificacao}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-serif text-white leading-tight">{historia.titulo}</h1>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      {historia.usuarios?.foto ? (
                        <img src={historia.usuarios.foto} alt={historia.usuarios.nome} className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <span className="font-bold">{historia.usuarios?.nome || 'Autor Desconhecido'}</span>
                  </div>
                  <div className="flex items-center gap-4 opacity-60">
                    <span className="flex items-center gap-1"><Eye size={14} /> {historia.visualizacoes || 0}</span>
                    <span className="flex items-center gap-1"><Heart size={14} /> {totalCurtidas}</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onVoltar ? onVoltar() : navigate('/explorar')}
              className="absolute top-6 left-6 p-3 bg-black/20 backdrop-blur-md text-white rounded-2xl hover:bg-black/40 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
          
          <div className="p-8 md:p-12 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-serif opacity-40 uppercase tracking-widest">Sinopse</h2>
              <p className="text-lg leading-relaxed opacity-80 whitespace-pre-wrap">
                {historia.descricao || 'Nenhuma descrição disponível.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => { setLendo(true); scrollParaTopo(); }}
                disabled={capitulos.length === 0}
                className="flex-1 min-w-[200px] py-5 bg-[var(--accent)] text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Book size={24} />
                {capitulos.length > 0 ? 'Começar a ler' : 'Em breve'}
              </button>
              <button 
                onClick={handleFavoritar}
                className={`p-5 rounded-2xl border transition-all ${favoritado ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-[var(--border)] opacity-60 hover:opacity-100'}`}
              >
                <Heart size={24} fill={favoritado ? 'currentColor' : 'none'} />
              </button>
              <button className="p-5 rounded-2xl border border-[var(--border)] opacity-60 hover:opacity-100 transition-all">
                <Share2 size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* LEITOR DE CAPÍTULO */}
      {lendo && capitulos.length > 0 && (
        <section className="space-y-8">
          {/* Header Fixo */}
          <div className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] -mx-6 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setLendo(false)} className="p-2 hover:bg-[var(--card)] rounded-xl transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="font-bold text-sm line-clamp-1">{historia.titulo}</h3>
                <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">
                  Capítulo {capituloAtual + 1} de {capitulos.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleFavoritar}
                className={`p-2 rounded-xl transition-all ${favoritado ? 'text-red-500' : 'opacity-40 hover:opacity-100'}`}
              >
                <Heart size={20} fill={favoritado ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Conteúdo do Capítulo */}
          <div ref={contentRef} className="max-w-[680px] mx-auto space-y-12 py-12">
            <div className="text-center space-y-4">
              <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-[0.3em]">Capítulo {capitulos[capituloAtual].ordem}</span>
              <h2 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
                {capitulos[capituloAtual].titulo}
              </h2>
              <div className="w-12 h-1 bg-[var(--accent)]/20 mx-auto rounded-full" />
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-[1.8] prose-p:text-[1.1rem] prose-p:mb-8 opacity-90">
              <Markdown>{capitulos[capituloAtual].conteudo}</Markdown>
            </div>

            {/* Navegação e Curtida */}
            <div className="pt-20 border-t border-[var(--border)] space-y-12">
              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={handleCurtir}
                  className={`flex flex-col items-center gap-2 group transition-all ${curtido ? 'text-red-500' : 'opacity-40 hover:opacity-100'}`}
                >
                  <div className={`p-6 rounded-full border-2 transition-all ${curtido ? 'bg-red-500/10 border-red-500 scale-110' : 'border-[var(--border)] group-hover:scale-110'}`}>
                    <Heart size={32} fill={curtido ? 'currentColor' : 'none'} />
                  </div>
                  <span className="font-bold">{totalCurtidas} curtidas</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={() => { setCapituloAtual(prev => prev - 1); scrollParaTopo(); }}
                  disabled={capituloAtual === 0}
                  className="flex items-center gap-2 px-6 py-3 border border-[var(--border)] rounded-2xl font-bold text-sm hover:bg-[var(--card)] transition-all disabled:opacity-20"
                >
                  <ChevronLeft size={20} /> Anterior
                </button>
                <button 
                  onClick={() => {
                    if (capituloAtual < capitulos.length - 1) {
                      setCapituloAtual(prev => prev + 1);
                      scrollParaTopo();
                    } else {
                      setLendo(false);
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                >
                  {capituloAtual < capitulos.length - 1 ? 'Próximo Capítulo' : 'Finalizar Leitura'}
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* COMENTÁRIOS */}
            <section className="pt-20 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold font-serif">Comentários</h3>
                <span className="text-sm opacity-40 font-bold uppercase tracking-widest">{comentarios.length}</span>
              </div>

              {usuario ? (
                <form onSubmit={handleEnviarComentario} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex-shrink-0 overflow-hidden">
                    {usuario.foto ? <img src={usuario.foto} alt={usuario.nome} className="w-full h-full object-cover" /> : <User className="m-auto mt-2" size={20} />}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={novoComentario}
                      onChange={e => setNovoComentario(e.target.value)}
                      placeholder="O que achou deste capítulo?"
                      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-6 py-3 pr-12 outline-none focus:border-[var(--accent)] transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={enviandoComentario || !novoComentario.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all disabled:opacity-20"
                    >
                      {enviandoComentario ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-center opacity-60 italic text-sm">
                  Faça login para deixar um comentário.
                </div>
              )}

              <div className="space-y-6">
                {comentarios.length > 0 ? (
                  comentarios.map((comentario) => (
                    <div key={comentario.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex-shrink-0 overflow-hidden">
                        {comentario.usuarios?.foto ? (
                          <img src={comentario.usuarios.foto} alt={comentario.usuarios.nome} className="w-full h-full object-cover" />
                        ) : (
                          <User className="m-auto mt-2 opacity-40" size={20} />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{comentario.usuarios?.nome}</span>
                          <span className="text-[10px] opacity-40 flex items-center gap-1">
                            <Clock size={10} /> {new Date(comentario.criado_em).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed">{comentario.texto}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 opacity-30 italic text-sm">
                    Seja o primeiro a comentar!
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      )}
    </div>
  );
};
