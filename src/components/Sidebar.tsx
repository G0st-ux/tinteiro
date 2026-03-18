import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  Home, Edit3, Book, MessageSquare, Zap, 
  Image as ImageIcon, Users, Map, Settings, Palette, Menu, X, LogOut, User,
  BookOpen, Globe, Bell, Search, Library, Sword, DoorOpen, Compass
} from 'lucide-react';
import { THEMES, TRANSLATIONS } from '../constants';
import { AppSettings } from '../types';

interface SidebarProps {
  usuario: { id: string; nome: string; foto?: string; } | null;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  t: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ usuario, settings, setSettings, t, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const buscarContagemNaoLidas = async () => {
    if (!usuario) return;
    try {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id)
        .eq('lida', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Erro ao buscar contagem de notificações:', err);
    }
  };

  useEffect(() => {
    buscarContagemNaoLidas();
    const interval = setInterval(buscarContagemNaoLidas, 30000);
    return () => clearInterval(interval);
  }, [usuario?.id]);

  const navItems = [
    { to: "/", icon: Home, label: t.home },
    { to: "/editor", icon: Edit3, label: t.editor },
    { to: "/library", icon: Book, label: t.library },
    { to: "/ai-chat", icon: MessageSquare, label: t.aiChat },
    { to: "/generator", icon: Zap, label: t.storyGen },
    { to: "/image-gen", icon: ImageIcon, label: t.imageGen },
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

  const activeTheme = THEMES[settings.theme as keyof typeof THEMES] || THEMES.midnight;

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-40 bg-[var(--card)] border-r border-[var(--border)] transition-transform duration-300
        w-64 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="p-6 flex items-center gap-3">
          <span className="text-2xl">🖋️</span>
          <div>
            <h1 className="text-xl font-bold font-serif text-[var(--accent)]">Inkwell</h1>
            <p className="text-[10px] opacity-60 uppercase tracking-widest">{t.slogan}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? 'bg-[var(--accent)] text-white shadow-lg' 
                  : 'hover:bg-[var(--bg)] opacity-70 hover:opacity-100'}
              `}
            >
              <div className="relative">
                <item.icon size={20} />
                {item.badge !== undefined && item.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--card)] shadow-lg">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-2 relative">
          <button 
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--bg)] transition-all opacity-70 hover:opacity-100"
          >
            <Palette size={20} />
            <span className="font-medium">{t.theme}</span>
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all opacity-70 hover:opacity-100"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>

          {showThemePicker && (
            <div className="absolute bottom-full left-4 right-4 mb-2 p-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl grid grid-cols-5 gap-2 z-50">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSettings({ ...settings, theme: key });
                    setShowThemePicker(false);
                  }}
                  title={theme.name}
                  className={`w-full aspect-square rounded-full border-2 ${settings.theme === key ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: theme.accent }}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
