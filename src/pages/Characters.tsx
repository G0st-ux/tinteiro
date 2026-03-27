import React, { useState } from 'react';
import { User, Plus, Search, Trash2, Edit2, Sparkles, Download, Save, Image as ImageIcon, Loader2, Dice5, X, Send, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, Character, useLocalStorage } from '../types';
import { CHARACTER_ROLES, NAME_STYLES, IMAGE_STYLES, IMAGE_TYPES } from '../constants';
import { suggestCharacterName } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface CharactersProps {
  settings: AppSettings;
  characters: Character[];
  setCharacters: (c: Character[]) => void;
  t: any;
}

interface ItemWithDescription {
  name: string;
  description: string;
}

const TagInput: React.FC<{
  label: string;
  items: ItemWithDescription[];
  onAdd: (name: string) => void;
  onEdit: (index: number) => void;
  placeholder?: string;
}> = ({ label, items, onAdd, onEdit, placeholder }) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <div className="space-y-3">
      <label className="label">{label}</label>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={placeholder || "Adicionar..."}
            className="input-field flex-1 !py-2 !px-3 text-sm" 
          />
          <button 
            type="button"
            onClick={handleAdd}
            className="px-4 bg-accent text-black rounded-xl hover:bg-accent-light transition-all flex items-center justify-center shadow-lg shadow-accent/20"
            title="Adicionar"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => onEdit(index)}
              className="group flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] px-3 py-1 rounded-full text-xs transition-all"
              title={item.description || 'Clique para adicionar descrição'}
            >
              <span className="font-bold">{item.name}</span>
              {item.description && <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Characters: React.FC<CharactersProps> = ({ settings, characters, setCharacters, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [editingItem, setEditingItem] = useState<{ path: string, index: number } | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const initialFormState: Character = {
    id: '',
    basicInfo: {
      name: '',
      nickname: '',
      age: '',
      birthDate: '',
      gender: '',
      species: '',
      height: '',
      weight: '',
      nationality: '',
      occupation: '',
      role: '',
    },
    appearance: {
      hairColor: '',
      hairStyle: '',
      eyeColor: '',
      skinTone: '',
      features: [],
      clothingStyle: '',
      posture: '',
      firstImpression: '',
    },
    personality: {
      traits: [],
      virtues: [],
      defects: [],
      habits: [],
      fears: [],
      deepDesires: [],
      motivation: '',
      trigger: '',
    },
    psychology: {
      trauma: '',
      dream: '',
      secret: '',
      neverAdmit: '',
      pressureReaction: '',
      intelligenceType: '',
    },
    skills: {
      talents: [],
      trainedSkills: [],
      weaknesses: [],
      powers: [],
      experienceLevel: '',
    },
    history: {
      lore: '',
      childhood: '',
      lifeChangingEvent: '',
      family: '',
      mentors: [],
      entryToMainStory: '',
    },
    relationships: {
      allies: [],
      rivals: [],
      loveInterest: '',
      mostHated: [],
      mostTrusted: [],
    },
    development: {
      initialGoal: '',
      internalConflict: '',
      change: '',
      finalSelf: '',
    },
    extras: {
      catchphrase: '',
      themeSong: '',
      favoriteFood: '',
      favoriteColor: '',
      insignificantThing: '',
    },
    tags: [],
  };

  const [form, setForm] = useState<Character>(initialFormState);

  const filteredCharacters = characters.filter(c => 
    c.basicInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.basicInfo.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!form.basicInfo.name) {
      alert("O nome é obrigatório.");
      return;
    }

    if (editingId) {
      setCharacters(characters.map(c => c.id === editingId ? { ...form, id: editingId } : c));
    } else {
      setCharacters([...characters, { ...form, id: Math.random().toString(36).substr(2, 9) }]);
    }
    
    setIsFormOpen(false);
    setEditingId(null);
    setForm(initialFormState);
  };

  const handleEdit = (char: Character) => {
    setForm(char);
    setEditingId(char.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      setCharacters(characters.filter(c => c.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const handleSuggestName = async () => {
    setIsGeneratingName(true);
    try {
      const randomStyle = NAME_STYLES[Math.floor(Math.random() * NAME_STYLES.length)];
      const names = await suggestCharacterName(settings, randomStyle);
      const randomName = names[Math.floor(Math.random() * names.length)];
      setForm({ ...form, basicInfo: { ...form.basicInfo, name: randomName } });
    } catch (error) {
      alert("Erro ao sugerir nome.");
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const apiKey = settings.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key não configurada");

      const ai = new GoogleGenAI({ apiKey });
      
      const characterPrompt = `Você é o personagem ${form.basicInfo.name}. 
      Papel: ${form.basicInfo.role}.
      Apelido: ${form.basicInfo.nickname}.
      Idade: ${form.basicInfo.age}.
      Ocupação: ${form.basicInfo.occupation}.
      Lore: ${form.history.lore}.
      Poderes: ${form.skills.powers.map(p => `${p.name}: ${p.description}`).join('; ')}.
      Habilidades: ${form.skills.trainedSkills.map(s => `${s.name}: ${s.description}`).join('; ')}.
      Talentos: ${form.skills.talents.map(t => `${t.name}: ${t.description}`).join('; ')}.
      Traços Marcantes: ${form.appearance.features.map(f => `${f.name}: ${f.description}`).join('; ')}.
      Traços: ${form.personality.traits.map(t => `${t.name}: ${t.description}`).join('; ')}.
      Virtudes: ${form.personality.virtues.map(v => `${v.name}: ${v.description}`).join('; ')}.
      Defeitos: ${form.personality.defects.map(d => `${d.name}: ${d.description}`).join('; ')}.
      Hábitos: ${form.personality.habits.map(h => `${h.name}: ${h.description}`).join('; ')}.
      Medos: ${form.personality.fears.map(m => `${m.name}: ${m.description}`).join('; ')}.
      Desejos Profundos: ${form.personality.deepDesires.map(d => `${d.name}: ${d.description}`).join('; ')}.
      História: ${form.history.childhood}.
      Motivação: ${form.personality.motivation}.
      Mentores: ${form.history.mentors.map(m => `${m.name}: ${m.description}`).join('; ')}.
      Responda como se fosse este personagem, mantendo a personalidade e o tom de voz.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            { role: 'user', parts: [{ text: characterPrompt }] },
            ...chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMessage.text }] }
        ]
      });

      setChatMessages(prev => [...prev, { role: 'model', text: response.text || "" }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Erro ao conectar com o personagem." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-12 fade-in pb-20">
      {/* Modais e Overlays mantidos conforme lógica original, mas com estilos atualizados */}
      {editingItem !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="glass p-8 rounded-[2.5rem] border-white/10 max-w-sm w-full space-y-6 shadow-2xl">
            <h3 className="text-2xl font-serif font-black">Editar Item</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="label">Nome</label>
                <input 
                  type="text" 
                  value={editingItem.path.includes('.') 
                    ? (form as any)[editingItem.path.split('.')[0]][editingItem.path.split('.')[1]][editingItem.index]?.name || ''
                    : (form as any)[editingItem.path][editingItem.index]?.name || ''
                  } 
                  onChange={e => {
                    if (editingItem.path.includes('.')) {
                      const [section, field] = editingItem.path.split('.');
                      const newItems = [...(form as any)[section][field]];
                      newItems[editingItem.index] = { ...newItems[editingItem.index], name: e.target.value };
                      setForm({ ...form, [section]: { ...(form as any)[section], [field]: newItems } });
                    } else {
                      const field = editingItem.path;
                      const newItems = [...(form as any)[field]];
                      newItems[editingItem.index] = { ...newItems[editingItem.index], name: e.target.value };
                      setForm({ ...form, [field]: newItems });
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none text-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="label">Descrição</label>
                <textarea 
                  value={editingItem.path.includes('.') 
                    ? (form as any)[editingItem.path.split('.')[0]][editingItem.path.split('.')[1]][editingItem.index]?.description || ''
                    : (form as any)[editingItem.path][editingItem.index]?.description || ''
                  } 
                  onChange={e => {
                    if (editingItem.path.includes('.')) {
                      const [section, field] = editingItem.path.split('.');
                      const newItems = [...(form as any)[section][field]];
                      newItems[editingItem.index] = { ...newItems[editingItem.index], description: e.target.value };
                      setForm({ ...form, [section]: { ...(form as any)[section], [field]: newItems } });
                    } else {
                      const field = editingItem.path;
                      const newItems = [...(form as any)[field]];
                      newItems[editingItem.index] = { ...newItems[editingItem.index], description: e.target.value };
                      setForm({ ...form, [field]: newItems });
                    }
                  }}
                  placeholder="Descrição ou detalhes..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-accent outline-none text-sm h-32 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between pt-4">
              <button 
                onClick={() => {
                  if (editingItem.path.includes('.')) {
                    const [section, field] = editingItem.path.split('.');
                    const newItems = (form as any)[section][field].filter((_: any, i: number) => i !== editingItem.index);
                    setForm({ ...form, [section]: { ...(form as any)[section], [field]: newItems } });
                  } else {
                    const field = editingItem.path;
                    const newItems = (form as any)[field].filter((_: any, i: number) => i !== editingItem.index);
                    setForm({ ...form, [field]: newItems });
                  }
                  setEditingItem(null);
                }} 
                className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Excluir
              </button>
              <button onClick={() => setEditingItem(null)} className="btn-primary !py-2 !px-6">Concluído</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="section-tag">
            <User size={12} />
            Elenco de Personagens
          </div>
          <h1 className="h1">{t.characters}</h1>
          <p className="font-serif italic text-lg text-white/40">Dê vida e profundidade aos protagonistas da sua jornada.</p>
        </div>
        <button 
          onClick={() => { setForm(initialFormState); setEditingId(null); setIsFormOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} />
          Novo Personagem
        </button>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--accent)] transition-colors" size={18} />
        <input 
          type="text"
          placeholder="Buscar por nome ou apelido..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="input-field w-full pl-12"
        />
      </div>

      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass max-w-sm w-full p-10 rounded-[3rem] border-white/10 space-y-8 text-center"
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-black">Excluir Personagem</h3>
              <p className="text-white/40 italic font-serif">Tem certeza que deseja excluir este personagem? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete} 
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Confirmar Exclusão
              </button>
              <button 
                onClick={() => setDeleteTargetId(null)} 
                className="w-full py-4 bg-white/5 text-white/60 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isFormOpen ? (
        <div className="card-ink overflow-hidden p-0 fade-in shadow-2xl">
          <div className="p-10 lg:p-16 space-y-12">
            <header className="flex items-center justify-between border-b border-[var(--border)] pb-10">
              <div className="space-y-1">
                <h2 className="text-4xl font-serif font-black">{editingId ? 'Editar Personagem' : 'Novo Personagem'}</h2>
                <p className="text-white/40 italic font-serif">Defina a essência e os traços do seu personagem.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-4 hover:bg-[var(--bg)] rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Coluna da Imagem e Tags */}
              <div className="lg:col-span-4 space-y-10">
                <div className="relative group aspect-[3/4] rounded-[2px] overflow-hidden bg-[var(--bg)] border border-[var(--border)]">
                  {form.imageUrl ? (
                    <>
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <label className="p-4 bg-white text-black rounded-full cursor-pointer hover:scale-110 transition-transform">
                          <Upload size={20} />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setForm({ ...form, imageUrl: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                        <button 
                          onClick={() => setForm({ ...form, imageUrl: '' })}
                          className="p-4 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--card)] transition-colors group">
                      <div className="w-20 h-20 rounded-full bg-[var(--card)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload size={32} className="text-white/20 group-hover:text-[var(--accent)]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white font-sans">Upload de Imagem</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setForm({ ...form, imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/20">
                    <div className="w-4 h-[1px] bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] font-sans">Arquétipos</span>
                  </div>
                  <TagInput 
                    label="Tags (Enter para adicionar)"
                    items={form.tags}
                    onAdd={name => setForm({ ...form, tags: [...form.tags, { name, description: '' }] })}
                    onEdit={index => setEditingItem({ path: 'tags', index })}
                  />
                </div>
              </div>

              {/* Coluna do Formulário (Acordeões) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Accordion Sections */}
                {[
                  { id: 'basic', title: 'Identidade', icon: User },
                  { id: 'appearance', title: 'Aparência', icon: ImageIcon },
                  { id: 'personality', title: 'Personalidade', icon: Sparkles },
                  { id: 'psychology', title: 'Psicologia', icon: Sparkles },
                  { id: 'history', title: 'História', icon: Save },
                  { id: 'skills', title: 'Habilidades', icon: Dice5 },
                  { id: 'relationships', title: 'Relacionamentos', icon: User },
                  { id: 'development', title: 'Desenvolvimento', icon: Loader2 },
                  { id: 'extras', title: 'Extras', icon: Plus },
                ].map((section) => (
                  <div key={section.id} className="bg-[var(--bg)] rounded-[2px] border border-[var(--border)] overflow-hidden">
                    <button 
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-[var(--card)] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[2px] bg-[var(--card)] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <section.icon size={18} className="text-[var(--accent)]" />
                        </div>
                        <span className="font-serif font-black text-lg">{section.title}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSections.includes(section.id) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/40"
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedSections.includes(section.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-8 border-t border-[var(--border)] bg-[var(--bg)] space-y-8">
                            {section.id === 'basic' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                  <label className="label flex justify-between">
                                    Nome Completo
                                    <button 
                                      onClick={handleSuggestName}
                                      disabled={isGeneratingName}
                                      className="text-[var(--accent)] hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                      {isGeneratingName ? <Loader2 size={12} className="animate-spin" /> : <Dice5 size={12} />}
                                      <span className="text-[10px] font-black uppercase tracking-widest font-sans">Sugerir</span>
                                    </button>
                                  </label>
                                  <input type="text" value={form.basicInfo.name} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, name: e.target.value}})} className="input-field font-serif" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Apelido / Codinome</label>
                                  <input type="text" value={form.basicInfo.nickname} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, nickname: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Idade</label>
                                  <input type="text" value={form.basicInfo.age} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, age: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Data de Nascimento</label>
                                  <input type="text" value={form.basicInfo.birthDate} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, birthDate: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Gênero</label>
                                  <input type="text" value={form.basicInfo.gender} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, gender: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Espécie / Raça</label>
                                  <input type="text" value={form.basicInfo.species} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, species: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Altura</label>
                                  <input type="text" value={form.basicInfo.height} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, height: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Peso</label>
                                  <input type="text" value={form.basicInfo.weight} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, weight: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Nacionalidade / Origem</label>
                                  <input type="text" value={form.basicInfo.nationality} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, nationality: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Ocupação / Classe Social</label>
                                  <input type="text" value={form.basicInfo.occupation} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, occupation: e.target.value}})} className="input-field" />
                                </div>
                                <div className="space-y-2">
                                  <label className="label">Papel na História</label>
                                  <select 
                                    value={form.basicInfo.role} 
                                    onChange={e => setForm({...form, basicInfo: {...form.basicInfo, role: e.target.value}})} 
                                    className="input-field appearance-none"
                                  >
                                    <option value="">Selecione um papel...</option>
                                    {CHARACTER_ROLES.map(role => (
                                      <option key={role} value={role}>{role}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                      {section.id === 'appearance' && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="label">Cor do Cabelo</label>
                              <input type="text" value={form.appearance.hairColor} onChange={e => setForm({...form, appearance: {...form.appearance, hairColor: e.target.value}})} className="input-field" />
                            </div>
                            <div className="space-y-2">
                              <label className="label">Estilo do Cabelo</label>
                              <input type="text" value={form.appearance.hairStyle} onChange={e => setForm({...form, appearance: {...form.appearance, hairStyle: e.target.value}})} className="input-field" />
                            </div>
                            <div className="space-y-2">
                              <label className="label">Cor dos Olhos</label>
                              <input type="text" value={form.appearance.eyeColor} onChange={e => setForm({...form, appearance: {...form.appearance, eyeColor: e.target.value}})} className="input-field" />
                            </div>
                            <div className="space-y-2">
                              <label className="label">Tom de Pele</label>
                              <input type="text" value={form.appearance.skinTone} onChange={e => setForm({...form, appearance: {...form.appearance, skinTone: e.target.value}})} className="input-field" />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <TagInput 
                              label="Traços Marcantes"
                              items={form.appearance.features}
                              onAdd={name => setForm({ ...form, appearance: { ...form.appearance, features: [...form.appearance.features, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'appearance.features', index })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Estilo de Roupa</label>
                            <input type="text" value={form.appearance.clothingStyle} onChange={e => setForm({...form, appearance: {...form.appearance, clothingStyle: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Postura / Linguagem Corporal</label>
                            <input type="text" value={form.appearance.posture} onChange={e => setForm({...form, appearance: {...form.appearance, posture: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Primeira Impressão</label>
                            <input type="text" value={form.appearance.firstImpression} onChange={e => setForm({...form, appearance: {...form.appearance, firstImpression: e.target.value}})} className="input-field" />
                          </div>
                        </div>
                      )}

                      {section.id === 'personality' && (
                        <div className="space-y-8">
                          <TagInput 
                            label="Traços de Personalidade"
                            items={form.personality.traits}
                            onAdd={name => setForm({ ...form, personality: { ...form.personality, traits: [...form.personality.traits, { name, description: '' }] } })}
                            onEdit={index => setEditingItem({ path: 'personality.traits', index })}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <TagInput 
                                label="Virtudes"
                                items={form.personality.virtues}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, virtues: [...form.personality.virtues, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.virtues', index })}
                              />
                            </div>
                            <div className="space-y-4">
                              <TagInput 
                                label="Defeitos"
                                items={form.personality.defects}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, defects: [...form.personality.defects, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.defects', index })}
                              />
                            </div>
                            <div className="space-y-4">
                              <TagInput 
                                label="Hábitos / Manias"
                                items={form.personality.habits}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, habits: [...form.personality.habits, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.habits', index })}
                              />
                            </div>
                            <div className="space-y-4">
                              <TagInput 
                                label="Medos"
                                items={form.personality.fears}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, fears: [...form.personality.fears, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.fears', index })}
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <TagInput 
                              label="Desejos Profundos"
                              items={form.personality.deepDesires}
                              onAdd={name => setForm({ ...form, personality: { ...form.personality, deepDesires: [...form.personality.deepDesires, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'personality.deepDesires', index })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Motivação</label>
                            <input type="text" value={form.personality.motivation} onChange={e => setForm({...form, personality: {...form.personality, motivation: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">O que faz perder o controle</label>
                            <input type="text" value={form.personality.trigger} onChange={e => setForm({...form, personality: {...form.personality, trigger: e.target.value}})} className="input-field" />
                          </div>
                        </div>
                      )}

                      {section.id === 'psychology' && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="label">Maior Trauma</label>
                            <input type="text" value={form.psychology.trauma} onChange={e => setForm({...form, psychology: {...form.psychology, trauma: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Maior Sonho</label>
                            <input type="text" value={form.psychology.dream} onChange={e => setForm({...form, psychology: {...form.psychology, dream: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Maior Segredo</label>
                            <input type="text" value={form.psychology.secret} onChange={e => setForm({...form, psychology: {...form.psychology, secret: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">O que nunca admitiria</label>
                            <input type="text" value={form.psychology.neverAdmit} onChange={e => setForm({...form, psychology: {...form.psychology, neverAdmit: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Como reage sob pressão</label>
                            <input type="text" value={form.psychology.pressureReaction} onChange={e => setForm({...form, psychology: {...form.psychology, pressureReaction: e.target.value}})} className="input-field" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Tipo de Inteligência</label>
                            <input type="text" value={form.psychology.intelligenceType} onChange={e => setForm({...form, psychology: {...form.psychology, intelligenceType: e.target.value}})} className="input-field" />
                          </div>
                        </div>
                      )}

                      {section.id === 'history' && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="label">História de Fundo (Lore)</label>
                            <textarea 
                              value={form.history.lore} 
                              onChange={e => setForm({...form, history: {...form.history, lore: e.target.value}})} 
                              placeholder="A história geral e o passado do personagem..."
                              className="input-field h-48 resize-none" 
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="label">Infância</label>
                              <textarea value={form.history.childhood} onChange={e => setForm({...form, history: {...form.history, childhood: e.target.value}})} className="input-field h-32 resize-none" />
                            </div>
                            <div className="space-y-2">
                              <label className="label">Evento que mudou sua vida</label>
                              <textarea value={form.history.lifeChangingEvent} onChange={e => setForm({...form, history: {...form.history, lifeChangingEvent: e.target.value}})} className="input-field h-32 resize-none" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="label">Família</label>
                            <input type="text" value={form.history.family} onChange={e => setForm({...form, history: {...form.history, family: e.target.value}})} className="input-field" />
                          </div>
                          <TagInput 
                            label="Mentores ou figuras importantes"
                            items={form.history.mentors}
                            onAdd={name => setForm({ ...form, history: { ...form.history, mentors: [...form.history.mentors, { name, description: '' }] } })}
                            onEdit={index => setEditingItem({ path: 'history.mentors', index })}
                          />
                          <div className="space-y-2">
                            <label className="label">Como entrou na história principal</label>
                            <textarea value={form.history.entryToMainStory} onChange={e => setForm({...form, history: {...form.history, entryToMainStory: e.target.value}})} className="input-field h-32 resize-none" />
                          </div>
                        </div>
                      )}

                      {section.id === 'skills' && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TagInput 
                              label="Talentos Naturais"
                              items={form.skills.talents}
                              onAdd={name => setForm({ ...form, skills: { ...form.skills, talents: [...form.skills.talents, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'skills.talents', index })}
                            />
                            <TagInput 
                              label="Habilidades Treinadas"
                              items={form.skills.trainedSkills}
                              onAdd={name => setForm({ ...form, skills: { ...form.skills, trainedSkills: [...form.skills.trainedSkills, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'skills.trainedSkills', index })}
                            />
                            <TagInput 
                              label="Fraquezas"
                              items={form.skills.weaknesses}
                              onAdd={name => setForm({ ...form, skills: { ...form.skills, weaknesses: [...form.skills.weaknesses, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'skills.weaknesses', index })}
                            />
                            <TagInput 
                              label="Poderes"
                              items={form.skills.powers}
                              onAdd={name => setForm({ ...form, skills: { ...form.skills, powers: [...form.skills.powers, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'skills.powers', index })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Nível de Experiência</label>
                            <input type="text" value={form.skills.experienceLevel} onChange={e => setForm({...form, skills: {...form.skills, experienceLevel: e.target.value}})} className="input-field" />
                          </div>
                        </div>
                      )}

                      {section.id === 'relationships' && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TagInput 
                              label="Aliados"
                              items={form.relationships.allies}
                              onAdd={name => setForm({ ...form, relationships: { ...form.relationships, allies: [...form.relationships.allies, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'relationships.allies', index })}
                            />
                            <TagInput 
                              label="Rivais"
                              items={form.relationships.rivals}
                              onAdd={name => setForm({ ...form, relationships: { ...form.relationships, rivals: [...form.relationships.rivals, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'relationships.rivals', index })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Interesse amoroso</label>
                            <input type="text" value={form.relationships.loveInterest} onChange={e => setForm({...form, relationships: {...form.relationships, loveInterest: e.target.value}})} className="input-field" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TagInput 
                              label="Personagens que mais odeia"
                              items={form.relationships.mostHated}
                              onAdd={name => setForm({ ...form, relationships: { ...form.relationships, mostHated: [...form.relationships.mostHated, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'relationships.mostHated', index })}
                            />
                            <TagInput 
                              label="Personagens que mais confia"
                              items={form.relationships.mostTrusted}
                              onAdd={name => setForm({ ...form, relationships: { ...form.relationships, mostTrusted: [...form.relationships.mostTrusted, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'relationships.mostTrusted', index })}
                            />
                          </div>
                        </div>
                      )}

                      {section.id === 'development' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="label">Objetivo no começo</label>
                              <input type="text" value={form.development.initialGoal} onChange={e => setForm({...form, development: {...form.development, initialGoal: e.target.value}})} className="input-field" />
                            </div>
                            <div className="space-y-2">
                              <label className="label">Conflito interno</label>
                              <input type="text" value={form.development.internalConflict} onChange={e => setForm({...form, development: {...form.development, internalConflict: e.target.value}})} className="input-field" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="label">Mudança que vai sofrer</label>
                            <textarea value={form.development.change} onChange={e => setForm({...form, development: {...form.development, change: e.target.value}})} className="input-field h-32 resize-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="label">Quem se torna no final</label>
                            <textarea value={form.development.finalSelf} onChange={e => setForm({...form, development: {...form.development, finalSelf: e.target.value}})} className="input-field h-32 resize-none" />
                          </div>
                        </div>
                      )}

                      {section.id === 'extras' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="label">Frase de Efeito</label>
                              <input type="text" value={form.extras.catchphrase} onChange={e => setForm({...form, extras: {...form.extras, catchphrase: e.target.value}})} className="input-field" />
                            </div>
                            <div className="space-y-2">
                              <label className="label">Música que representa</label>
                              <input type="text" value={form.extras.themeSong} onChange={e => setForm({...form, extras: {...form.extras, themeSong: e.target.value}})} className="input-field" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="label">Comida favorita</label>
                              <input type="text" value={form.extras.favoriteFood} onChange={e => setForm({...form, extras: {...form.extras, favoriteFood: e.target.value}})} className="input-field" />
                            </div>
                            <div className="space-y-2">
                              <label className="label">Cor favorita</label>
                              <input type="text" value={form.extras.favoriteColor} onChange={e => setForm({...form, extras: {...form.extras, favoriteColor: e.target.value}})} className="input-field" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="label">Algo aparentemente insignificante que ama</label>
                            <input type="text" value={form.extras.insignificantThing} onChange={e => setForm({...form, extras: {...form.extras, insignificantThing: e.target.value}})} className="input-field" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="flex justify-end gap-4 pt-10 border-t border-[var(--border)]">
      <button 
        onClick={() => setIsChatOpen(true)} 
        className="btn-ghost !px-8"
      >
        <Sparkles size={18} /> Conversar com IA
      </button>
      <button 
        onClick={handleSave} 
        className="btn-primary !px-12"
      >
        <Save size={18} /> Salvar Personagem
      </button>
    </div>
  </div>
) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCharacters.length > 0 ? (
            filteredCharacters.map((char) => (
              <motion.div 
                layout
                key={char.id}
                className="card-ink card-character group"
              >
                <div className="flex items-start justify-between mb-4">
                  {char.imageUrl ? (
                    <div className="w-16 h-16 rounded-[2px] overflow-hidden border border-[var(--border)]">
                      <img src={char.imageUrl} alt={char.basicInfo.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                  ) : (
                    <div className="char-initial">
                      {char.basicInfo.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(char)}
                      className="p-2 text-white/40 hover:text-[var(--accent)] transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(char.id)}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-[24px] font-semibold text-white group-hover:text-[var(--accent)] transition-colors leading-tight">
                    {char.basicInfo.name}
                  </h3>
                  <p className="font-serif text-[14px] italic text-white/40">{char.basicInfo.role || char.basicInfo.occupation || "Papel não definido"}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                  {char.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="section-tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center card-ink">
              <div className="w-16 h-16 bg-[var(--accent)]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={24} className="text-[var(--accent)]/50" />
              </div>
              <p className="font-display text-[24px] italic text-white/40 mb-4">Nenhum personagem encontrado</p>
              <p className="font-sans text-[13px] text-white/30 mb-8">Seu elenco ainda está esperando para ser escalado. ✨</p>
              <button onClick={() => setIsFormOpen(true)} className="btn-ghost mx-auto">Criar Primeiro Personagem</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
