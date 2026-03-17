import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Bell, UserPlus, Heart, MessageCircle, Users, 
  CheckCheck, Loader2, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: 'seguidor' | 'curtida' | 'comentario' | 'colaboracao';
  mensagem: string;
  lida: boolean;
  link: string;
  criado_em: string;
}

interface NotificacoesProps {
  usuario: { id: string; nome: string; foto?: string; };
  t: any;
}

export const Notificacoes: React.FC<NotificacoesProps> = ({ usuario, t }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  const buscarNotificacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotificacoes(data || []);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarNotificacoes();
  }, [usuario.id]);

  const marcarComoLida = async (notificacao: Notificacao) => {
    if (notificacao.lida) return;
    
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacao.id);

      if (error) throw error;
      
      setNotificacoes(prev => 
        prev.map(n => n.id === notificacao.id ? { ...n, lida: true } : n)
      );
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', usuario.id)
        .eq('lida', false);

      if (error) throw error;

      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  const formatarDataRelativa = (dataISO: string) => {
    const data = new Date(dataISO);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffSegundos = Math.floor(diffMs / 1000);
    const diffMinutos = Math.floor(diffSegundos / 60);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffSegundos < 60) return 'agora mesmo';
    if (diffMinutos < 60) return `há ${diffMinutos} min`;
    if (diffHoras < 24) return `há ${diffHoras} h`;
    if (diffDias === 1) return 'ontem';
    if (diffDias < 7) return `há ${diffDias} dias`;
    return data.toLocaleDateString();
  };

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'seguidor': return <UserPlus className="text-emerald-500" size={20} />;
      case 'curtida': return <Heart className="text-rose-500" size={20} />;
      case 'comentario': return <MessageCircle className="text-blue-500" size={20} />;
      case 'colaboracao': return <Users className="text-purple-500" size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const temNaoLidas = notificacoes.some(n => !n.lida);

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-in pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--accent)] text-white rounded-2xl shadow-lg shadow-[var(--accent)]/20">
            <Bell size={28} />
          </div>
          <h1 className="text-3xl font-bold font-serif">Notificações</h1>
        </div>

        {temNaoLidas && (
          <button 
            onClick={marcarTodasComoLidas}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all"
          >
            <CheckCheck size={18} />
            Marcar todas como lidas
          </button>
        )}
      </header>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-40">
          <Bell size={64} />
          <p className="text-xl font-medium italic">Nenhuma notificação ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((notificacao) => (
            <div 
              key={notificacao.id}
              onClick={() => {
                marcarComoLida(notificacao);
                if (notificacao.link) navigate(notificacao.link);
              }}
              className={`
                group flex items-center gap-4 p-5 rounded-3xl border border-[var(--border)] transition-all cursor-pointer
                ${notificacao.lida ? 'bg-[var(--card)]' : 'bg-[var(--accent)]/5 border-[var(--accent)]/20 shadow-sm'}
                hover:shadow-md hover:border-[var(--accent)]/30
              `}
            >
              <div className={`
                p-3 rounded-2xl
                ${notificacao.lida ? 'bg-[var(--bg)]' : 'bg-white shadow-sm'}
              `}>
                {getIcone(notificacao.tipo)}
              </div>

              <div className="flex-1 space-y-1">
                <p className={`text-sm leading-relaxed ${notificacao.lida ? 'opacity-80' : 'font-medium'}`}>
                  {notificacao.mensagem}
                </p>
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                  {formatarDataRelativa(notificacao.criado_em)}
                </span>
              </div>

              {!notificacao.lida && (
                <div className="w-2.5 h-2.5 bg-[var(--accent)] rounded-full shadow-lg shadow-[var(--accent)]/40" />
              )}
              
              <ChevronRight size={18} className="opacity-0 group-hover:opacity-40 transition-all -translate-x-2 group-hover:translate-x-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
