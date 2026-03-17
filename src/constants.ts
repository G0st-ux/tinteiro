import { GoogleGenAI } from "@google/genai";

export const THEMES = {
  midnight: {
    name: "Midnight",
    bg: "#0f0f1a",
    card: "#1a1a2e",
    text: "#e0e0e0",
    accent: "#7c6af7",
    border: "#2a2a4a",
    isDark: true
  },
  forest: {
    name: "Forest",
    bg: "#0d1f0d",
    card: "#162e16",
    text: "#e0e8e0",
    accent: "#4caf50",
    border: "#1e3d1e",
    isDark: true
  },
  ocean: {
    name: "Ocean",
    bg: "#0a1628",
    card: "#112240",
    text: "#e6f1ff",
    accent: "#2196f3",
    border: "#1d3557",
    isDark: true
  },
  crimson: {
    name: "Crimson",
    bg: "#1a0a0a",
    card: "#2d1212",
    text: "#f5e6e6",
    accent: "#e53935",
    border: "#3d1a1a",
    isDark: true
  },
  amber: {
    name: "Amber",
    bg: "#1a1200",
    card: "#2d1f00",
    text: "#fff4e0",
    accent: "#ffa000",
    border: "#3d2b00",
    isDark: true
  },
  rose: {
    name: "Rose",
    bg: "#1a0a12",
    card: "#2d121f",
    text: "#fce4ec",
    accent: "#e91e8c",
    border: "#3d1a2b",
    isDark: true
  },
  arctic: {
    name: "Arctic",
    bg: "#f0f4f8",
    card: "#ffffff",
    text: "#1a2b3c",
    accent: "#1565c0",
    border: "#d1d9e6",
    isDark: false
  },
  parchment: {
    name: "Parchment",
    bg: "#fdf6e3",
    card: "#f5ecd5",
    text: "#5c4b37",
    accent: "#8b6914",
    border: "#e6dcc3",
    isDark: false
  },
  mint: {
    name: "Mint",
    bg: "#f0faf4",
    card: "#ffffff",
    text: "#1e3a2b",
    accent: "#2e7d52",
    border: "#d1e9db",
    isDark: false
  },
  lavender: {
    name: "Lavender",
    bg: "#f5f0ff",
    card: "#ffffff",
    text: "#2d1a4d",
    accent: "#6a1b9a",
    border: "#e1d5f5",
    isDark: false
  },
  slate: {
    name: "Slate",
    bg: "#1e2433",
    card: "#2a3142",
    text: "#e1e4e8",
    accent: "#90caf9",
    border: "#374151",
    isDark: true
  },
  ember: {
    name: "Ember",
    bg: "#1c1008",
    card: "#2d1a0d",
    text: "#fbe9e7",
    accent: "#ff7043",
    border: "#3e2723",
    isDark: true
  },
  sakura: {
    name: "Sakura",
    bg: "#fff0f3",
    card: "#ffffff",
    text: "#4a148c",
    accent: "#c2185b",
    border: "#f8bbd0",
    isDark: false
  },
  dusk: {
    name: "Dusk",
    bg: "#1a1525",
    card: "#251e35",
    text: "#e1bee7",
    accent: "#ce93d8",
    border: "#312a40",
    isDark: true
  },
  sepia: {
    name: "Sepia",
    bg: "#2c1810",
    card: "#3d2318",
    text: "#d4a76a",
    accent: "#d4a76a",
    border: "#4e2e21",
    isDark: true
  },
  nord: {
    name: "Nord",
    bg: "#2e3440",
    card: "#3b4252",
    text: "#eceff4",
    accent: "#88c0d0",
    border: "#434c5e",
    isDark: true
  },
  sage: {
    name: "Sage",
    bg: "#f4f7f2",
    card: "#ffffff",
    text: "#2e3b23",
    accent: "#558b2f",
    border: "#dcedc8",
    isDark: false
  },
  volcanic: {
    name: "Volcanic",
    bg: "#120a08",
    card: "#1e110d",
    text: "#fbe9e7",
    accent: "#ff5722",
    border: "#2d1a15",
    isDark: true
  },
  pearl: {
    name: "Pearl",
    bg: "#fafafa",
    card: "#ffffff",
    text: "#263238",
    accent: "#546e7a",
    border: "#eceff1",
    isDark: false
  },
  aurora: {
    name: "Aurora",
    bg: "#0a1a1a",
    card: "#112a2a",
    text: "#e0f2f1",
    accent: "#00bcd4",
    border: "#1a3a3a",
    isDark: true
  }
};

export const CATEGORIES = [
  { id: 'fantasy', label: 'Fantasia', color: '#7c6af7' },
  { id: 'romance', label: 'Romance', color: '#e91e8c' },
  { id: 'horror', label: 'Terror', color: '#e53935' },
  { id: 'scifi', label: 'Ficção Científica', color: '#2196f3' },
  { id: 'adventure', label: 'Aventura', color: '#ffa000' },
  { id: 'short', label: 'Conto', color: '#4caf50' },
  { id: 'other', label: 'Outro', color: '#9e9e9e' }
];

export const GENRES = [
  'Fantasia', 'Romance', 'Terror', 'Ficção Científica', 'Aventura', 'Mistério', 'Drama', 'Outro'
];

export const CHARACTER_ROLES = [
  'Protagonista', 'Antagonista', 'Secundário', 'Mentor', 'Alívio Cômico', 'Interesse Amoroso'
];

export const NARRATIVE_TONES = [
  'Sério', 'Humorístico', 'Épico', 'Melancólico', 'Suspenseful'
];

export const POV_OPTIONS = [
  'Primeira pessoa', 'Terceira pessoa limitada', 'Terceira pessoa onisciente'
];

export const SETTINGS_OPTIONS = [
  'Medieval', 'Contemporâneo', 'Futurista', 'Apocalíptico', 'Fantástico', 'Outro'
];

export const LOCATION_TYPES = [
  'Cidade', 'Vila', 'Floresta', 'Dungeon', 'País', 'Planeta', 'Outro'
];

export const IMAGE_STYLES = [
  'Realista', 'Anime', 'Fantasia', 'Pintura a óleo', 'Esboço', 'Pixel Art'
];

export const IMAGE_TYPES = [
  'Personagem', 'Cenário', 'Objeto', 'Capa de livro'
];

export const NAME_STYLES = [
  'Fantasia Medieval', 'Japonês', 'Nórdico', 'Árabe', 'Moderno', 'Cyberpunk'
];

export const TRANSLATIONS = {
  pt: {
    welcome: "Olá, escritor! ✨",
    home: "Início",
    editor: "Editor",
    library: "Meus Rascunhos",
    aiChat: "Chat IA",
    storyGen: "Gerador de Histórias",
    imageGen: "Gerador de Imagens",
    characters: "Personagens",
    world: "Mundo",
    settings: "Configurações",
    stats: "Estatísticas",
    totalStories: "Total de histórias",
    totalChars: "Total de personagens",
    totalWords: "Total de letras",
    recentStories: "Últimas histórias",
    appearance: "Aparência",
    language: "Idioma",
    aiConfig: "Inteligência Artificial",
    data: "Dados",
    exportAll: "Exportar todos os dados",
    import: "Importar dados",
    clear: "Limpar todos os dados",
    testConnection: "Testar conexão",
    aiKeyInfo: "Sem API Key, o site usa uma chave padrão com limite diário",
    compactMode: "Modo Compacto",
    comfortableMode: "Modo Confortável",
    save: "Salvar",
    delete: "Excluir",
    edit: "Editar",
    create: "Criar",
    noStories: "Nenhuma história encontrada.",
    noCharacters: "Nenhum personagem encontrado.",
    noLocations: "Nenhum local encontrado.",
    theme: "Tema",
    slogan: "Onde histórias ganham vida",
    new: "Novo",
    export: "Exportar",
    focusMode: "Modo Foco",
    splitView: "Visualização Dividida",
    writeMode: "Modo Escrita",
    previewMode: "Modo Preview",
    words: "palavras",
    chars: "letras",
    readingTime: "min de leitura",
    paragraphs: "parágrafos",
    aiTools: "Ferramentas de IA",
    continue: "Continuar",
    review: "Revisar",
    summarize: "Resumir",
    rewrite: "Reescrever",
    apply: "Aplicar",
    discard: "Descartar",
    aiThinking: "A musa está pensando...",
    category: "Categoria",
    duplicate: "Duplicar",
    newChat: "Nova Conversa"
  },
  en: {
    welcome: "Hello, writer! ✨",
    home: "Home",
    editor: "Editor",
    library: "My Drafts",
    aiChat: "AI Chat",
    storyGen: "Story Generator",
    imageGen: "Image Generator",
    characters: "Characters",
    world: "World",
    settings: "Settings",
    stats: "Statistics",
    totalStories: "Total stories",
    totalChars: "Total characters",
    totalWords: "Total characters",
    recentStories: "Recent stories",
    appearance: "Appearance",
    language: "Language",
    aiConfig: "Artificial Intelligence",
    data: "Data",
    exportAll: "Export all data",
    import: "Import data",
    clear: "Clear all data",
    testConnection: "Test connection",
    aiKeyInfo: "Without an API Key, the site uses a default key with a daily limit",
    compactMode: "Compact Mode",
    comfortableMode: "Comfortable Mode",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    noStories: "No stories found.",
    noCharacters: "No characters found.",
    noLocations: "No locations found.",
    theme: "Theme",
    slogan: "Where stories come to life",
    new: "New",
    export: "Export",
    focusMode: "Focus Mode",
    splitView: "Split View",
    writeMode: "Write Mode",
    previewMode: "Preview Mode",
    words: "words",
    chars: "chars",
    readingTime: "min read",
    paragraphs: "paragraphs",
    aiTools: "AI Tools",
    continue: "Continue",
    review: "Review",
    summarize: "Summarize",
    rewrite: "Rewrite",
    apply: "Apply",
    discard: "Discard",
    aiThinking: "The muse is thinking...",
    category: "Category",
    duplicate: "Duplicate",
    newChat: "New Chat"
  },
  es: {
    welcome: "¡Hola, escritor! ✨",
    home: "Inicio",
    editor: "Editor",
    library: "Mis Borradores",
    aiChat: "Chat IA",
    storyGen: "Generador de Historias",
    imageGen: "Generador de Imágenes",
    characters: "Personajes",
    world: "Mundo",
    settings: "Configuraciones",
    stats: "Estadísticas",
    totalStories: "Total de historias",
    totalChars: "Total de personajes",
    totalWords: "Total de letras",
    recentStories: "Últimas historias",
    appearance: "Apariencia",
    language: "Idioma",
    aiConfig: "Inteligencia Artificial",
    data: "Datos",
    exportAll: "Exportar todos los datos",
    import: "Importar datos",
    clear: "Limpiar todos los datos",
    testConnection: "Probar conexión",
    aiKeyInfo: "Sin API Key, el sitio usa una clave predeterminada con límite diario",
    compactMode: "Modo Compacto",
    comfortableMode: "Modo Cómodo",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    noStories: "No se encontraron historias.",
    noCharacters: "No se encontraron personajes.",
    noLocations: "No se encontraron lugares.",
    theme: "Tema",
    slogan: "Donde las historias cobran vida",
    new: "Nuevo",
    export: "Exportar",
    focusMode: "Modo Foco",
    splitView: "Vista Dividida",
    writeMode: "Modo Escritura",
    previewMode: "Modo Vista Previa",
    words: "palabras",
    chars: "letras",
    readingTime: "min de lectura",
    paragraphs: "párrafos",
    aiTools: "Herramientas de IA",
    continue: "Continuar",
    review: "Revisar",
    summarize: "Resumir",
    rewrite: "Reescrever",
    apply: "Aplicar",
    discard: "Descartar",
    aiThinking: "La musa está pensando...",
    category: "Categoría",
    duplicate: "Duplicar",
    newChat: "Nueva Conversación"
  }
};

export const QUOTES = [
  { text: "Escreva o que deve ser escrito.", author: "L.S. Lewis" },
  { text: "A primeira versão de qualquer coisa é uma porcaria.", author: "Ernest Hemingway" },
  { text: "Não há maior agonia do que carregar uma história não contada dentro de você.", author: "Maya Angelou" },
  { text: "Escrever é a pintura da voz.", author: "Voltaire" },
  { text: "A escrita é a única profissão em que ninguém é considerado ridículo se não ganhar dinheiro.", author: "Jules Renard" },
  { text: "Você não escreve porque quer dizer algo, você escreve porque tem algo a dizer.", author: "F. Scott Fitzgerald" },
  { text: "A leitura é para a mente o que o exercício é para o corpo.", author: "Joseph Addison" },
  { text: "Escrever é uma forma de terapia; às vezes eu me pergunto como todos aqueles que não escrevem conseguem escapar da loucura.", author: "Graham Greene" },
  { text: "Se você quer ser um escritor, você deve fazer duas coisas acima de todas as outras: ler muito e escrever muito.", author: "Stephen King" },
  { text: "O segredo de avançar é começar.", author: "Mark Twain" }
];
