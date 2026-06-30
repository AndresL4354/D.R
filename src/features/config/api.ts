import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

const LIMIT = 500;

export async function listFaenas(): Promise<Tables<'faena'>[]> {
  const { data, error } = await supabase.from('faena').select('*').order('nombre').limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listCargos(): Promise<Tables<'cargo'>[]> {
  const { data, error } = await supabase.from('cargo').select('*').order('nombre').limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listDocumentos(): Promise<Tables<'documento'>[]> {
  const { data, error } = await supabase.from('documento').select('*').order('nombre').limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listEmpresas(): Promise<Tables<'empresa'>[]> {
  const { data, error } = await supabase
    .from('empresa')
    .select('*')
    .order('razon_social')
    .limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}

export async function listEmpresasCliente(): Promise<Tables<'empresa_cliente'>[]> {
  const { data, error } = await supabase
    .from('empresa_cliente')
    .select('*')
    .order('razon_social')
    .limit(LIMIT);
  if (error) throw error;
  return data ?? [];
}
