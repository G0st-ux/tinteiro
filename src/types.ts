import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  charCount: number;
  wordCount: number;
  chapters?: { title: string; content: string }[];
}

export interface Character {
  id: string;
  basicInfo: {
    name: string;
    nickname: string;
    age: string;
    birthDate: string;
    gender: string;
    species: string;
    height: string;
    weight: string;
    nationality: string;
    occupation: string;
    role: string;
  };
  appearance: {
    hairColor: string;
    hairStyle: string;
    eyeColor: string;
    skinTone: string;
    features: { name: string; description: string }[];
    clothingStyle: string;
    posture: string;
    firstImpression: string;
  };
  personality: {
    traits: { name: string; description: string }[];
    virtues: { name: string; description: string }[];
    defects: { name: string; description: string }[];
    habits: { name: string; description: string }[];
    fears: { name: string; description: string }[];
    deepDesires: { name: string; description: string }[];
    motivation: string;
    trigger: string;
  };
  psychology: {
    trauma: string;
    dream: string;
    secret: string;
    neverAdmit: string;
    pressureReaction: string;
    intelligenceType: string;
  };
  skills: {
    talents: { name: string; description: string }[];
    trainedSkills: { name: string; description: string }[];
    weaknesses: { name: string; description: string }[];
    powers: { name: string; description: string }[];
    experienceLevel: string;
  };
  history: {
    lore: string;
    childhood: string;
    lifeChangingEvent: string;
    family: string;
    mentors: { name: string; description: string }[];
    entryToMainStory: string;
  };
  relationships: {
    allies: { name: string; description: string }[];
    rivals: { name: string; description: string }[];
    loveInterest: string;
    mostHated: { name: string; description: string }[];
    mostTrusted: { name: string; description: string }[];
  };
  development: {
    initialGoal: string;
    internalConflict: string;
    change: string;
    finalSelf: string;
  };
  extras: {
    catchphrase: string;
    themeSong: string;
    favoriteFood: string;
    favoriteColor: string;
    insignificantThing: string;
  };
  imageUrl?: string;
  tags: { name: string; description: string }[];
}

export interface Location {
  id: string;
  name: string;
  type: string;
  description: string;
  climate: string;
  inhabitants: string;
  pointsOfInterest: string;
  connections: string[];
  imageUrl?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  type: string;
  createdAt: number;
  linkedTo?: { type: 'character' | 'location'; id: string };
}

export interface AppSettings {
  theme: string;
  accentColor: string;
  language: 'pt' | 'en' | 'es';
  compactMode: boolean;
  geminiKey: string;
  imageKey: string;
}

export const defaultSettings: AppSettings = {
  theme: 'midnight',
  accentColor: '#e2b850',
  language: 'pt',
  compactMode: false,
  geminiKey: '',
  imageKey: ''
};
