/**
 * ⚠️ PLACEHOLDER — Tipos de la base de datos.
 *
 * Este archivo se REGENERA desde el esquema real de Supabase con:
 *     npm run gen:types
 * (equivale a: supabase gen types typescript --linked > src/types/database.types.ts)
 *
 * Mientras tanto, declaramos un par de tablas mínimas (persona, perfil) con
 * el naming snake_case que ya usa JHipster (§7 del plan) para que el resto
 * del scaffold compile. NO es la fuente de verdad: lo será el esquema migrado.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      persona: {
        Row: {
          id: number;
          nombre_completo: string | null;
          numero_id: string | null;
          email: string | null;
          empresa: string | null;
          foto: string | null;
          id_estado: number | null;
          fecha_creacion: string | null;
        };
        Insert: {
          id?: number;
          nombre_completo?: string | null;
          numero_id?: string | null;
          email?: string | null;
          empresa?: string | null;
          foto?: string | null;
          id_estado?: number | null;
          fecha_creacion?: string | null;
        };
        Update: {
          id?: number;
          nombre_completo?: string | null;
          numero_id?: string | null;
          email?: string | null;
          empresa?: string | null;
          foto?: string | null;
          id_estado?: number | null;
          fecha_creacion?: string | null;
        };
        Relationships: [];
      };
      perfil: {
        Row: {
          id: string;
          id_gesta_os: string | null;
          login: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          empresa: string;
          roles: string[];
          activated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          id_gesta_os?: string | null;
          login: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          empresa?: string;
          roles?: string[];
          activated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          id_gesta_os?: string | null;
          login?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          empresa?: string;
          roles?: string[];
          activated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      asignar_persona_proyecto: {
        Args: { p_id_persona: number; p_id_proyecto: number; p_cargo: string };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

// --- Helpers de tipo (mismo shape que los que genera supabase-js) ---
type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
