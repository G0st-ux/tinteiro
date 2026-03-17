import { supabase } from './supabase';

export async function criarNotificacao(
  usuarioId: string,      // quem vai receber
  tipo: 'seguidor' | 'curtida' | 'comentario' | 'colaboracao',
  mensagem: string,       // texto da notificação
  link?: string           // rota para navegar ao clicar
) {
  try {
    const { error } = await supabase.from('notificacoes').insert({
      usuario_id: usuarioId,
      tipo,
      mensagem,
      lida: false,
      link: link || '',
    });
    if (error) throw error;
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
  }
}
