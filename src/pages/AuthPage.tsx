import React, { useState } from 'react';
import { loginWithGoogle, UserProfile } from '../firebase';
import { LogIn, Sparkles, Loader2, PenTool, Globe, BookOpen, Feather } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthPageProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(`Erro ao realizar login: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden relative font-serif">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.15 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1920" 
          alt="Writing Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_80%)]" />
      </div>

      {/* Atmospheric Glows */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/20 blur-[150px] rounded-full" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1],
          x: [0, -50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-900/20 blur-[180px] rounded-full" 
      />

      <div className="max-w-5xl w-full px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Brand & Vision */}
        <div className="hidden lg:block space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
              <Sparkles size={14} className="text-accent" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-sans text-white/60">Versão 2.0 • Premium</span>
            </div>
            <h1 className="text-8xl font-black tracking-tighter text-white leading-none mb-6">
              INK<span className="text-accent">WELL</span>
            </h1>
            <p className="text-2xl text-white/60 leading-relaxed max-w-md italic">
              "As palavras são a única coisa que sobrevive ao tempo. No Inkwell, nós as tornamos imortais."
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="grid grid-cols-2 gap-8 pt-12 border-t border-white/5"
          >
            <div className="space-y-2">
              <h3 className="text-accent font-sans font-bold text-xs uppercase tracking-widest">Escrita IA</h3>
              <p className="text-white/40 text-sm">Co-autoria inteligente para superar qualquer bloqueio.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-accent font-sans font-bold text-xs uppercase tracking-widest">Biblioteca</h3>
              <p className="text-white/40 text-sm">Organize seu universo literário com elegância absoluta.</p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="perspective-1000"
        >
          <div className="glass-dark p-10 lg:p-14 rounded-[3rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10 space-y-10">
              <div className="text-center lg:text-left space-y-4">
                <div className="lg:hidden inline-flex w-16 h-16 bg-accent rounded-2xl items-center justify-center mb-6 shadow-2xl shadow-accent/20">
                  <PenTool size={28} className="text-black" />
                </div>
                <h2 className="text-4xl font-bold text-white tracking-tight">Bem-vindo de volta</h2>
                <p className="text-white/40 text-sm font-sans tracking-wide">Inicie sua sessão para continuar sua obra-prima.</p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl text-center font-sans"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full group/btn relative flex items-center justify-center gap-4 py-5 bg-white text-black rounded-2xl font-bold text-sm transition-all duration-500 hover:bg-accent hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 overflow-hidden shadow-xl"
                >
                  <div className="relative z-10 flex items-center gap-4">
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        <span className="font-sans uppercase tracking-wider">Entrar com Google</span>
                      </>
                    )}
                  </div>
                </button>
                
                <p className="text-center text-[10px] text-white/20 font-sans uppercase tracking-[0.2em] pt-4">
                  Ao entrar, você concorda com nossos termos de serviço.
                </p>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-white/5 opacity-30 group-hover:opacity-60 transition-opacity duration-1000">
                <Feather size={20} className="text-white" />
                <div className="w-12 h-[1px] bg-white/20" />
                <BookOpen size={20} className="text-white" />
                <div className="w-12 h-[1px] bg-white/20" />
                <Globe size={20} className="text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8 opacity-20"
      >
        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-white" />
        <span className="text-[10px] uppercase tracking-[0.8em] font-sans">Santuário Literário</span>
        <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-white" />
      </motion.div>
    </div>
  );
};
