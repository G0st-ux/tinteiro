import React, { useState } from 'react';
import { User, Plus, Search, Trash2, Edit2, Sparkles, Download, Save, Image as ImageIcon, Loader2, Dice5, X, Send, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase opacity-50">{label}</label>
      <div className="space-y-2">
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
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" 
          />
          <button 
            type="button"
            onClick={handleAdd}
            className="px-3 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
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
    <div className="space-y-8 fade-in pb-20">
      {editingItem !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="inkwell-card max-w-sm w-full space-y-4">
            <h3 className="text-xl font-bold">Editar Item</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-50">Nome</label>
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
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-50">Descrição</label>
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
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm h-24"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-between pt-2">
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
                className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-bold uppercase"
              >
                Excluir
              </button>
              <button onClick={() => setEditingItem(null)} className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg font-bold">Concluído</button>
            </div>
          </div>
        </div>
      )}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="inkwell-card max-w-lg w-full h-[600px] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">Conversando com {form.basicInfo.name}</h3>
              <button onClick={() => { setIsChatOpen(false); setChatMessages([]); }} className="p-1 hover:bg-[var(--bg)] rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`p-3 rounded-xl ${m.role === 'user' ? 'bg-[var(--accent)] text-white ml-auto' : 'bg-[var(--bg)]'} max-w-[80%]`}>
                  {m.text}
                </div>
              ))}
              {isChatLoading && <div className="p-3 bg-[var(--bg)] rounded-xl opacity-50">Pensando...</div>}
            </div>
            <div className="p-4 border-t border-[var(--border)] flex gap-2">
              <input 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleChatSend()}
                className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2"
                placeholder="Diga algo..."
              />
              <button onClick={handleChatSend} className="p-2 bg-[var(--accent)] text-white rounded-lg"><Send size={20} /></button>
            </div>
          </div>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <User className="text-[var(--accent)]" />
            {t.characters}
          </h1>
          <p className="opacity-60">Gerencie o elenco da sua história</p>
        </div>
        <button 
          onClick={() => { setForm(initialFormState); setEditingId(null); setIsFormOpen(true); }}
          className="inkwell-button flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Personagem
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nome ou apelido..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-12 pr-4 py-3 focus:border-[var(--accent)] outline-none"
        />
      </div>

      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="inkwell-card max-w-sm w-full space-y-4">
            <h3 className="text-xl font-bold">Excluir Personagem</h3>
            <p className="opacity-70">Tem certeza que deseja excluir este personagem? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 opacity-60 hover:opacity-100">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="inkwell-card space-y-8 fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-bold">{editingId ? 'Editar' : 'Novo'} Personagem</h2>
            <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 opacity-60 hover:opacity-100">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="aspect-square bg-[var(--bg)] border border-[var(--border)] rounded-2xl overflow-hidden relative group">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt={form.basicInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <User size={80} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center transition-opacity text-white gap-2 font-bold">
                  <label className="cursor-pointer flex items-center gap-2 hover:text-[var(--accent)]">
                    <ImageIcon size={20} />
                    Upload
                    <input 
                      type="file" 
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
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div className="space-y-1">
                <TagInput 
                  label="Tags (Enter para adicionar)"
                  items={form.tags}
                  onAdd={name => setForm({ ...form, tags: [...form.tags, { name, description: '' }] })}
                  onEdit={index => setEditingItem({ path: 'tags', index })}
                />
              </div>
            </div>

              <div className="lg:col-span-2 space-y-4">
                {/* Accordion Sections */}
                {[
                  { id: 'basic', title: 'Informações Básicas', icon: User },
                  { id: 'appearance', title: 'Aparência', icon: ImageIcon },
                  { id: 'personality', title: 'Personalidade', icon: Sparkles },
                  { id: 'psychology', title: 'Psicologia', icon: Sparkles },
                  { id: 'history', title: 'História', icon: Save },
                  { id: 'skills', title: 'Habilidades', icon: Dice5 },
                  { id: 'relationships', title: 'Relacionamentos', icon: User },
                  { id: 'development', title: 'Desenvolvimento', icon: Loader2 },
                  { id: 'extras', title: 'Extras', icon: Plus },
                ].map((section) => (
                  <div key={section.id} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
                    <button 
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <section.icon size={18} className="text-[var(--accent)]" />
                        <span className="font-bold">{section.title}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSections.includes(section.id) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={18} />
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
                          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg)]/30 space-y-4">
                            {section.id === 'basic' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Nome Completo</label>
                            <input type="text" value={form.basicInfo.name} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, name: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Apelido / Codinome</label>
                            <input type="text" value={form.basicInfo.nickname} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, nickname: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Idade</label>
                            <input type="text" value={form.basicInfo.age} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, age: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Data de Nascimento</label>
                            <input type="text" value={form.basicInfo.birthDate} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, birthDate: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Gênero</label>
                            <input type="text" value={form.basicInfo.gender} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, gender: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Espécie / Raça</label>
                            <input type="text" value={form.basicInfo.species} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, species: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Altura</label>
                            <input type="text" value={form.basicInfo.height} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, height: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Peso</label>
                            <input type="text" value={form.basicInfo.weight} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, weight: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Nacionalidade / Origem</label>
                            <input type="text" value={form.basicInfo.nationality} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, nationality: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Ocupação / Classe Social</label>
                            <input type="text" value={form.basicInfo.occupation} onChange={e => setForm({...form, basicInfo: {...form.basicInfo, occupation: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Papel na História</label>
                            <select 
                              value={form.basicInfo.role} 
                              onChange={e => setForm({...form, basicInfo: {...form.basicInfo, role: e.target.value}})} 
                              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm"
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
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase opacity-50">Cor do Cabelo</label>
                              <input type="text" value={form.appearance.hairColor} onChange={e => setForm({...form, appearance: {...form.appearance, hairColor: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase opacity-50">Estilo do Cabelo</label>
                              <input type="text" value={form.appearance.hairStyle} onChange={e => setForm({...form, appearance: {...form.appearance, hairStyle: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase opacity-50">Cor dos Olhos</label>
                              <input type="text" value={form.appearance.eyeColor} onChange={e => setForm({...form, appearance: {...form.appearance, eyeColor: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase opacity-50">Tom de Pele</label>
                              <input type="text" value={form.appearance.skinTone} onChange={e => setForm({...form, appearance: {...form.appearance, skinTone: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <TagInput 
                              label="Traço Marcante"
                              items={form.appearance.features}
                              onAdd={name => setForm({ ...form, appearance: { ...form.appearance, features: [...form.appearance.features, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'appearance.features', index })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Estilo de Roupa</label>
                            <input type="text" value={form.appearance.clothingStyle} onChange={e => setForm({...form, appearance: {...form.appearance, clothingStyle: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Postura / Linguagem Corporal</label>
                            <input type="text" value={form.appearance.posture} onChange={e => setForm({...form, appearance: {...form.appearance, posture: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Primeira Impressão</label>
                            <input type="text" value={form.appearance.firstImpression} onChange={e => setForm({...form, appearance: {...form.appearance, firstImpression: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                        </div>
                      )}

                      {section.id === 'personality' && (
                        <div className="space-y-4">
                          <TagInput 
                            label="Traços de Personalidade"
                            items={form.personality.traits}
                            onAdd={name => setForm({ ...form, personality: { ...form.personality, traits: [...form.personality.traits, { name, description: '' }] } })}
                            onEdit={index => setEditingItem({ path: 'personality.traits', index })}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <TagInput 
                                label="Virtude"
                                items={form.personality.virtues}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, virtues: [...form.personality.virtues, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.virtues', index })}
                              />
                            </div>
                            <div className="space-y-1">
                              <TagInput 
                                label="Defeito"
                                items={form.personality.defects}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, defects: [...form.personality.defects, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.defects', index })}
                              />
                            </div>
                            <div className="space-y-1">
                              <TagInput 
                                label="Hábitos/manias"
                                items={form.personality.habits}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, habits: [...form.personality.habits, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.habits', index })}
                              />
                            </div>
                            <div className="space-y-1">
                              <TagInput 
                                label="Medos"
                                items={form.personality.fears}
                                onAdd={name => setForm({ ...form, personality: { ...form.personality, fears: [...form.personality.fears, { name, description: '' }] } })}
                                onEdit={index => setEditingItem({ path: 'personality.fears', index })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <TagInput 
                              label="Desejo Profundo"
                              items={form.personality.deepDesires}
                              onAdd={name => setForm({ ...form, personality: { ...form.personality, deepDesires: [...form.personality.deepDesires, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'personality.deepDesires', index })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Motivação</label>
                            <input type="text" value={form.personality.motivation} onChange={e => setForm({...form, personality: {...form.personality, motivation: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">O que faz perder o controle</label>
                            <input type="text" value={form.personality.trigger} onChange={e => setForm({...form, personality: {...form.personality, trigger: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                        </div>
                      )}

                      {section.id === 'psychology' && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Maior Trauma</label>
                            <input type="text" value={form.psychology.trauma} onChange={e => setForm({...form, psychology: {...form.psychology, trauma: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Maior Sonho</label>
                            <input type="text" value={form.psychology.dream} onChange={e => setForm({...form, psychology: {...form.psychology, dream: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Maior Segredo</label>
                            <input type="text" value={form.psychology.secret} onChange={e => setForm({...form, psychology: {...form.psychology, secret: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">O que nunca admitiria</label>
                            <input type="text" value={form.psychology.neverAdmit} onChange={e => setForm({...form, psychology: {...form.psychology, neverAdmit: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Como reage sob pressão</label>
                            <input type="text" value={form.psychology.pressureReaction} onChange={e => setForm({...form, psychology: {...form.psychology, pressureReaction: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Tipo de Inteligência</label>
                            <input type="text" value={form.psychology.intelligenceType} onChange={e => setForm({...form, psychology: {...form.psychology, intelligenceType: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                        </div>
                      )}

                      {section.id === 'history' && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">História de Fundo (Lore)</label>
                            <textarea 
                              value={form.history.lore} 
                              onChange={e => setForm({...form, history: {...form.history, lore: e.target.value}})} 
                              placeholder="A história geral e o passado do personagem..."
                              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm h-32" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Infância</label>
                            <textarea value={form.history.childhood} onChange={e => setForm({...form, history: {...form.history, childhood: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm h-64" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Evento que mudou sua vida</label>
                            <textarea value={form.history.lifeChangingEvent} onChange={e => setForm({...form, history: {...form.history, lifeChangingEvent: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm h-32" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Família</label>
                            <input type="text" value={form.history.family} onChange={e => setForm({...form, history: {...form.history, family: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <TagInput 
                              label="Mentores ou figuras importantes"
                              items={form.history.mentors}
                              onAdd={name => setForm({ ...form, history: { ...form.history, mentors: [...form.history.mentors, { name, description: '' }] } })}
                              onEdit={index => setEditingItem({ path: 'history.mentors', index })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Como entrou na história principal</label>
                            <textarea value={form.history.entryToMainStory} onChange={e => setForm({...form, history: {...form.history, entryToMainStory: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm h-32" />
                          </div>
                        </div>
                      )}

                      {section.id === 'skills' && (
                        <div className="space-y-4">
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
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Nível de Experiência</label>
                            <input type="text" value={form.skills.experienceLevel} onChange={e => setForm({...form, skills: {...form.skills, experienceLevel: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                        </div>
                      )}

                      {section.id === 'relationships' && (
                        <div className="space-y-4">
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
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Interesse amoroso</label>
                            <input type="text" value={form.relationships.loveInterest} onChange={e => setForm({...form, relationships: {...form.relationships, loveInterest: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
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
                      )}

                      {section.id === 'development' && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Objetivo no começo</label>
                            <input type="text" value={form.development.initialGoal} onChange={e => setForm({...form, development: {...form.development, initialGoal: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Conflito interno</label>
                            <input type="text" value={form.development.internalConflict} onChange={e => setForm({...form, development: {...form.development, internalConflict: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Mudança que vai sofrer</label>
                            <textarea value={form.development.change} onChange={e => setForm({...form, development: {...form.development, change: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm h-20" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Quem se torna no final</label>
                            <textarea value={form.development.finalSelf} onChange={e => setForm({...form, development: {...form.development, finalSelf: e.target.value}})} className="w-full bg-[var(--bg)] border border(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm h-20" />
                          </div>
                        </div>
                      )}

                      {section.id === 'extras' && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Frase de Efeito</label>
                            <input type="text" value={form.extras.catchphrase} onChange={e => setForm({...form, extras: {...form.extras, catchphrase: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Música que representa</label>
                            <input type="text" value={form.extras.themeSong} onChange={e => setForm({...form, extras: {...form.extras, themeSong: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase opacity-50">Comida favorita</label>
                              <input type="text" value={form.extras.favoriteFood} onChange={e => setForm({...form, extras: {...form.extras, favoriteFood: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase opacity-50">Cor favorita</label>
                              <input type="text" value={form.extras.favoriteColor} onChange={e => setForm({...form, extras: {...form.extras, favoriteColor: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase opacity-50">Algo aparentemente insignificante que ama</label>
                            <input type="text" value={form.extras.insignificantThing} onChange={e => setForm({...form, extras: {...form.extras, insignificantThing: e.target.value}})} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus:border-[var(--accent)] outline-none text-sm" />
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
          <div className="flex justify-end gap-2 pt-6 border-t border-[var(--border)]">
            <button onClick={() => setIsChatOpen(true)} className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg flex items-center gap-2">
              <Sparkles size={16} /> Conversar
            </button>
            <button onClick={handleSave} className="inkwell-button">Salvar</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCharacters.map(char => (
            <div key={char.id} className="inkwell-card group hover:border-[var(--accent)] transition-all flex flex-col gap-4">
              <div className="aspect-square bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden relative">
                {char.imageUrl ? (
                  <img src={char.imageUrl} alt={char.basicInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <User size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <button onClick={() => handleEdit(char)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-[var(--accent)]"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(char.id)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold truncate">{char.basicInfo.name}</h3>
                <p className="text-xs opacity-50 font-bold uppercase tracking-wider">{char.basicInfo.occupation}</p>
                {char.basicInfo.nickname && <p className="text-sm italic opacity-70 mt-1">"{char.basicInfo.nickname}"</p>}
                {char.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {char.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-[var(--bg)] px-2 py-0.5 rounded-full opacity-70">{tag.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-bold uppercase opacity-50">
                <span>{char.basicInfo.age || '?'} anos</span>
                <span>{char.basicInfo.gender || '?'}</span>
              </div>
            </div>
          ))}
          {filteredCharacters.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30">
              <User size={64} className="mx-auto mb-4" />
              <p className="text-xl font-serif">{t.noCharacters}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
