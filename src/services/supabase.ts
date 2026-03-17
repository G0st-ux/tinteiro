import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vojusvpholxntrxbihhk.supabase.co';
const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvanVzdnBob2x4bnRyeGJpaGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDg0ODMsImV4cCI6MjA4OTI4NDQ4M30.3ZDj8YwKe5vHHBPBKu51LKC09ZSPTyn2AO0HigYi1zY';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use the env key only if it looks like a valid JWT, otherwise use the hardcoded one
// This prevents the "Invalid API key" error if the old key is still in the platform settings
const supabaseKey = (envKey && envKey.startsWith('eyJ')) ? envKey : hardcodedKey;

// Debug log to verify which key is being used
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key Source:', (envKey && envKey.startsWith('eyJ')) ? 'Environment' : 'Hardcoded Fallback');

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  bio?: string;
  idioma: string;
  banido: boolean;
  criado_em: string;
  senha?: string; // Adicionado para facilitar o login direto conforme solicitado
}
