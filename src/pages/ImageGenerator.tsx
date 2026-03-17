import React, { useState } from 'react';
import { ImageIcon, Sparkles, Loader2, Download, RefreshCw, Wand2, History, User, Save, Trash2 } from 'lucide-react';
import { AppSettings, GeneratedImage, Character, useLocalStorage } from '../types';
import { IMAGE_STYLES, IMAGE_TYPES } from '../constants';
import { generateImage } from '../services/geminiService';

interface ImageGeneratorProps {
  settings: AppSettings;
  characters: Character[];
  setCharacters: (c: Character[]) => void;
  t: any;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ settings, characters, setCharacters, t }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(IMAGE_STYLES[0]);
  const [type, setType] = useState(IMAGE_TYPES[0]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useLocalStorage<GeneratedImage[]>('inkwell-image-history', []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      console.log("Generating image with prompt:", prompt);
      const imageUrl = await generateImage(settings, prompt, type, style);
      console.log("Received image URL:", imageUrl);
      setCurrentImage(imageUrl);
      
      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url: imageUrl,
        prompt,
        style,
        type,
        createdAt: Date.now()
      };
      
      setHistory([newImage, ...history].slice(0, 10));
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkwell-art-${Date.now()}.png`;
    a.click();
  };

  const handleLinkToCharacter = (imageUrl: string) => {
    if (characters.length === 0) {
      alert("Nenhum personagem cadastrado.");
      return;
    }

    const charId = window.prompt(
      "Digite o ID ou Nome do personagem para vincular:\n" + 
      characters.map(c => `${c.id}: ${c.basicInfo.name}`).join("\n")
    );

    if (charId) {
      const char = characters.find(c => c.id === charId || c.basicInfo.name === charId);
      if (char) {
        setCharacters(characters.map(c => c.id === char.id ? { ...c, imageUrl } : c));
        alert(`Imagem vinculada a ${char.basicInfo.name}!`);
      } else {
        alert("Personagem não encontrado.");
      }
    }
  };

  const deleteFromHistory = (id: string) => {
    setHistory(history.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-8 fade-in max-w-6xl mx-auto pb-20">
      <header>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <ImageIcon className="text-[var(--accent)]" />
          {t.imageGen}
        </h1>
        <p className="opacity-60">Visualize seus personagens e cenários com o poder da IA</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="inkwell-card space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-50">O que você quer gerar?</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva o que quer gerar..."
                className="w-full h-32 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 focus:outline-none focus:border-[var(--accent)] resize-none font-serif"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Estilo</label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:border-[var(--accent)] text-sm"
                >
                  {IMAGE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Tipo</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:border-[var(--accent)] text-sm"
                >
                  {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full inkwell-button py-4 flex items-center justify-center gap-3 text-lg shadow-lg"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isLoading ? "Gerando..." : "🎨 Gerar Imagem"}
            </button>
          </div>

          <div className="inkwell-card space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History size={20} />
              Histórico
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {history.map(img => (
                <div key={img.id} className="aspect-square bg-[var(--bg)] rounded-lg overflow-hidden relative group border border-[var(--border)]">
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setCurrentImage(img.url)} className="p-1.5 bg-white text-black rounded-lg"><RefreshCw size={14} /></button>
                    <button onClick={() => deleteFromHistory(img.id)} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="col-span-2 py-8 text-center opacity-20 italic text-sm">
                  Sem histórico
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="inkwell-card aspect-square lg:aspect-video flex items-center justify-center overflow-hidden p-0 relative group shadow-2xl">
            {currentImage ? (
              <>
                <img 
                  src={currentImage} 
                  alt="Generated" 
                  className="w-full h-full object-contain bg-black" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => console.error("Image failed to load:", e)}
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDownload(currentImage)} 
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
                  >
                    <Download size={20} />
                    Salvar
                  </button>
                  <button 
                    onClick={() => handleLinkToCharacter(currentImage)}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
                  >
                    <User size={20} />
                    Vincular
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center opacity-10 p-12">
                <ImageIcon size={120} className="mx-auto mb-6" />
                <p className="text-2xl font-serif italic">Sua visão ganhará forma aqui</p>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-[var(--card)]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <Loader2 size={64} className="animate-spin text-[var(--accent)]" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent)]" size={24} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold animate-pulse">Invocando a musa...</p>
                  <p className="text-sm opacity-50 italic">Pintando cada detalhe da sua imaginação</p>
                </div>
              </div>
            )}
          </div>
          
          {currentImage && (
            <div className="inkwell-card bg-[var(--accent)]/5 border-[var(--accent)]/20">
              <p className="text-sm opacity-70 leading-relaxed italic">
                "A arte é a expressão da alma. Use esta imagem para inspirar novos capítulos e dar profundidade ao seu mundo."
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

