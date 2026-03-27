import { GoogleGenAI } from "@google/genai";

export const THEMES = {
  midnight: {
    name: "Midnight",
    bg: "#030303",
    card: "rgba(15, 15, 15, 0.7)",
    text: "#ffffff",
    accent: "#e2b850",
    border: "rgba(255, 255, 255, 0.08)",
    isDark: true
  },
  nocturne: {
    name: "Nocturne",
    bg: "#050505",
    card: "rgba(10, 10, 10, 0.8)",
    text: "#e0e0e0",
    accent: "#7c6af7",
    border: "rgba(124, 106, 247, 0.1)",
    isDark: true
  },
  ivory: {
    name: "Ivory",
    bg: "#fdfcf8",
    card: "rgba(255, 255, 255, 0.9)",
    text: "#1a1a1a",
    accent: "#8b6914",
    border: "rgba(139, 105, 20, 0.1)",
    isDark: false
  },
  forest: {
    name: "Forest",
    bg: "#080a08",
    card: "rgba(12, 15, 12, 0.7)",
    text: "#e0e8e0",
    accent: "#4caf50",
    border: "rgba(76, 175, 80, 0.1)",
    isDark: true
  },
  ocean: {
    name: "Ocean",
    bg: "#05080a",
    card: "rgba(8, 12, 15, 0.7)",
    text: "#e6f1ff",
    accent: "#2196f3",
    border: "rgba(33, 150, 243, 0.1)",
    isDark: true
  },
  crimson: {
    name: "Crimson",
    bg: "#0a0505",
    card: "rgba(15, 8, 8, 0.7)",
    text: "#f5e6e6",
    accent: "#e53935",
    border: "rgba(229, 57, 53, 0.1)",
    isDark: true
  },
  parchment: {
    name: "Parchment",
    bg: "#fdf6e3",
    card: "rgba(245, 236, 213, 0.8)",
    text: "#5c4b37",
    accent: "#8b6914",
    border: "rgba(139, 105, 20, 0.15)",
    isDark: false
  },
  slate: {
    name: "Slate",
    bg: "#0f1115",
    card: "rgba(20, 22, 27, 0.7)",
    text: "#e1e4e8",
    accent: "#90caf9",
    border: "rgba(144, 202, 249, 0.1)",
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
