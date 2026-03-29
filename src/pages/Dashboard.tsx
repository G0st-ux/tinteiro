import React from 'react';
import { Users, Book, Type, Quote, ArrowRight, Sparkles, PenTool, Zap, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'motion/react';
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
  const nomeUsuario = usuario?.nome || usuario?.name || usuario?.email?.split('@')[0] || 'Escritor';

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-32"
    >
      {/* Hero Section */}
      <motion.header variants={item} className="hero-section">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Olá, {nomeUsuario}!</h1>
          <p className="text-sm opacity-80">Pronto para escrever sua próxima grande história?</p>
        </div>

        {/* Quote Card inside Hero */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-white shadow-lg border border-white/10 mt-6">
          <p className="text-sm font-medium italic">"{quote.text}"</p>
          <p className="text-xs opacity-70 mt-2">— {quote.author}</p>
        </div>
      </motion.header>

      <div className="main-content">
        {/* Stats Section - Side by Side */}
        <motion.div variants={item} className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "Obras", value: stories.length, icon: Book, to: "/library" },
            { label: "Personagens", value: characters.length, icon: Users, to: "/characters" },
            { label: "Letras", value: totalChars > 1000 ? (totalChars / 1000).toFixed(1) + 'k' : totalChars, icon: Type, to: "/library" },
          ].map((stat, i) => (
            <Link 
              key={i} 
              to={stat.to}
              className="card-ink p-6 flex flex-col items-center gap-4 hover:border-[var(--primary)] transition-all"
            >
              <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                <stat.icon size={24} />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <motion.section variants={item} className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-white">Manuscritos Recentes</h2>
            
            <div className="grid gap-6">
              {recentStories.length > 0 ? (
                recentStories.map((story) => (
                  <Link 
                    key={story.id} 
                    to={`/editor?id=${story.id}`}
                    className="card-ink p-6 flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-[var(--primary)] transition-colors mb-2">{story.title || "Sem título"}</h3>
                      <p className="text-sm text-gray-400">Editado em {new Date(story.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <ArrowRight className="text-gray-600 group-hover:text-[var(--primary)] transition-colors" />
                  </Link>
                ))
              ) : (
                <div className="card-ink p-12 text-center text-gray-400">
                  Nenhum manuscrito recente.
                </div>
              )}
            </div>
          </motion.section>

          <motion.section variants={item} className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-white">Ferramentas</h2>
            <div className="grid gap-4">
              {[
                { to: "/ai-chat", icon: Sparkles, label: "Oráculo de IA" },
                { to: "/generator", icon: Zap, label: "Forja de Tramas" },
                { to: "/world", icon: Map, label: "Cartografia" },
              ].map((action) => (
                <Link 
                  key={action.to} 
                  to={action.to}
                  className="card-ink p-4 flex items-center gap-4 hover:border-[var(--primary)]"
                >
                  <div className="p-2 bg-white/5 rounded-xl text-[var(--primary)]">
                    <action.icon size={20} />
                  </div>
                  <p className="font-semibold text-white">{action.label}</p>
                </Link>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};
