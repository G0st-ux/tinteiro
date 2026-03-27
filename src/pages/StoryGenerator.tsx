import React, { useState } from 'react';
import { Sparkles, Download, Save, Loader2, BookOpen, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AppSettings, Story, Character } from '../types';
import { GENRES, NARRATIVE_TONES, POV_OPTIONS, SETTINGS_OPTIONS } from '../constants';
import { generateStoryChapter } from '../services/geminiService';

interface StoryGeneratorProps {
  settings: AppSettings;
  t: any;
  stories: Story[];
  setStories: (stories: Story[]) => void;
  characters: Character[];
}

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({ settings, t, stories, setStories, characters }) => {
  const [config, setConfig] = useState({
    title: '',
    genre: GENRES[0],
    chapters: 3,
    pagesPerChapter: 2,
    linesPerPage: 30,
    plot: '',
    tone: NARRATIVE_TONES[0],
    pov: POV_OPTIONS[0],
    setting: SETTINGS_OPTIONS[0]
  });

  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedChapters, setGeneratedChapters] = useState<{ title: string; pages: string[] }[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [activePage, setActivePage] = useState(0);

  const toggleCharacter = (char: Character) => {
    if (selectedCharacters.find(c => c.id === char.id)) {
      setSelectedCharacters(selectedCharacters.filter(c => c.id !== char.id));
    } else {
      setSelectedCharacters([...selectedCharacters, char]);
    }
  };

  const handleGenerate = async () => {
    if (!config.title || !config.plot) {
      alert("Por favor, preencha o título e a prévia da história.");
      return;
    }

    setIsGenerating(true);
    setGeneratedChapters([]);
    setProgress(0);
    
    const chapters: { title: string; pages: string[] }[] = [];
    
    try {
      setStatusMessage("Construindo o mundo...");
      await new Promise(r => setTimeout(r, 1000));
      setProgress(10);
      
      setStatusMessage("Desenvolvendo os personagens...");
      await new Promise(r => setTimeout(r, 1000));
      setProgress(20);

      // Pass selected characters to the generator
      const generatorConfig = { ...config, characters: selectedCharacters };

      for (let i = 0; i < config.chapters; i++) {
        setStatusMessage(`Escrevendo o capítulo ${i + 1} de ${config.chapters}...`);
        const chapter = await generateStoryChapter(settings, generatorConfig, i, chapters.map(c => c.pages.join('\n')));
        chapters.push(chapter);
        setGeneratedChapters([...chapters]);
        setProgress(20 + ((i + 1) / config.chapters) * 70);
      }

      setStatusMessage("Finalizando os detalhes...");
      await new Promise(r => setTimeout(r, 1000));
      setProgress(100);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar história. Verifique sua conexão e API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToLibrary = () => {
    const fullContent = generatedChapters.map(c => `## ${c.title}\n\n${c.pages.join('\n\n---PAGINA---\n\n')}`).join('\n\n---\n\n');
    const now = Date.now();
    const newStory: Story = {
      id: Math.random().toString(36).substr(2, 9),
      title: config.title,
      content: fullContent,
      category: config.genre.toLowerCase(),
      createdAt: now,
      updatedAt: now,
      charCount: fullContent.length,
      wordCount: fullContent.trim().split(/\s+/).length,
      chapters: generatedChapters.map(c => ({ title: c.title, content: c.pages.join('\n\n') }))
    };
    setStories([...stories, newStory]);
    alert("História salva na biblioteca!");
  };

  const downloadChapter = (index: number) => {
    const chapter = generatedChapters[index];
    const text = `${config.title}\nCapítulo ${index + 1}: ${chapter.title}\n\n${chapter.pages.join('\n\n---PAGINA---\n\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title} - Capítulo ${String(index + 1).padStart(2, '0')}.txt`;
    a.click();
  };

  const downloadFull = () => {
    const text = generatedChapters.map((c, i) => `Capítulo ${i + 1}: ${c.title}\n\n${c.pages.join('\n\n---PAGINA---\n\n')}`).join('\n\n' + '='.repeat(20) + '\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title} - Completa.txt`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in pb-20">
      <header>
        <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
          <Sparkles className="text-[var(--accent)]" />
          {t.storyGen}
        </h1>
        <p className="opacity-60 font-sans">Crie épicos inteiros com a ajuda da inteligência artificial</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="card-ink space-y-4 p-6">
            <h2 className="text-xl font-serif font-bold border-b border-[var(--border)] pb-2">Estrutura</h2>
            
            <div className="space-y-2">
              <label className="label">Título</label>
              <input 
                type="text" 
                value={config.title}
                onChange={e => setConfig({...config, title: e.target.value})}
                placeholder="Ex: O Último Feiticeiro"
                className="input-field w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Gênero</label>
                <select 
                  value={config.genre}
                  onChange={e => setConfig({...config, genre: e.target.value})}
                  className="input-field w-full bg-[#07070e]"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Capítulos</label>
                <input 
                  type="number" 
                  min="1" max="20"
                  value={config.chapters}
                  onChange={e => setConfig({...config, chapters: parseInt(e.target.value) || 1})}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Páginas/Cap</label>
                <input 
                  type="number" 
                  min="1" max="50"
                  value={config.pagesPerChapter}
                  onChange={e => setConfig({...config, pagesPerChapter: parseInt(e.target.value) || 1})}
                  className="input-field w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="label">Linhas/Pág</label>
                <input 
                  type="number" 
                  min="20" max="60"
                  value={config.linesPerPage}
                  onChange={e => setConfig({...config, linesPerPage: parseInt(e.target.value) || 20})}
                  className="input-field w-full"
                />
              </div>
            </div>
          </section>

          <section className="card-ink space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h2 className="text-xl font-serif font-bold">Personagens</h2>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {characters.length === 0 ? (
                <p className="text-sm opacity-50 italic">Nenhum personagem criado ainda.</p>
              ) : (
                characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => toggleCharacter(char)}
                    className={`w-full flex items-center gap-3 p-2 rounded-[2px] border transition-all ${
                      selectedCharacters.find(c => c.id === char.id)
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                        : 'bg-[var(--bg)] border-[var(--border)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-[2px] border flex items-center justify-center ${
                      selectedCharacters.find(c => c.id === char.id)
                        ? 'bg-[var(--accent)] border-[var(--accent)]'
                        : 'border-[var(--border)]'
                    }`}>
                      {selectedCharacters.find(c => c.id === char.id) && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium">{char.basicInfo.name}</span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="card-ink p-6">
            <button 
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-xl font-serif font-bold"
            >
              Config. Avançadas
              {isAdvancedOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {isAdvancedOpen && (
              <div className="mt-4 space-y-4 fade-in">
                <div className="space-y-2">
                  <label className="label">Tom</label>
                  <select 
                    value={config.tone}
                    onChange={e => setConfig({...config, tone: e.target.value})}
                    className="input-field w-full bg-[#07070e]"
                  >
                    {NARRATIVE_TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Ponto de Vista</label>
                  <select 
                    value={config.pov}
                    onChange={e => setConfig({...config, pov: e.target.value})}
                    className="input-field w-full bg-[#07070e]"
                  >
                    {POV_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Época/Cenário</label>
                  <select 
                    value={config.setting}
                    onChange={e => setConfig({...config, setting: e.target.value})}
                    className="input-field w-full bg-[#07070e]"
                  >
                    {SETTINGS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="card-ink space-y-4 p-6">
            <h2 className="text-xl font-serif font-bold border-b border-[var(--border)] pb-2">Prévia do Enredo</h2>
            <textarea 
              value={config.plot}
              onChange={e => setConfig({...config, plot: e.target.value})}
              placeholder="Descreva como você imagina sua história, o enredo, o clima, os conflitos..."
              className="input-field w-full h-40 resize-none font-serif"
            />
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles />
                  ⚡ Gerar História
                </>
              )}
            </button>

            {isGenerating && (
              <div className="space-y-2">
                <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div 
                    className="h-full bg-[var(--accent)] transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-sm italic opacity-60 animate-pulse font-serif">{statusMessage}</p>
              </div>
            )}
          </section>

          {generatedChapters.length > 0 && (
            <section className="card-ink space-y-6 p-6 fade-in">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <h2 className="text-2xl font-serif font-bold">Resultado</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={saveToLibrary}
                    className="btn-ghost flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button 
                    onClick={downloadFull}
                    className="btn-primary flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    <Download size={16} />
                    Baixar Tudo
                  </button>
                </div>
              </div>

              <div className="flex border-b border-[var(--border)] overflow-x-auto">
                {generatedChapters.map((ch, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveTab(i); setActivePage(0); }}
                    className={`px-4 py-2 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === i ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-50'}`}
                  >
                    Cap {i + 1}, {ch.pages.length} {ch.pages.length === 1 ? 'página' : 'páginas'}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-serif italic">{generatedChapters[activeTab].title}</h3>
                  <button 
                    onClick={() => downloadChapter(activeTab)}
                    className="p-2 hover:bg-[var(--bg)] rounded-[2px] transition-colors"
                  >
                    <Download size={18} />
                  </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {generatedChapters[activeTab].pages.map((_, p) => (
                    <button
                      key={p}
                      onClick={() => setActivePage(p)}
                      className={`px-3 py-1 text-xs rounded-[2px] border transition-all ${activePage === p ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg)] border-[var(--border)]'}`}
                    >
                      Pág {p + 1}
                    </button>
                  ))}
                </div>

                <div className="font-serif leading-relaxed text-lg whitespace-pre-wrap bg-[var(--bg)] p-6 rounded-[2px] border border-[var(--border)] min-h-[300px] max-h-[500px] overflow-y-auto">
                  {generatedChapters[activeTab].pages[activePage]}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
