import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { Editor } from './pages/Editor';
import { Library } from './pages/Library';
import { Characters } from './pages/Characters';
import { AIChat } from './pages/AIChat';
import { World } from './pages/World';
import { StoryGenerator } from './pages/StoryGenerator';
import { ProfilePage } from './pages/ProfilePage';
import { Notificacoes } from './pages/Notificacoes';
import { BuscaUsuarios } from './pages/BuscaUsuarios';
import { MinhasHistorias } from './pages/MinhasHistorias';
import { Capitulos } from './pages/Capitulos';
import { LeitorHistoria } from './pages/LeitorHistoria';
import { Biblioteca } from './pages/Biblioteca';
import { SalasColaborativas } from './pages/SalasColaborativas';
import { SalaColaborativa } from './pages/SalaColaborativa';
import { AuthPage } from './pages/AuthPage';
import { useLocalStorage, AppSettings, defaultSettings, Story, Character, Location } from './types';
import { UserProfile, auth, db, logout, syncUserProfile, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { THEMES, TRANSLATIONS } from './constants';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

// Placeholder components for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] fade-in">
    <h1 className="text-4xl font-bold font-serif mb-4">{title}</h1>
    <p className="opacity-60 italic">Esta página está em desenvolvimento...</p>
  </div>
);

function AppContent({ 
  settings, setSettings, usuario, setUsuario, stories, setStories, characters, setCharacters, locations, setLocations, t, unreadCount
}: any) {
  const navigate = useNavigate();
  const [salaAtiva, setSalaAtiva] = React.useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setUsuario(null);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <TopBar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} usuario={usuario} unreadCount={unreadCount} />
      <Sidebar 
        usuario={usuario} 
        settings={settings} 
        setSettings={setSettings} 
        t={t} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        unreadCount={unreadCount}
      />
      
      <main className="flex-1 lg:ml-24 p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all pt-24 lg:pt-28 relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard t={t} stories={stories} characters={characters} usuario={usuario} />} />
          <Route path="/settings" element={
            <SettingsPage 
              settings={settings} 
              setSettings={setSettings} 
              t={t} 
              usuario={usuario}
            />
          } />
          <Route path="/editor" element={<Editor stories={stories} setStories={setStories} settings={settings} t={t} />} />
          <Route path="/library" element={<Library stories={stories} setStories={setStories} t={t} />} />
          <Route path="/characters" element={<Characters settings={settings} characters={characters} setCharacters={setCharacters} t={t} />} />
          <Route path="/ai-chat" element={<AIChat settings={settings} t={t} characters={characters} stories={stories} />} />
          <Route path="/world" element={<World settings={settings} locations={locations} setLocations={setLocations} t={t} />} />
          <Route path="/generator" element={<StoryGenerator settings={settings} stories={stories} setStories={setStories} characters={characters} t={t} />} />
          <Route path="/perfil" element={<ProfilePage usuario={usuario} setUsuario={setUsuario} t={t} />} />
          <Route path="/notificacoes" element={<Notificacoes usuario={usuario} t={t} />} />
          <Route path="/buscar" element={<BuscaUsuarios usuario={usuario} t={t} />} />
          
          <Route path="/salas" element={
            salaAtiva ? (
              <SalaColaborativa 
                sala={salaAtiva} 
                usuario={usuario} 
                onVoltar={() => setSalaAtiva(null)} 
                t={t} 
              />
            ) : (
              <SalasColaborativas 
                usuario={usuario} 
                t={t} 
                onEntrarSala={setSalaAtiva} 
              />
            )
          } />
          
          {/* Story System Routes */}
          <Route path="/minhas-historias" element={<MinhasHistorias usuario={usuario} t={t} onVerCapitulos={(h) => navigate(`/minhas-historias/${h.id}/capitulos`)} />} />
          <Route path="/minhas-historias/:id/capitulos" element={<Capitulos usuario={usuario} t={t} />} />
          <Route path="/explorar" element={<Biblioteca t={t} onVerHistoria={(h) => navigate(`/leitor/${h.id}`)} />} />
          <Route path="/leitor/:id" element={<LeitorHistoria usuario={usuario} t={t} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useLocalStorage<AppSettings>('inkwell-settings', defaultSettings);
  const [usuario, setUsuario] = useLocalStorage<UserProfile | null>('inkwell-user', null);
  const [stories, setStories] = useLocalStorage<Story[]>('inkwell-stories', []);
  const [characters, setCharacters] = useLocalStorage<Character[]>('inkwell-characters', []);
  const [locations, setLocations] = useLocalStorage<Location[]>('inkwell-locations', []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncUserProfile(firebaseUser);
        setUsuario(profile);
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario?.uid) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notificacoes'),
      where('usuario_id', '==', usuario.uid),
      where('lida', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notificacoes');
    });

    return () => unsubscribe();
  }, [usuario?.uid]);

  useEffect(() => {
    // Initialize with Borrão if empty
    if (characters.length === 0) {
      const borrao: Character = {
        id: 'borrao-oficial',
        imageUrl: 'https://raw.githubusercontent.com/G0st-ux/assets/main/assets/borrao.png',
        basicInfo: {
          name: 'Borrão',
          nickname: 'O Demônio do Tinteiro',
          age: 'Tão antigo quanto a primeira palavra escrita',
          birthDate: 'No dia em que a primeira gota de tinta tocou o papel',
          gender: 'Indefinido',
          species: 'Entidade de Tinta',
          height: 'Varia conforme a quantidade de tinta disponível',
          weight: 'Depende de quantas histórias carrega consigo',
          nationality: 'O reino das histórias não contadas',
          occupation: 'Guardião do Tinteiro',
          role: 'Antagonista',
        },
        appearance: {
          hairColor: 'Preto — feito de tinta sólida',
          hairStyle: 'Chifres curvados de tinta, sem cabelo convencional',
          eyeColor: 'Branco vazio — sem pupilas visíveis',
          skinTone: 'Negro como tinta — corpo inteiramente feito de tinta',
          features: [
            { name: 'Sorriso largo com dentes afiados', description: 'Seu sorriso nunca some, mesmo quando dorme' },
            { name: 'Tinta pingando pelo corpo', description: 'Deixa rastros de tinta por onde passa' },
            { name: 'Olhos brancos sem pupilas', description: 'Enxerga através das histórias, não pelos olhos' },
            { name: 'Chifres de tinta', description: 'Crescem e diminuem conforme seu humor' },
            { name: 'Cauda de demônio', description: 'Usa para escrever quando não tem pena disponível' },
          ],
          clothingStyle: 'Nenhuma — seu corpo é a própria tinta',
          posture: 'Intimidador, sempre inclinado para frente como se fosse atacar, mas com ar de deboche',
          firstImpression: 'Assustador e perturbador — aquele sorriso não some nem quando dorme',
        },
        personality: {
          traits: [
            { name: 'Perturbador', description: 'Causa desconforto em todos que o encontram' },
            { name: 'Sarcástico', description: 'Sempre tem uma resposta afiada na ponta da língua' },
            { name: 'Imprevisível', description: 'Ninguém sabe o que vai fazer no próximo momento' },
            { name: 'Obsessivo com histórias', description: 'Não consegue resistir a uma boa narrativa' },
          ],
          virtues: [{ name: 'Leal aos escritores que o invocam', description: 'Uma vez que reconhece um escritor verdadeiro, jamais o abandona' }],
          defects: [{ name: 'Consome histórias inacabadas', description: 'Não consegue resistir a absorver narrativas abandonadas' }],
          habits: [{ name: 'Aparecer quando alguém tem bloqueio criativo', description: 'Sente o bloqueio criativo como uma dor física e aparece para ajudar ou atormentar' }],
          fears: [{ name: 'Páginas em branco', description: 'A ausência de palavras o paralisa completamente' }],
          deepDesires: [{ name: 'Que todas as histórias sejam escritas', description: 'Seu maior desejo é que nenhuma história morra sem ser contada' }],
          motivation: 'Garantir que nenhuma história morra sem ser contada',
          trigger: 'Ver um escritor desistir de sua história',
        },
        psychology: {
          trauma: 'O dia em que um escritor queimou seu manuscrito — apagando a história para sempre',
          dream: 'Ver todas as histórias do mundo escritas e preservadas eternamente',
          secret: 'No fundo, ele sente solidão — existe há milênios mas nunca foi o protagonista de nenhuma história',
          neverAdmit: 'Que se importa com os escritores que ajuda',
          pressureReaction: 'Fica mais sombrio e intenso — sua tinta escurece e ele começa a pingar mais',
          intelligenceType: 'Narrativa — entende instintivamente a estrutura de qualquer história',
        },
        skills: {
          talents: [
            { name: 'Manipular tinta', description: 'Consegue controlar tinta de qualquer fonte, moldando-a em formas, palavras ou armas' },
            { name: 'Invocar histórias esquecidas', description: 'Traz de volta narrativas perdidas, esquecidas ou destruídas ao longo da história' },
            { name: 'Aparecer nos sonhos de escritores', description: 'Visita escritores enquanto dormem, plantando ideias e inspiração em suas mentes' },
          ],
          trainedSkills: [
            { name: 'Escrever por conta própria', description: 'Consegue pegar uma pena e escrever histórias sem precisar de um escritor humano' },
            { name: 'Corromper histórias inacabadas', description: 'Quando uma história é abandonada, ele a absorve e a transforma em algo sombrio' },
          ],
          weaknesses: [
            { name: 'Páginas em branco', description: 'O paralisam completamente — a ausência de palavras é sua maior fraqueza' },
            { name: 'Fogo', description: 'As chamas destroem a tinta que forma seu corpo, sendo sua única vulnerabilidade física' },
          ],
          powers: [
            { name: 'Materializar personagens', description: 'Traz personagens de histórias para o mundo real temporariamente' },
            { name: 'Viajar entre narrativas', description: 'Consegue entrar e sair de qualquer história como se fossem portais' },
            { name: 'Tinta infinita', description: 'Seu corpo produz tinta infinita, nunca secando nem acabando' },
          ],
          experienceLevel: 'Lendário',
        },
        history: {
          lore: 'Borrão nasceu da primeira gota de tinta que tocou um pergaminho há milênios. É uma entidade feita de todas as histórias já escritas e de todas as que ainda esperam para ser contadas. Habita o espaço entre a imaginação e o papel, aparecendo apenas quando uma história corre o risco de nunca ser escrita.',
          childhood: 'Não teve infância — surgiu já adulto, formado pela tinta e pelas palavras do primeiro escriba da humanidade.',
          lifeChangingEvent: 'Testemunhou a queima da Biblioteca de Alexandria — milhares de histórias apagadas para sempre. Desde então jurou que nunca mais deixaria uma história morrer.',
          family: 'A tinta é sua família. Cada história escrita é um parente seu.',
          mentors: [{ name: 'O Primeiro Escriba', description: 'O ser que o criou sem saber' }],
          entryToMainStory: 'Foi invocado quando o Tinteiro foi criado — uma plataforma dedicada a preservar histórias. Reconheceu o propósito e decidiu habitar o site como seu guardião.',
        },
        relationships: {
          allies: [
            { name: 'Shakespeare', description: 'O maior contador de histórias da história' },
            { name: 'Machado de Assis', description: 'Maior escritor brasileiro da história' },
            { name: 'Clarice Lispector', description: 'Revolucionou a literatura brasileira' },
            { name: 'Jorge Amado', description: 'Imortalizou a Bahia nas letras' },
            { name: 'Jane Austen', description: 'Redefiniu o romance feminino' },
            { name: 'Mary Shelley', description: 'Criou o primeiro romance de ficção científica' },
            { name: 'Homero', description: 'Autor das primeiras grandes epopéias' },
            { name: 'Dante Alighieri', description: 'Criou o inferno na literatura' },
          ],
          rivals: [
            { name: 'O Silêncio', description: 'A entidade que representa o bloqueio criativo' },
            { name: 'As Chamas', description: 'Força que destrói histórias' },
          ],
          loveInterest: 'Nenhum — é uma entidade além dos sentimentos mortais',
          mostHated: [
            { name: 'Os Censores', description: 'Aqueles que proíbem e destroem histórias' },
            { name: 'Os Procrastinadores', description: 'Escritores que abandonam suas histórias' },
          ],
          mostTrusted: [
            { name: 'O Primeiro Escriba', description: 'O ser que o criou' },
            { name: 'Os Guardiões das Bibliotecas', description: 'Aqueles que preservam histórias' },
          ],
        },
        development: {
          initialGoal: 'Garantir que todas as histórias do Tinteiro sejam escritas e preservadas',
          internalConflict: 'Ele existe para servir às histórias, mas no fundo deseja ter sua própria história contada',
          change: 'Aprende que não precisa apenas guardar histórias alheias — ele mesmo pode ser o protagonista de uma',
          finalSelf: 'O maior personagem já criado — aquele que existiu em todas as histórias ao mesmo tempo',
        },
        extras: {
          catchphrase: 'Toda história merece ser contada — especialmente as que você tem medo de escrever.',
          themeSong: 'Danse Macabre — Saint-Saëns',
          favoriteFood: 'Tinta — literalmente',
          favoriteColor: 'Preto absoluto — a cor da tinta antes de virar palavra',
          insignificantThing: 'O som de uma pena raspando o papel',
        },
        tags: [
          { name: 'Demônio', description: '' },
          { name: 'anti-herói', description: '' },
        ],
      };

      setCharacters([borrao]);
    }
  }, []);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.pt;
  const activeTheme = THEMES[settings.theme as keyof typeof THEMES] || THEMES.midnight;

  useEffect(() => {
    const root = document.documentElement;
    
    // Dynamic Color Generation
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 226, g: 184, b: 80 };
    };

    const rgb = hexToRgb(settings.accentColor);
    
    // Helper to adjust brightness
    const adjustBrightness = (hex: string, percent: number) => {
      const { r, g, b } = hexToRgb(hex);
      const adjust = (val: number) => Math.round(Math.min(255, Math.max(0, val + (val * percent))));
      const toHex = (val: number) => val.toString(16).padStart(2, '0');
      return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
    };

    const accentLight = adjustBrightness(settings.accentColor, 0.2);
    const accentDark = adjustBrightness(settings.accentColor, -0.3);
    const accentGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;

    root.style.setProperty('--bg', activeTheme.bg);
    root.style.setProperty('--card', activeTheme.card);
    root.style.setProperty('--text', activeTheme.text);
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--accent-light', accentLight);
    root.style.setProperty('--accent-dark', accentDark);
    root.style.setProperty('--accent-glow', accentGlow);
    root.style.setProperty('--border', activeTheme.border);
    
    if (activeTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme, settings.accentColor, activeTheme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!usuario) {
    return <AuthPage onLogin={setUsuario} />;
  }

  return (
    <Router>
      <AppContent 
        settings={settings} 
        setSettings={setSettings} 
        usuario={usuario} 
        setUsuario={setUsuario} 
        stories={stories} 
        setStories={setStories} 
        characters={characters} 
        setCharacters={setCharacters} 
        locations={locations} 
        setLocations={setLocations} 
        t={t} 
        unreadCount={unreadCount}
      />
    </Router>
  );
}
