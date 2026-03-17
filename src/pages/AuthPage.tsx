import React, { useState } from 'react';
import { supabase, Usuario } from '../services/supabase';
import { LogIn, UserPlus, Mail, Lock, User, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthPageProps {
  onLogin: (user: Usuario) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login direto na tabela usuarios (conforme solicitado, sem criptografia por agora)
        const { data, error: loginError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', formData.email)
          .eq('senha', formData.senha)
          .maybeSingle();

        if (loginError) {
          console.error('Erro detalhado do Supabase (Login):', loginError);
          throw new Error(`Erro ao entrar: ${loginError.message}`);
        }

        if (!data) {
          throw new Error('Email ou senha incorretos.');
        }

        if (data.banido) {
          throw new Error('Este usuário está banido.');
        }

        onLogin(data as Usuario);
      } else {
        // Cadastro
        if (!formData.nome || !formData.email || !formData.senha) {
          throw new Error('Preencha todos os campos.');
        }

        // Verificar se já existe
        const { data: existing, error: checkError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle();

        if (checkError) {
          console.error('Erro ao verificar usuário existente:', checkError);
        }

        if (existing) {
          throw new Error('Este email já está cadastrado.');
        }

        const newUser = {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          idioma: 'pt',
          banido: false,
          criado_em: new Date().toISOString(),
          foto: '',
          bio: ''
        };

        const { data, error: registerError } = await supabase
          .from('usuarios')
          .insert([newUser])
          .select()
          .single();

        if (registerError) {
          console.error('Erro detalhado do Supabase (Cadastro):', registerError);
          throw new Error(`Erro ao cadastrar: ${registerError.message}`);
        }

        if (!data) {
          throw new Error('Erro ao cadastrar usuário: Nenhum dado retornado.');
        }

        onLogin(data as Usuario);
      }
    } catch (err: any) {
      console.error('Erro capturado no handleSubmit:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-[var(--accent)] rounded-2xl text-white">
              <Sparkles size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-serif">Inkwell</h1>
          <p className="opacity-60 text-sm">
            {isLogin ? 'Bem-vindo de volta, escritor.' : 'Comece sua jornada literária.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-50 ml-1">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                <input 
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Seu nome"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 focus:border-[var(--accent)] outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase opacity-50 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 focus:border-[var(--accent)] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase opacity-50 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
              <input 
                type="password"
                required
                value={formData.senha}
                onChange={e => setFormData({ ...formData, senha: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 focus:border-[var(--accent)] outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Entrar' : 'Cadastrar'}
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition-all"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre agora'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
