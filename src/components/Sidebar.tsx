import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../firebase';
import { 
  Home, Edit3, Book, MessageSquare, Zap, 
  Users, Map, Settings, Palette, LogOut, User,
  BookOpen, Bell, Search, Compass, DoorOpen, Sword, PenTool
} from 'lucide-react';
import { THEMES } from '../constants';
import { AppSettings } from '../types';

interface SidebarProps {
  usuario: UserProfile | null;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  t: any;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ usuario, settings, setSettings, t, onLogout, isOpen, setIsOpen, unreadCount }) => {
  const [showThemePicker, setShowThemePicker] = useState(false);

  const navItems = [
    { to: "/", icon: Home, label: t.home },
    { to: "/editor", icon: Edit3, label: t.editor },
    { to: "/library", icon: Book, label: t.library },
    { to: "/ai-chat", icon: MessageSquare, label: t.aiChat },
    { to: "/generator", icon: Zap, label: t.storyGen },
    { to: "/minhas-historias", icon: BookOpen, label: "Minhas Histórias" },
    { to: "/explorar", icon: Compass, label: "Explorar" },
    { to: "/buscar", icon: Search, label: "Buscar" },
    { to: "/notificacoes", icon: Bell, label: "Notificações", badge: unreadCount },
    { to: "/salas", icon: DoorOpen, label: "Salas" },
    { to: "/characters", icon: Sword, label: t.characters },
    { to: "/world", icon: Map, label: t.world },
    { to: "/perfil", icon: User, label: "Perfil" },
    { to: "/settings", icon: Settings, label: t.settings },
  ];

  return (
    <>
      <motion.aside 
        initial={false}
        animate={{ 
          x: isOpen ? 0 : (window.innerWidth < 1024 ? -300 : 0),
          width: isOpen ? 260 : (window.innerWidth < 1024 ? 0 : 80)
        }}
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-all duration-300 ease-in-out
          bg-[#1A1A2E] border-r border-[var(--border)]
        `}
      >
        <div className="h-24 flex items-center px-6 mb-4 overflow-hidden shrink-0">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-purple-900/20">
            <PenTool size={20} className="text-white" />
          </div>
          <div className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className="text-xl font-serif font-bold text-white">Tinteiro</h1>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                relative flex items-center h-12 rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-purple-900/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <div className="w-[56px] flex items-center justify-center shrink-0">
                <item.icon size={20} />
              </div>
              <span className={`font-sans text-sm font-medium transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute top-2 right-4 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-700">
          <button 
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="w-full flex items-center h-12 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <div className="w-[56px] flex items-center justify-center shrink-0">
              <Palette size={20} />
            </div>
            <span className={`font-sans text-sm font-medium transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              Temas
            </span>
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center h-12 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all"
          >
            <div className="w-[56px] flex items-center justify-center shrink-0">
              <LogOut size={20} />
            </div>
            <span className={`font-sans text-sm font-medium transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              Sair
            </span>
          </button>
        </div>

        <AnimatePresence>
          {showThemePicker && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-4 right-4 p-4 bg-[#0F0F15] border border-[var(--border)] rounded-2xl grid grid-cols-4 gap-3 z-50"
            >
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSettings({ ...settings, theme: key });
                    setShowThemePicker(false);
                  }}
                  title={theme.name}
                  className={`w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 ${settings.theme === key ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: theme.accent }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
