import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, ChevronDown, ChevronUp, Download, Save, Loader2, BookOpen } from 'lucide-react';
import { AppSettings, Story } from '../types';
import { GENRES, CHARACTER_ROLES, NARRATIVE_TONES, POV_OPTIONS, SETTINGS_OPTIONS } from '../constants';
import { generateStoryChapter } from '../services/geminiService';

interface StoryGeneratorProps {
  settings: AppSettings;
  t: any;
  stories: Story[];
  setStories: (stories: Story[]) => void;
}

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({ settings, t, stories, setStories }) => {
  const [config, setConfig] = useState({
    title: '',
    genre: GENRES[0],
    chapters: 3,
    pagesPerChapter: 2,
    linesPerPage: 30,
    characters: [{ name: '', role: CHARACTER_ROLES[0] }],
    plot: '',
    tone: NARRATIVE_TONES[0],
    pov: POV_OPTIONS[0],
    setting: SETTINGS_OPTIONS[0]
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedChapters, setGeneratedChapters] = useState<{ title: string; content: string }[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const addCharacter = () => {
    if (config.characters.length < 10) {
      setConfig({ ...config, characters: [...config.characters, { name: '', role: CHARACTER_ROLES[0] }] });
    }
  };

  const removeCharacter = (index: number) => {
    const newChars = config.characters.filter((_, i) => i !== index);
    setConfig({ ...config, characters: newChars });
  };

  const updateCharacter = (index: number, field: string, value: string) => {
    const newChars = [...config.characters];
    newChars[index] = { ...newChars[index], [field]: value };
    setConfig({ ...config, characters: newChars });
  };

  const handleGenerate = async () => {
    if (!config.title || !config.plot) {
      alert("Por favor, preencha o título e a prévia da história.");
      return;
    }

    setIsGenerating(true);
    setGeneratedChapters([]);
    setProgress(0);
    
    const chapters: { title: string; content: string }[] = [];
    
    try {
      setStatusMessage("Construindo o mundo...");
      await new Promise(r => setTimeout(r, 1000));
      setProgress(10);
      
      setStatusMessage("Desenvolvendo os personagens...");
      await new Promise(r => setTimeout(r, 1000));
      setProgress(20);

      for (let i = 0; i < config.chapters; i++) {
        setStatusMessage(`Escrevendo o capítulo ${i + 1} de ${config.chapters}...`);
        const chapter = await generateStoryChapter(settings, config, i, chapters.map(c => c.content));
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
    const fullContent = generatedChapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n---\n\n');
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
      chapters: generatedChapters
    };
    setStories([...stories, newStory]);
    alert("História salva na biblioteca!");
  };

  const downloadChapter = (index: number) => {
    const chapter = generatedChapters[index];
    const text = `${config.title}\nCapítulo ${index + 1}: ${chapter.title}\n\n${chapter.content}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title} - Capítulo ${String(index + 1).padStart(2, '0')}.txt`;
    a.click();
  };

  const downloadFull = () => {
    const text = generatedChapters.map((c, i) => `Capítulo ${i + 1}: ${c.title}\n\n${c.content}`).join('\n\n' + '='.repeat(20) + '\n\n');
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
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="text-[var(--accent)]" />
          {t.storyGen}
        </h1>
        <p className="opacity-60">Crie épicos inteiros com a ajuda da inteligência artificial</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="inkwell-card space-y-4">
            <h2 className="text-xl font-bold border-b border-[var(--border)] pb-2">Estrutura</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-50">Título</label>
              <input 
                type="text" 
                value={config.title}
                onChange={e => setConfig({...config, title: e.target.value})}
                placeholder="Ex: O Último Feiticeiro"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Gênero</label>
                <select 
                  value={config.genre}
                  onChange={e => setConfig({...config, genre: e.target.value})}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Capítulos</label>
                <input 
                  type="number" 
                  min="1" max="20"
                  value={config.chapters}
                  onChange={e => setConfig({...config, chapters: parseInt(e.target.value) || 1})}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Páginas/Cap</label>
                <input 
                  type="number" 
                  min="1" max="50"
                  value={config.pagesPerChapter}
                  onChange={e => setConfig({...config, pagesPerChapter: parseInt(e.target.value) || 1})}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-50">Linhas/Pág</label>
                <input 
                  type="number" 
                  min="20" max="60"
                  value={config.linesPerPage}
                  onChange={e => setConfig({...config, linesPerPage: parseInt(e.target.value) || 20})}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
                />
              </div>
            </div>
          </section>

          <section className="inkwell-card space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h2 className="text-xl font-bold">Personagens</h2>
              <button 
                onClick={addCharacter}
                className="p-1 hover:text-[var(--accent)] transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {config.characters.map((char, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={char.name}
                      onChange={e => updateCharacter(i, 'name', e.target.value)}
                      placeholder="Nome"
                      className="w-full text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1 focus:border-[var(--accent)] outline-none"
                    />
                    <select 
                      value={char.role}
                      onChange={e => updateCharacter(i, 'role', e.target.value)}
                      className="w-full text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1 focus:border-[var(--accent)] outline-none"
                    >
                      {CHARACTER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  {config.characters.length > 1 && (
                    <button 
                      onClick={() => removeCharacter(i)}
                      className="p-1 text-red-500 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="inkwell-card">
            <button 
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-xl font-bold"
            >
              Config. Avançadas
              {isAdvancedOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {isAdvancedOpen && (
              <div className="mt-4 space-y-4 fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">Tom</label>
                  <select 
                    value={config.tone}
                    onChange={e => setConfig({...config, tone: e.target.value})}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
                  >
                    {NARRATIVE_TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">Ponto de Vista</label>
                  <select 
                    value={config.pov}
                    onChange={e => setConfig({...config, pov: e.target.value})}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
                  >
                    {POV_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase opacity-50">Época/Cenário</label>
                  <select 
                    value={config.setting}
                    onChange={e => setConfig({...config, setting: e.target.value})}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 focus:border-[var(--accent)] outline-none"
                  >
                    {SETTINGS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="inkwell-card space-y-4">
            <h2 className="text-xl font-bold border-b border-[var(--border)] pb-2">Prévia do Enredo</h2>
            <textarea 
              value={config.plot}
              onChange={e => setConfig({...config, plot: e.target.value})}
              placeholder="Descreva como você imagina sua história, o enredo, o clima, os conflitos..."
              className="w-full h-40 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 focus:border-[var(--accent)] outline-none resize-none font-serif"
            />
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
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
                <p className="text-center text-sm italic opacity-60 animate-pulse">{statusMessage}</p>
              </div>
            )}
          </section>

          {generatedChapters.length > 0 && (
            <section className="inkwell-card space-y-6 fade-in">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <h2 className="text-2xl font-bold">Resultado</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={saveToLibrary}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm hover:border-[var(--accent)] transition-all"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button 
                    onClick={downloadFull}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition-all"
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
                    onClick={() => setActiveTab(i)}
                    className={`px-4 py-2 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === i ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-50'}`}
                  >
                    Cap {i + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-serif italic">{generatedChapters[activeTab].title}</h3>
                  <button 
                    onClick={() => downloadChapter(activeTab)}
                    className="p-2 hover:bg-[var(--bg)] rounded-lg transition-colors"
                  >
                    <Download size={18} />
                  </button>
                </div>
                <div className="font-serif leading-relaxed text-lg whitespace-pre-wrap bg-[var(--bg)] p-6 rounded-xl border border-[var(--border)] max-h-[500px] overflow-y-auto">
                  {generatedChapters[activeTab].content}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
