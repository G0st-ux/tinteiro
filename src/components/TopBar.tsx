import React from 'react';
import { Menu, X } from 'lucide-react';

interface TopBarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--card)] border-b border-[var(--border)] z-40 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🖋️</span>
        <h1 className="text-xl font-bold font-serif text-[var(--accent)]">Inkwell</h1>
      </div>
      <button 
        className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
};
