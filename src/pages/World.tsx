import React, { useState } from 'react';
import { Location, useLocalStorage, AppSettings } from '../types';
import { LOCATION_TYPES } from '../constants';
import { Map, Plus, Trash2, MapPin, FileText, Globe, Compass, Sparkles, Loader2, Edit2, Link as LinkIcon } from 'lucide-react';
import { generateImagePrompt } from '../services/geminiService';

interface WorldProps {
  settings: AppSettings;
  locations: Location[];
  setLocations: (l: Location[]) => void;
  t: any;
}

export const World: React.FC<WorldProps> = ({ settings, locations, setLocations, t }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const initialFormState: Location = {
    id: '',
    name: '',
    type: LOCATION_TYPES[0],
    description: '',
    climate: '',
    inhabitants: '',
    pointsOfInterest: '',
    connections: []
  };

  const [form, setForm] = useState<Location>(initialFormState);

  const handleSave = () => {
    if (!form.name) {
      alert("O nome do local é obrigatório.");
      return;
    }

    if (editingId) {
      setLocations(locations.map(l => l.id === editingId ? { ...form, id: editingId } : l));
    } else {
      setLocations([...locations, { ...form, id: Math.random().toString(36).substr(2, 9) }]);
    }
    
    setIsFormOpen(false);
    setEditingId(null);
    setForm(initialFormState);
  };

  const handleEdit = (loc: Location) => {
    setForm(loc);
    setEditingId(loc.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este local?")) {
      setLocations(locations.filter(l => l.id !== id));
    }
  };

  const handleGenerateImage = async () => {
    if (!form.description) {
      alert("Por favor, descreva o local primeiro.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const prompt = await generateImagePrompt(settings, form.description, 'Cenário', 'Fantasia');
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&model=flux`;
      setForm({ ...form, imageUrl });
    } catch (error) {
      alert("Erro ao gerar imagem.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-8 fade-in pb-20">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="section-tag">
            <Globe size={12} />
            Mundo
          </div>
          <h1 className="h1">{t.world}</h1>
          <p className="font-serif italic text-lg text-white/40">Mapeie os reinos e cidades da sua imaginação</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { setForm(initialFormState); setEditingId(null); setIsFormOpen(true); }} 
            className="btn-primary"
          >
            <Plus size={18} />
            Novo Local
          </button>
        )}
      </header>

      {isFormOpen ? (
        <div className="card-ink space-y-8 fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-bold font-serif">{editingId ? 'Editar' : 'Novo'} Local</h2>
            <div className="flex gap-2">
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost">Cancelar</button>
              <button onClick={handleSave} className="btn-primary">Salvar</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="aspect-video bg-[var(--bg)] border border-[var(--border)] rounded-[2px] overflow-hidden relative group">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt={form.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <Map size={64} />
                  </div>
                )}
                <button 
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white gap-2 font-bold"
                >
                  {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  Gerar com IA
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="label">Nome do Local</label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Tipo</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="input-field"
                  >
                    {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label">Clima e Geografia</label>
                  <input 
                    type="text" 
                    value={form.climate}
                    onChange={e => setForm({...form, climate: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Habitantes / Povos</label>
                  <input 
                    type="text" 
                    value={form.inhabitants}
                    onChange={e => setForm({...form, inhabitants: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">Descrição Detalhada</label>
                <textarea 
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="input-field h-32 resize-none font-serif"
                />
              </div>

              <div className="space-y-2">
                <label className="label">Pontos de Interesse</label>
                <textarea 
                  value={form.pointsOfInterest}
                  onChange={e => setForm({...form, pointsOfInterest: e.target.value})}
                  className="input-field h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="label">Conexões (Outros Locais)</label>
                <div className="flex flex-wrap gap-2">
                  {locations.filter(l => l.id !== editingId).map(l => (
                    <button
                      key={l.id}
                      onClick={() => {
                        const newConns = form.connections.includes(l.id)
                          ? form.connections.filter(id => id !== l.id)
                          : [...form.connections, l.id];
                        setForm({...form, connections: newConns});
                      }}
                      className={`px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-bold border transition-all flex items-center gap-2 ${
                        form.connections.includes(l.id)
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
                          : 'bg-[var(--bg)] border-[var(--border)] text-white/40 hover:text-white'
                      }`}
                    >
                      <LinkIcon size={12} />
                      {l.name}
                    </button>
                  ))}
                  {locations.length <= 1 && <p className="text-xs opacity-40 italic font-serif">Nenhum outro local cadastrado para conectar.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div key={loc.id} className="card-ink group flex flex-col gap-4 p-6">
              <div className="aspect-video bg-[var(--bg)] border border-[var(--border)] rounded-[2px] overflow-hidden relative">
                {loc.imageUrl ? (
                  <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <Compass size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(loc)} className="p-2 bg-black/50 text-white rounded-[2px] hover:bg-[var(--accent)] hover:text-black transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(loc.id)} className="p-2 bg-black/50 text-white rounded-[2px] hover:bg-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold uppercase rounded-[2px] tracking-widest">
                  {loc.type}
                </div>
              </div>
              <div>
                <h3 className="font-display text-[24px] font-semibold text-white group-hover:text-[var(--accent)] transition-colors leading-tight truncate">{loc.name}</h3>
                <p className="font-sans text-[14px] text-white/40 line-clamp-2 mt-2 leading-relaxed">{loc.description}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="label">CLIMA</span>
                  <span className="font-mono text-[11px] text-white/40">{loc.climate || 'Desconhecido'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="label">CONEXÕES</span>
                  <span className="font-mono text-[11px] text-[var(--accent)]">{loc.connections.length}</span>
                </div>
              </div>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="col-span-full py-24 text-center card-ink">
              <div className="w-16 h-16 bg-[var(--accent)]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe size={24} className="text-[var(--accent)]/50" />
              </div>
              <p className="font-display text-[24px] italic text-white/40 mb-4">{t.noLocations}</p>
              <p className="font-sans text-[13px] text-white/30 mb-8">O mapa ainda está em branco. ✨</p>
              <button onClick={() => { setForm(initialFormState); setEditingId(null); setIsFormOpen(true); }} className="btn-ghost mx-auto">Mapear Novo Local</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

