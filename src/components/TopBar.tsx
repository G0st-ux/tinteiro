import React from 'react';
import { Menu, X, Bell, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../firebase';

interface TopBarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  usuario?: UserProfile | null;
  unreadCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ isOpen, setIsOpen, usuario, unreadCount = 0 }) => {
  const navigate = useNavigate();
  const nomeUsuario = usuario?.nome || usuario?.email?.split('@')[0] || 'Escritor';

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
      className="fixed top-0 left-0 right-0 lg:left-[80px] h-20 z-40 flex items-center justify-between px-8 bg-[#0F0F15]/80 backdrop-blur-md border-b border-[var(--border)]"
    >
      <div className="flex items-center gap-6">
        <button 
          className="lg:hidden p-3 hover:bg-white/5 rounded-2xl transition-all active:scale-90"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={22} className="text-[var(--primary)]" /> : <Menu size={22} className="text-white" />}
        </button>
        <div className="hidden lg:block">
          <div className="flex flex-col">
            <h2 className="text-2xl font-serif font-bold text-white">Bem-vindo, <span className="text-[var(--primary)]">{nomeUsuario}</span></h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/notificacoes')}
          className="p-3 hover:bg-white/5 rounded-2xl transition-all relative group"
        >
          <Bell size={20} className="text-gray-400 group-hover:text-[var(--primary)] transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[var(--primary)] rounded-full border-2 border-[#0F0F15]" />
          )}
        </button>
        
        <div 
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-4 pl-2 group cursor-pointer"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white group-hover:text-[var(--primary)] transition-colors">{nomeUsuario}</p>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 bg-white/5 flex items-center justify-center group-hover:border-[var(--primary)] transition-all duration-500">
            {usuario?.foto ? (
              <img src={usuario.foto} alt={nomeUsuario} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} className="text-gray-400 group-hover:text-[var(--primary)] transition-colors" />
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
