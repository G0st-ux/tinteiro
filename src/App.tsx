        import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { Editor } from './pages/Editor';
import { Library } from './pages/Library';
import { Characters } from './pages/Characters';
import { AIChat } from './pages/AIChat';
import { World } from './pages/World';
import { StoryGenerator } from './pages/StoryGenerator';
import { ImageGenerator } from './pages/ImageGenerator';
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
import { Usuario } from './services/supabase';
import { THEMES, TRANSLATIONS } from './constants';
import { useNavigate } from 'react-router-dom';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] fade-in">
    <h1 className="text-4xl font-bold font-serif mb-4">{title}</h1>
    <p className="opacity-60 italic">Esta página está em desenvolvimento...</p>
  </div>
);

function AppContent({ 
  settings, setSettings, usuario, setUsuario, stories, setStories, characters, setCharacters, locations, setLocations, t
}: any) {
  const navigate = useNavigate();
  const [salaAtiva, setSalaAtiva] = React.useState<any>(null);

  return (
    <div className={`min-h-screen flex ${settings.compactMode ? 'compact-mode' : ''}`}>
      <Sidebar usuario={usuario} settings={settings} setSettings={setSettings} t={t} onLogout={() => setUsuario(null)} />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-12 max-w-7xl mx-auto w-full transition-all">
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
          <Route path="/ai-chat" element={<AIChat settings={settings} t={t} />} />
          <Route path="/world" element={<World settings={settings} locations={locations} setLocations={setLocations} t={t} />} />
          <Route path="/generator" element={<StoryGenerator settings={settings} stories={stories} setStories={setStories} t={t} />} />
          <Route path="/image-gen" element={<ImageGenerator settings={settings} characters={characters} setCharacters={setCharacters} t={t} />} />
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
  const [usuario, setUsuario] = useLocalStorage<Usuario | null>('inkwell-user', null);
  const [stories, setStories] = useLocalStorage<Story[]>('inkwell-stories', []);
  const [characters, setCharacters] = useLocalStorage<Character[]>('inkwell-characters', []);
  const [locations, setLocations] = useLocalStorage<Location[]>('inkwell-locations', []);

  useEffect(() => {
    if (characters.length === 0 && stories.length === 0 && locations.length === 0) {
      const exampleChar: Character = {
        id: 'ex1',
        basicInfo: {
          name: 'Elowen Starweaver',
          nickname: 'El',
          age: '124',
          birthDate: 'Desconhecida',
          gender: 'Feminino',
          species: 'Elfa',
          height: '1.75m',
          weight: '60kg',
          nationality: 'Floresta Sagrada',
          occupation: 'Guardiã',
          role: 'Protagonista',
        },
        appearance: {
          hairColor: 'Prateado',
          hairStyle: 'Longo e ondulado',
          eyeColor: 'Violeta',
          skinTone: 'Pálida',
          features: [{ name: 'Orelhas pontiagudas', description: '' }, { name: 'tatuagem de runa no pulso', description: '' }],
          clothingStyle: 'Vestes de seda azul',
          posture: 'Nobre',
          firstImpression: 'Misteriosa e sábia',
        },
        personality: {
          traits: [
            { name: 'Sábia', description: 'Possui séculos de conhecimento acumulado.' },
            { name: 'Melancólica', description: 'Sente falta da glória passada de seu povo.' },
            { name: 'Determinada', description: 'Não descansará até cumprir sua missão.' }
          ],
          virtues: [{ name: 'Lealdade inabalável', description: '' }],
          defects: [{ name: 'Dificuldade em confiar em humanos', description: '' }],
          habits: [{ name: 'Observar as estrelas', description: 'Faz isso todas as noites para se conectar com seus ancestrais.' }],
          fears: [{ name: 'Escuridão', description: 'A escuridão que consome as florestas e apaga a luz estelar.' }],
          deepDesires: [{ name: 'Restaurar a luz de seu povo', description: '' }],
          motivation: 'Vingar a destruição de seu bosque sagrado',
          trigger: 'Desrespeito à natureza',
        },
        psychology: {
          trauma: 'Destruição de seu bosque',
          dream: 'Paz eterna',
          secret: 'Possui a última semente da Árvore da Vida',
          neverAdmit: 'Sente-se sozinha',
          pressureReaction: 'Fica calma e analítica',
          intelligenceType: 'Estratégica',
        },
        skills: {
          talents: [{ name: 'Magia natural', description: 'Conexão profunda com a flora e fauna.' }],
          trainedSkills: [{ name: 'Arco e flecha', description: 'Precisão milimétrica a longas distâncias.' }],
          weaknesses: [{ name: 'Fogo', description: 'Sua magia é vulnerável a chamas intensas.' }],
          powers: [{ name: 'Arco de luz', description: 'Cria um arco feito de pura energia estelar.' }],
          experienceLevel: 'Veterana',
        },
        history: {
          lore: 'Elowen é a última de uma linhagem de guardiões estelares que protegiam o equilíbrio entre o mundo físico e o espiritual.',
          childhood: 'Treinada pelos antigos guardiões',
          lifeChangingEvent: 'Destruição do bosque',
          family: 'Desconhecida',
          mentors: [{ name: 'Antigos guardiões', description: 'Aqueles que a ensinaram tudo o que sabe.' }],
          entryToMainStory: 'Encontrada na floresta',
        },
        relationships: {
          allies: [{ name: 'Guardiões', description: 'Seus antigos companheiros de ordem.' }],
          rivals: [{ name: 'Sombras', description: 'Entidades que buscam apagar a luz estelar.' }],
          loveInterest: 'Nenhum',
          mostHated: [{ name: 'Destruidores', description: 'Aqueles que queimaram seu lar.' }],
          mostTrusted: [{ name: 'Guardiões', description: 'Sua única família restante.' }],
        },
        development: {
          initialGoal: 'Vingança',
          internalConflict: 'Dever vs. Vingança',
          change: 'Aprende a perdoar',
          finalSelf: 'Líder pacífica',
        },
        extras: {
          catchphrase: 'Que a luz nos guie',
          themeSong: 'Melodia da Floresta',
          favoriteFood: 'Frutas silvestres',
          favoriteColor: 'Azul',
          insignificantThing: 'Borboletas',
        },
        tags: [
          { name: 'elfa', description: '' },
          { name: 'magia', description: '' },
          { name: 'protagonista', description: '' }
        ],
      };

      const exampleLoc: Location = {
        id: 'loc1',
        name: 'Valfenda Prateada',
        type: 'Cidade',
        description: 'Uma cidade esculpida em cristal e mármore, escondida entre montanhas.',
        climate: 'Eterna primavera',
        inhabitants: 'Elfos e seres feéricos',
        pointsOfInterest: 'O Observatório de Estrelas, A Fonte da Juventude',
        connections: [],
        imageUrl: 'https://picsum.photos/seed/fantasy-city/800/450'
      };

      setCharacters([exampleChar]);
      setLocations([exampleLoc]);
    }
  }, []);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.pt;
  const activeTheme = THEMES[settings.theme as keyof typeof THEMES] || THEMES.midnight;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg', activeTheme.bg);
    root.style.setProperty('--card', activeTheme.card);
    root.style.setProperty('--text', activeTheme.text);
    root.style.setProperty('--accent', activeTheme.accent);
    root.style.setProperty('--border', activeTheme.border);
    
    if (activeTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme, activeTheme]);

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
      />
    </Router>
  );
    }
