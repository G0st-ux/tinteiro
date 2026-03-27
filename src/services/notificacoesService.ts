import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function criarNotificacao(
  usuarioId: string,      // quem vai receber
  tipo: 'seguidor' | 'curtida' | 'comentario' | 'colaboracao',
  mensagem: string,       // texto da notificação
  link?: string           // rota para navegar ao clicar
) {
  try {
    await addDoc(collection(db, 'notificacoes'), {
      usuario_id: usuarioId,
      tipo,
      mensagem,
      titulo: tipo === 'seguidor' ? 'Novo Seguidor' : 'Nova Interação',
      lida: false,
      link: link || '',
      criado_em: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9) // Simple ID for now
    });
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
  }
}
