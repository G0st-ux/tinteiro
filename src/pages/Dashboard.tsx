import React from 'react';
import { Edit3, Users, Book, Quote, BookOpen, Type } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QUOTES } from '../constants';
import { Story, Character } from '../types';

interface DashboardProps {
  t: any;
  stories: Story[];
  characters: Character[];
  usuario: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ t, stories, characters, usuario }) => {
  const [quote, setQuote] = React.useState(QUOTES[0]);

  React.useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  const totalChars = stories.reduce((acc, s) => acc + (s.charCount || 0), 0);
  const recentStories = [...stories].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const nomeUsuario = usuario?.nome || usuario?.name || usuario?.email?.split('@')[0] || 'escritor';

  const quickActions = [
    { to: "/editor", icon: Edit3, label: t.editor, color: "bg-blue-500" },
    { to: "/characters", icon: Users, label: t.characters, color: "bg-purple-500" },
    { to: "/library", icon: Book, label: t.library, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-8 fade-in">
      <header>
        <h1 className="text-4xl font-bold mb-2">Olá, {nomeUsuario}! ✨</h1>
        <p className="opacity-60">{t.slogan}</p>
      </header>

      {/* Quote */}
      <div className="inkwell-card bg-gradient-to-br from-[var(--accent)] to-[var(--card)] border-none text-white overflow-hidden relative">
        <Quote className="absolute -bottom-4 -right-4 opacity-10 w-32 h-32" />
        <div className="relative z-10">
          <p className="text-xl italic font-serif mb-4">"{quote.text}"</p>
          <p className="text-sm font-bold">— {quote.author}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="inkwell-card flex flex-col items-center justify-center p-4 text-center gap-1">
          <BookOpen size={22} className="text-[var(--accent)] opacity-80" />
          <span className="text-2xl font-bold text-[var(--accent)]">{stories.length}</span>
          <span className="text-xs opacity-50">{t.totalStories}</span>
        </div>
        <div className="inkwell-card flex flex-col items-center justify-center p-4 text-center gap-1">
          <Users size={22} className="text-[var(--accent)] opacity-80" />
          <span className="text-2xl font-bold text-[var(--accent)]">{characters.length}</span>
          <span className="text-xs opacity-50">{t.totalChars}</span>
        </div>
        <div className="inkwell-card flex flex-col items-center justify-center p-4 text-center gap-1">
          <Type size={22} className="text-[var(--accent)] opacity-80" />
          <span className="text-2xl font-bold text-[var(--accent)]">{totalChars.toLocaleString()}</span>
          <span className="text-xs opacity-50">{t.totalWords}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link 
            key={action.to} 
            to={action.to}
            className="inkwell-card flex items-center gap-4 hover:translate-y-[-4px] transition-transform"
          >
            <div className={`p-3 rounded-xl ${action.color} text-white`}>
              <action.icon size={24} />
            </div>
            <span className="font-bold">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Stories */}
      <section>
        <h2 className="text-2xl font-bold mb-4">{t.recentStories}</h2>
        <div className="space-y-4">
          {recentStories.length > 0 ? (
            recentStories.map((story) => (
              <Link 
                key={story.id} 
                to={`/editor?id=${story.id}`}
                className="inkwell-card flex justify-between items-center hover:border-[var(--accent)]"
              >
                <div>
                  <h3 className="font-bold text-lg">{story.title || "Sem título"}</h3>
                  <p className="text-xs opacity-50">
                    {new Date(story.updatedAt).toLocaleDateString()} • {story.charCount} letras
                  </p>
                </div>
                <Edit3 size={18} className="opacity-30" />
              </Link>
            ))
          ) : (
            <p className="opacity-50 italic">{t.noStories}</p>
          )}
        </div>
      </section>
    </div>
  );
};
