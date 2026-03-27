import React from 'react';
import { Edit3, Users, Book, Quote, BookOpen, Type, ArrowRight, Sparkles, PenTool, Library, Zap, Image as ImageIcon, Map } from 'lucide-react';
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
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-32"
    >
      {/* Hero Section */}
      <motion.header variants={item} className="relative py-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="font-serif text-5xl font-bold text-white">
              Olá, <span className="text-[var(--primary)]">{nomeUsuario}</span>!
            </h1>
            <p className="text-gray-400 text-lg">Pronto para escrever sua próxima grande história?</p>
          </div>
          
          <Link to="/editor" className="btn-primary flex items-center gap-2">
            <PenTool size={20} />
            <span>Novo Manuscrito</span>
          </Link>
        </div>
      </motion.header>

      {/* Stats Section */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Obras", value: stories.length, icon: Book },
          { label: "Personagens", value: characters.length, icon: Users },
          { label: "Letras", value: totalChars > 1000 ? (totalChars / 1000).toFixed(1) + 'k' : totalChars, icon: Type },
        ].map((stat, i) => (
          <div key={i} className="card-ink p-6 flex items-center gap-4">
            <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Quote Section */}
      <motion.div variants={item} className="card-ink p-8 bg-gradient-to-r from-[var(--primary)] to-purple-800 text-white">
        <Quote size={32} className="mb-4 opacity-50" />
        <p className="font-serif text-2xl italic mb-4">"{quote.text}"</p>
        <p className="font-sans text-sm font-semibold opacity-80">— {quote.author}</p>
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
              { to: "/image-gen", icon: ImageIcon, label: "Visão Onírica" },
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
    </motion.div>
  );
};
