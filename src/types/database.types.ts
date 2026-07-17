export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accion_despacho: {
        Row: {
          accion: string | null
          aprobado: boolean | null
          comentario: string | null
          fecha: string | null
          fecha_modificacion: string | null
          id: number
          id_trabajador_despacho: number | null
          pendiente: boolean | null
          usuario_creacion: string | null
          usuario_modificacion: string | null
        }
        Insert: {
          accion?: string | null
          aprobado?: boolean | null
          comentario?: string | null
          fecha?: string | null
          fecha_modificacion?: string | null
          id?: number
          id_trabajador_despacho?: number | null
          pendiente?: boolean | null
          usuario_creacion?: string | null
          usuario_modificacion?: string | null
        }
        Update: {
          accion?: string | null
          aprobado?: boolean | null
          comentario?: string | null
          fecha?: string | null
          fecha_modificacion?: string | null
          id?: number
          id_trabajador_despacho?: number | null
          pendiente?: boolean | null
          usuario_creacion?: string | null
          usuario_modificacion?: string | null
        }
        Relationships: []
      }
      accion_incidente: {
        Row: {
          descripcion: string | null
          id: number
          id_reporte_flash: number | null
          ubicacion_documento: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          id_reporte_flash?: number | null
          ubicacion_documento?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          id_reporte_flash?: number | null
          ubicacion_documento?: string | null
        }
        Relationships: []
      }
      actividad: {
        Row: {
          descripcion: string | null
          fecha_sistema: string | null
          id: number
          id_proyecto: number | null
          nombre: string | null
          usuario_sistema: string | null
        }
        Insert: {
          descripcion?: string | null
          fecha_sistema?: string | null
          id?: number
          id_proyecto?: number | null
          nombre?: string | null
          usuario_sistema?: string | null
        }
        Update: {
          descripcion?: string | null
          fecha_sistema?: string | null
          id?: number
          id_proyecto?: number | null
          nombre?: string | null
          usuario_sistema?: string | null
        }
        Relationships: []
      }
      alerta: {
        Row: {
          comentario: string | null
          evidencias: string | null
          id: number
          id_tarea: number | null
          tipo_alerta: string | null
        }
        Insert: {
          comentario?: string | null
          evidencias?: string | null
          id?: number
          id_tarea?: number | null
          tipo_alerta?: string | null
        }
        Update: {
          comentario?: string | null
          evidencias?: string | null
          id?: number
          id_tarea?: number | null
          tipo_alerta?: string | null
        }
        Relationships: []
      }
      articulo: {
        Row: {
          clasificacion: string | null
          color: string | null
          descripcion: string | null
          fecha_expiracion: string | null
          fecha_fabricacion: string | null
          id: number
          identificador: boolean | null
          marca: string | null
          modelo: string | null
          opcional: boolean | null
          talla: string | null
          tipo: string | null
        }
        Insert: {
          clasificacion?: string | null
          color?: string | null
          descripcion?: string | null
          fecha_expiracion?: string | null
          fecha_fabricacion?: string | null
          id?: number
          identificador?: boolean | null
          marca?: string | null
          modelo?: string | null
          opcional?: boolean | null
          talla?: string | null
          tipo?: string | null
        }
        Update: {
          clasificacion?: string | null
          color?: string | null
          descripcion?: string | null
          fecha_expiracion?: string | null
          fecha_fabricacion?: string | null
          id?: number
          identificador?: boolean | null
          marca?: string | null
          modelo?: string | null
          opcional?: boolean | null
          talla?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      articulo_cargo: {
        Row: {
          id: number
          id_articulo: number | null
          id_cargo: number | null
        }
        Insert: {
          id?: number
          id_articulo?: number | null
          id_cargo?: number | null
        }
        Update: {
          id?: number
          id_articulo?: number | null
          id_cargo?: number | null
        }
        Relationships: []
      }
      auditoria_estado_despacho: {
        Row: {
          columna: string | null
          confirmado: boolean | null
          estado_anterior: string | null
          estado_nuevo: string | null
          fecha: string
          id: number
          id_despacho: number | null
          id_persona: number | null
          rut: string | null
          usuario: string | null
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          columna?: string | null
          confirmado?: boolean | null
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha?: string
          id?: number
          id_despacho?: number | null
          id_persona?: number | null
          rut?: string | null
          usuario?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          columna?: string | null
          confirmado?: boolean | null
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha?: string
          id?: number
          id_despacho?: number | null
          id_persona?: number | null
          rut?: string | null
          usuario?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: []
      }
      aviso_mantenimiento: {
        Row: {
          activo: boolean | null
          anticipacion_minutos: number | null
          created_by: string
          created_date: string | null
          duracion_minutos: number | null
          fecha_inicio: string | null
          id: number
          last_modified_by: string | null
          last_modified_date: string | null
          mensaje: string | null
          titulo: string | null
        }
        Insert: {
          activo?: boolean | null
          anticipacion_minutos?: number | null
          created_by: string
          created_date?: string | null
          duracion_minutos?: number | null
          fecha_inicio?: string | null
          id?: number
          last_modified_by?: string | null
          last_modified_date?: string | null
          mensaje?: string | null
          titulo?: string | null
        }
        Update: {
          activo?: boolean | null
          anticipacion_minutos?: number | null
          created_by?: string
          created_date?: string | null
          duracion_minutos?: number | null
          fecha_inicio?: string | null
          id?: number
          last_modified_by?: string | null
          last_modified_date?: string | null
          mensaje?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      bloqueo_persona: {
        Row: {
          descripcio_bloqueo: string | null
          estado: string | null
          fecha_bloqueo: string | null
          id: number
          id_persona: number | null
          motivo_bloqueo: string | null
          usuario: string | null
        }
        Insert: {
          descripcio_bloqueo?: string | null
          estado?: string | null
          fecha_bloqueo?: string | null
          id?: number
          id_persona?: number | null
          motivo_bloqueo?: string | null
          usuario?: string | null
        }
        Update: {
          descripcio_bloqueo?: string | null
          estado?: string | null
          fecha_bloqueo?: string | null
          id?: number
          id_persona?: number | null
          motivo_bloqueo?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      cargo: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string | null
          tipo_cargo: string | null
          valor_turno: number | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
          tipo_cargo?: string | null
          valor_turno?: number | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
          tipo_cargo?: string | null
          valor_turno?: number | null
        }
        Relationships: []
      }
      cargo_tipo_cuadrilla: {
        Row: {
          cantidad_personal: number | null
          id: number
          id_cargo: number | null
          id_tipo_cuadrilla: number | null
        }
        Insert: {
          cantidad_personal?: number | null
          id?: number
          id_cargo?: number | null
          id_tipo_cuadrilla?: number | null
        }
        Update: {
          cantidad_personal?: number | null
          id?: number
          id_cargo?: number | null
          id_tipo_cuadrilla?: number | null
        }
        Relationships: []
      }
      cargos_solicitados_proyectos: {
        Row: {
          cantidad: number | null
          cantidad_noche: number | null
          id: number
          id_cargo: number | null
          id_proyecto: number | null
          nombre_cargo: string | null
          turnos_efectivos: number | null
        }
        Insert: {
          cantidad?: number | null
          cantidad_noche?: number | null
          id?: number
          id_cargo?: number | null
          id_proyecto?: number | null
          nombre_cargo?: string | null
          turnos_efectivos?: number | null
        }
        Update: {
          cantidad?: number | null
          cantidad_noche?: number | null
          id?: number
          id_cargo?: number | null
          id_proyecto?: number | null
          nombre_cargo?: string | null
          turnos_efectivos?: number | null
        }
        Relationships: []
      }
      categoria_cargo: {
        Row: {
          descripcion: string | null
          empresa_cliente: number | null
          id: number
          nombre_categoria: string | null
        }
        Insert: {
          descripcion?: string | null
          empresa_cliente?: number | null
          id?: number
          nombre_categoria?: string | null
        }
        Update: {
          descripcion?: string | null
          empresa_cliente?: number | null
          id?: number
          nombre_categoria?: string | null
        }
        Relationships: []
      }
      citacion: {
        Row: {
          fecha_citacion: string | null
          id: number
        }
        Insert: {
          fecha_citacion?: string | null
          id?: number
        }
        Update: {
          fecha_citacion?: string | null
          id?: number
        }
        Relationships: []
      }
      comuna: {
        Row: {
          codigo_unico_territorial: number | null
          descripcion: string | null
          id: number
          id_region: number | null
          nombre: string | null
        }
        Insert: {
          codigo_unico_territorial?: number | null
          descripcion?: string | null
          id?: number
          id_region?: number | null
          nombre?: string | null
        }
        Update: {
          codigo_unico_territorial?: number | null
          descripcion?: string | null
          id?: number
          id_region?: number | null
          nombre?: string | null
        }
        Relationships: []
      }
      controles_criticos: {
        Row: {
          descripcion: string | null
          fecha: string | null
          id: number
          riesgo_fatalidad_asociado: string | null
        }
        Insert: {
          descripcion?: string | null
          fecha?: string | null
          id?: number
          riesgo_fatalidad_asociado?: string | null
        }
        Update: {
          descripcion?: string | null
          fecha?: string | null
          id?: number
          riesgo_fatalidad_asociado?: string | null
        }
        Relationships: []
      }
      cuadrilla: {
        Row: {
          estado: string | null
          id: number
          id_responsable: number | null
          id_tipo_cuadrilla: number | null
          nombre: string | null
          numero: number | null
        }
        Insert: {
          estado?: string | null
          id?: number
          id_responsable?: number | null
          id_tipo_cuadrilla?: number | null
          nombre?: string | null
          numero?: number | null
        }
        Update: {
          estado?: string | null
          id?: number
          id_responsable?: number | null
          id_tipo_cuadrilla?: number | null
          nombre?: string | null
          numero?: number | null
        }
        Relationships: []
      }
      despacho: {
        Row: {
          estado: string | null
          fecha_despacho: string | null
          id: number
          id_proyecto: number
          nombre_despacho: string | null
        }
        Insert: {
          estado?: string | null
          fecha_despacho?: string | null
          id?: number
          id_proyecto: number
          nombre_despacho?: string | null
        }
        Update: {
          estado?: string | null
          fecha_despacho?: string | null
          id?: number
          id_proyecto?: number
          nombre_despacho?: string | null
        }
        Relationships: []
      }
      detalle_entrega_epp: {
        Row: {
          cantidad: number | null
          color: string | null
          entregado: boolean | null
          id: number
          id_articulo: number | null
          id_detalle_mantenido: number | null
          id_entrega: number | null
          identificador: string | null
          interno: boolean | null
          marca: string | null
          modelo: string | null
          talla: string | null
          tipo: string | null
        }
        Insert: {
          cantidad?: number | null
          color?: string | null
          entregado?: boolean | null
          id?: number
          id_articulo?: number | null
          id_detalle_mantenido?: number | null
          id_entrega?: number | null
          identificador?: string | null
          interno?: boolean | null
          marca?: string | null
          modelo?: string | null
          talla?: string | null
          tipo?: string | null
        }
        Update: {
          cantidad?: number | null
          color?: string | null
          entregado?: boolean | null
          id?: number
          id_articulo?: number | null
          id_detalle_mantenido?: number | null
          id_entrega?: number | null
          identificador?: string | null
          interno?: boolean | null
          marca?: string | null
          modelo?: string | null
          talla?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      documento: {
        Row: {
          categoria_documento: string | null
          descripcion: string | null
          empresa: string | null
          id: number
          nombre: string | null
          privado: boolean | null
          requerido: boolean | null
          resultado: boolean | null
          tipo_resultado: string | null
          todas: boolean | null
        }
        Insert: {
          categoria_documento?: string | null
          descripcion?: string | null
          empresa?: string | null
          id?: number
          nombre?: string | null
          privado?: boolean | null
          requerido?: boolean | null
          resultado?: boolean | null
          tipo_resultado?: string | null
          todas?: boolean | null
        }
        Update: {
          categoria_documento?: string | null
          descripcion?: string | null
          empresa?: string | null
          id?: number
          nombre?: string | null
          privado?: boolean | null
          requerido?: boolean | null
          resultado?: boolean | null
          tipo_resultado?: string | null
          todas?: boolean | null
        }
        Relationships: []
      }
      documento_cuadrilla: {
        Row: {
          id: number
          id_cuadrilla: number | null
          id_documento: number | null
          ruta: string | null
        }
        Insert: {
          id?: number
          id_cuadrilla?: number | null
          id_documento?: number | null
          ruta?: string | null
        }
        Update: {
          id?: number
          id_cuadrilla?: number | null
          id_documento?: number | null
          ruta?: string | null
        }
        Relationships: []
      }
      documento_reporte_flash: {
        Row: {
          id: number
          id_reporte_flash: number | null
          nombre: string | null
          ubicacion: string | null
        }
        Insert: {
          id?: number
          id_reporte_flash?: number | null
          nombre?: string | null
          ubicacion?: string | null
        }
        Update: {
          id?: number
          id_reporte_flash?: number | null
          nombre?: string | null
          ubicacion?: string | null
        }
        Relationships: []
      }
      documento_tipo_cuadrilla: {
        Row: {
          cantidad_documentos: number | null
          id: number
          id_documento: number | null
          id_tipo_cuadrilla: number | null
        }
        Insert: {
          cantidad_documentos?: number | null
          id?: number
          id_documento?: number | null
          id_tipo_cuadrilla?: number | null
        }
        Update: {
          cantidad_documentos?: number | null
          id?: number
          id_documento?: number | null
          id_tipo_cuadrilla?: number | null
        }
        Relationships: []
      }
      documentos_cargo: {
        Row: {
          categoria_documento: string | null
          id: number
          id_cargo: number | null
          nombre: string | null
          privado: boolean | null
          requerido: boolean | null
        }
        Insert: {
          categoria_documento?: string | null
          id?: number
          id_cargo?: number | null
          nombre?: string | null
          privado?: boolean | null
          requerido?: boolean | null
        }
        Update: {
          categoria_documento?: string | null
          id?: number
          id_cargo?: number | null
          nombre?: string | null
          privado?: boolean | null
          requerido?: boolean | null
        }
        Relationships: []
      }
      documentos_persona: {
        Row: {
          documento: string | null
          fecha_vencimiento: string | null
          id: number
          id_persona: number | null
          nombre_documento: string | null
          semaforo: string | null
          tipo_documento: string | null
          valor_resultado: string | null
          vencido: boolean | null
        }
        Insert: {
          documento?: string | null
          fecha_vencimiento?: string | null
          id?: number
          id_persona?: number | null
          nombre_documento?: string | null
          semaforo?: string | null
          tipo_documento?: string | null
          valor_resultado?: string | null
          vencido?: boolean | null
        }
        Update: {
          documento?: string | null
          fecha_vencimiento?: string | null
          id?: number
          id_persona?: number | null
          nombre_documento?: string | null
          semaforo?: string | null
          tipo_documento?: string | null
          valor_resultado?: string | null
          vencido?: boolean | null
        }
        Relationships: []
      }
      empresa: {
        Row: {
          descripcion: string | null
          direccion: string | null
          estado: string | null
          id: number
          id_ciudad: number | null
          logo_uri_blanco: string | null
          logo_uri_color: string | null
          nit: string | null
          persona_contacto: string | null
          razon_social: string | null
          telefono: string | null
          telefono_contacto: string | null
        }
        Insert: {
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          id?: number
          id_ciudad?: number | null
          logo_uri_blanco?: string | null
          logo_uri_color?: string | null
          nit?: string | null
          persona_contacto?: string | null
          razon_social?: string | null
          telefono?: string | null
          telefono_contacto?: string | null
        }
        Update: {
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          id?: number
          id_ciudad?: number | null
          logo_uri_blanco?: string | null
          logo_uri_color?: string | null
          nit?: string | null
          persona_contacto?: string | null
          razon_social?: string | null
          telefono?: string | null
          telefono_contacto?: string | null
        }
        Relationships: []
      }
      empresa_cliente: {
        Row: {
          descripcion: string | null
          direccion: string | null
          estado: string | null
          id: number
          id_ciudad: number | null
          nit: string | null
          persona_contacto: string | null
          razon_social: string | null
          telefono: string | null
          telefono_contacto: string | null
        }
        Insert: {
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          id?: number
          id_ciudad?: number | null
          nit?: string | null
          persona_contacto?: string | null
          razon_social?: string | null
          telefono?: string | null
          telefono_contacto?: string | null
        }
        Update: {
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          id?: number
          id_ciudad?: number | null
          nit?: string | null
          persona_contacto?: string | null
          razon_social?: string | null
          telefono?: string | null
          telefono_contacto?: string | null
        }
        Relationships: []
      }
      entrega_epp: {
        Row: {
          comentarios: string | null
          fecha_creacion: string | null
          id: number
          id_cargo: number | null
          id_faena: number | null
          id_mochila_spdc: number | null
          id_persona: number | null
          id_proyecto: number | null
          path_firma: string | null
          razon_social_empresa: string | null
          usuario_entrega: string | null
        }
        Insert: {
          comentarios?: string | null
          fecha_creacion?: string | null
          id?: number
          id_cargo?: number | null
          id_faena?: number | null
          id_mochila_spdc?: number | null
          id_persona?: number | null
          id_proyecto?: number | null
          path_firma?: string | null
          razon_social_empresa?: string | null
          usuario_entrega?: string | null
        }
        Update: {
          comentarios?: string | null
          fecha_creacion?: string | null
          id?: number
          id_cargo?: number | null
          id_faena?: number | null
          id_mochila_spdc?: number | null
          id_persona?: number | null
          id_proyecto?: number | null
          path_firma?: string | null
          razon_social_empresa?: string | null
          usuario_entrega?: string | null
        }
        Relationships: []
      }
      equipo: {
        Row: {
          asignado: boolean | null
          color: string | null
          estado: string | null
          id: number
          id_interno: string | null
          id_persona_asignada: number | null
          id_tipo_equipo: number | null
          marca: string | null
          modelo: string | null
          patente: string | null
          path_foto: string | null
          tipo_propiedad: string | null
          year: number | null
        }
        Insert: {
          asignado?: boolean | null
          color?: string | null
          estado?: string | null
          id?: number
          id_interno?: string | null
          id_persona_asignada?: number | null
          id_tipo_equipo?: number | null
          marca?: string | null
          modelo?: string | null
          patente?: string | null
          path_foto?: string | null
          tipo_propiedad?: string | null
          year?: number | null
        }
        Update: {
          asignado?: boolean | null
          color?: string | null
          estado?: string | null
          id?: number
          id_interno?: string | null
          id_persona_asignada?: number | null
          id_tipo_equipo?: number | null
          marca?: string | null
          modelo?: string | null
          patente?: string | null
          path_foto?: string | null
          tipo_propiedad?: string | null
          year?: number | null
        }
        Relationships: []
      }
      equipo_cuadrilla: {
        Row: {
          id: number
          id_cuadrilla: number | null
          id_equipo: number | null
          id_responsable: number | null
        }
        Insert: {
          id?: number
          id_cuadrilla?: number | null
          id_equipo?: number | null
          id_responsable?: number | null
        }
        Update: {
          id?: number
          id_cuadrilla?: number | null
          id_equipo?: number | null
          id_responsable?: number | null
        }
        Relationships: []
      }
      estado: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
        }
        Relationships: []
      }
      evaluacion: {
        Row: {
          comentario: string | null
          fecha: string | null
          horas_vertical: number | null
          id: number
          id_persona: number | null
          id_proyecto: number | null
          levanta_mano: string | null
          mejora: string | null
          observacion: string | null
          peticion: string | null
          promedio: number | null
          tipo: string | null
        }
        Insert: {
          comentario?: string | null
          fecha?: string | null
          horas_vertical?: number | null
          id?: number
          id_persona?: number | null
          id_proyecto?: number | null
          levanta_mano?: string | null
          mejora?: string | null
          observacion?: string | null
          peticion?: string | null
          promedio?: number | null
          tipo?: string | null
        }
        Update: {
          comentario?: string | null
          fecha?: string | null
          horas_vertical?: number | null
          id?: number
          id_persona?: number | null
          id_proyecto?: number | null
          levanta_mano?: string | null
          mejora?: string | null
          observacion?: string | null
          peticion?: string | null
          promedio?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      evaluacion_articulo: {
        Row: {
          apto: boolean | null
          comentario: string | null
          id: number
          id_articulo: number | null
          id_inspeccion: number | null
          respuesta_funcional: string | null
          respuesta_tactil: string | null
          respuesta_visual: string | null
        }
        Insert: {
          apto?: boolean | null
          comentario?: string | null
          id?: number
          id_articulo?: number | null
          id_inspeccion?: number | null
          respuesta_funcional?: string | null
          respuesta_tactil?: string | null
          respuesta_visual?: string | null
        }
        Update: {
          apto?: boolean | null
          comentario?: string | null
          id?: number
          id_articulo?: number | null
          id_inspeccion?: number | null
          respuesta_funcional?: string | null
          respuesta_tactil?: string | null
          respuesta_visual?: string | null
        }
        Relationships: []
      }
      faena: {
        Row: {
          descripcion: string | null
          empresa: string | null
          fecha_sistema: string | null
          id: number
          nombre: string | null
          usuario_sistema: string | null
        }
        Insert: {
          descripcion?: string | null
          empresa?: string | null
          fecha_sistema?: string | null
          id?: number
          nombre?: string | null
          usuario_sistema?: string | null
        }
        Update: {
          descripcion?: string | null
          empresa?: string | null
          fecha_sistema?: string | null
          id?: number
          nombre?: string | null
          usuario_sistema?: string | null
        }
        Relationships: []
      }
      faena_usuario: {
        Row: {
          id: number
          id_faena: number | null
          id_usuario: number | null
          nombre_faena: string | null
          nombre_usuario: string | null
        }
        Insert: {
          id?: number
          id_faena?: number | null
          id_usuario?: number | null
          nombre_faena?: string | null
          nombre_usuario?: string | null
        }
        Update: {
          id?: number
          id_faena?: number | null
          id_usuario?: number | null
          nombre_faena?: string | null
          nombre_usuario?: string | null
        }
        Relationships: []
      }
      faenas_cargo: {
        Row: {
          id: number
          idcargo: number | null
          idfaena: number | null
        }
        Insert: {
          id?: number
          idcargo?: number | null
          idfaena?: number | null
        }
        Update: {
          id?: number
          idcargo?: number | null
          idfaena?: number | null
        }
        Relationships: []
      }
      faenas_responsables_usuario: {
        Row: {
          id: number
          id_faena: number | null
          id_faenid_usuario: number | null
        }
        Insert: {
          id?: number
          id_faena?: number | null
          id_faenid_usuario?: number | null
        }
        Update: {
          id?: number
          id_faena?: number | null
          id_faenid_usuario?: number | null
        }
        Relationships: []
      }
      herramienta: {
        Row: {
          descripcion: string | null
          id: number
          id_estado: number | null
          nombre: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          id_estado?: number | null
          nombre?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          id_estado?: number | null
          nombre?: string | null
        }
        Relationships: []
      }
      historial_mochila_spdc: {
        Row: {
          accion: string | null
          fecha: string | null
          id: number
          id_mochila_spdc: number
          id_user: number
        }
        Insert: {
          accion?: string | null
          fecha?: string | null
          id?: number
          id_mochila_spdc: number
          id_user: number
        }
        Update: {
          accion?: string | null
          fecha?: string | null
          id?: number
          id_mochila_spdc?: number
          id_user?: number
        }
        Relationships: []
      }
      historico_tarea: {
        Row: {
          descripcion: string | null
          fecha_cierre: string | null
          fecha_creacion: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: number
          numero_orden_trabajo: string | null
          porcentaje_avance: number | null
          terminada: boolean | null
          tipo_tarea: string | null
          usuario_creacion_id: number
        }
        Insert: {
          descripcion?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: number
          numero_orden_trabajo?: string | null
          porcentaje_avance?: number | null
          terminada?: boolean | null
          tipo_tarea?: string | null
          usuario_creacion_id: number
        }
        Update: {
          descripcion?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: number
          numero_orden_trabajo?: string | null
          porcentaje_avance?: number | null
          terminada?: boolean | null
          tipo_tarea?: string | null
          usuario_creacion_id?: number
        }
        Relationships: []
      }
      hospedaje: {
        Row: {
          direccion: string | null
          fecha_ingreso: string | null
          fecha_salida: string | null
          hotel: string | null
          id: number
        }
        Insert: {
          direccion?: string | null
          fecha_ingreso?: string | null
          fecha_salida?: string | null
          hotel?: string | null
          id?: number
        }
        Update: {
          direccion?: string | null
          fecha_ingreso?: string | null
          fecha_salida?: string | null
          hotel?: string | null
          id?: number
        }
        Relationships: []
      }
      incidente_riesgos_fatalidad: {
        Row: {
          id: number
          id_reporte_flash: number | null
          id_riesgos_fatalidad: number | null
        }
        Insert: {
          id?: number
          id_reporte_flash?: number | null
          id_riesgos_fatalidad?: number | null
        }
        Update: {
          id?: number
          id_reporte_flash?: number | null
          id_riesgos_fatalidad?: number | null
        }
        Relationships: []
      }
      inspeccion_mochila: {
        Row: {
          exposicion: string | null
          fecha: string | null
          id: number
          id_entrega: number | null
          id_mochila: number | null
          mantencion: boolean | null
          observaciones: string | null
          usuario_creacion: string | null
        }
        Insert: {
          exposicion?: string | null
          fecha?: string | null
          id?: number
          id_entrega?: number | null
          id_mochila?: number | null
          mantencion?: boolean | null
          observaciones?: string | null
          usuario_creacion?: string | null
        }
        Update: {
          exposicion?: string | null
          fecha?: string | null
          id?: number
          id_entrega?: number | null
          id_mochila?: number | null
          mantencion?: boolean | null
          observaciones?: string | null
          usuario_creacion?: string | null
        }
        Relationships: []
      }
      investigador_incidente: {
        Row: {
          id: number
          id_incidente: number | null
          id_usuario: number | null
          nombre_usuario: string | null
          rol_investigacion: string | null
        }
        Insert: {
          id?: number
          id_incidente?: number | null
          id_usuario?: number | null
          nombre_usuario?: string | null
          rol_investigacion?: string | null
        }
        Update: {
          id?: number
          id_incidente?: number | null
          id_usuario?: number | null
          nombre_usuario?: string | null
          rol_investigacion?: string | null
        }
        Relationships: []
      }
      jhi_authority: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      jhi_user: {
        Row: {
          activated: boolean
          activation_key: string | null
          created_by: string
          created_date: string | null
          email: string | null
          empresa: string | null
          first_name: string | null
          id: number
          id_gesta_os: string | null
          image_url: string | null
          lang_key: string | null
          last_modified_by: string | null
          last_modified_date: string | null
          last_name: string | null
          login: string
          password_hash: string
          reset_date: string | null
          reset_key: string | null
        }
        Insert: {
          activated: boolean
          activation_key?: string | null
          created_by: string
          created_date?: string | null
          email?: string | null
          empresa?: string | null
          first_name?: string | null
          id?: number
          id_gesta_os?: string | null
          image_url?: string | null
          lang_key?: string | null
          last_modified_by?: string | null
          last_modified_date?: string | null
          last_name?: string | null
          login: string
          password_hash: string
          reset_date?: string | null
          reset_key?: string | null
        }
        Update: {
          activated?: boolean
          activation_key?: string | null
          created_by?: string
          created_date?: string | null
          email?: string | null
          empresa?: string | null
          first_name?: string | null
          id?: number
          id_gesta_os?: string | null
          image_url?: string | null
          lang_key?: string | null
          last_modified_by?: string | null
          last_modified_date?: string | null
          last_name?: string | null
          login?: string
          password_hash?: string
          reset_date?: string | null
          reset_key?: string | null
        }
        Relationships: []
      }
      jhi_user_authority: {
        Row: {
          authority_name: string
          user_id: number
        }
        Insert: {
          authority_name: string
          user_id: number
        }
        Update: {
          authority_name?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_authority_name"
            columns: ["authority_name"]
            isOneToOne: false
            referencedRelation: "jhi_authority"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "jhi_user"
            referencedColumns: ["id"]
          },
        ]
      }
      licencia_spot: {
        Row: {
          cargo: string | null
          id: number
          licencia_gesta: boolean | null
          nombre: string | null
          observaciones: string | null
          rut: string | null
          updated_at: string | null
          updated_by: string | null
          vencimiento_mel: string | null
          vencimiento_texto: string | null
        }
        Insert: {
          cargo?: string | null
          id?: number
          licencia_gesta?: boolean | null
          nombre?: string | null
          observaciones?: string | null
          rut?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vencimiento_mel?: string | null
          vencimiento_texto?: string | null
        }
        Update: {
          cargo?: string | null
          id?: number
          licencia_gesta?: boolean | null
          nombre?: string | null
          observaciones?: string | null
          rut?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vencimiento_mel?: string | null
          vencimiento_texto?: string | null
        }
        Relationships: []
      }
      mensaje: {
        Row: {
          fecha_registro: string | null
          id: number
          mensaje: string | null
          nombre: string | null
          usuario: string | null
        }
        Insert: {
          fecha_registro?: string | null
          id?: number
          mensaje?: string | null
          nombre?: string | null
          usuario?: string | null
        }
        Update: {
          fecha_registro?: string | null
          id?: number
          mensaje?: string | null
          nombre?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      mochila_articulo_spdc: {
        Row: {
          id: number
          id_articulo: number
          id_mochila_spdc: number
        }
        Insert: {
          id?: number
          id_articulo: number
          id_mochila_spdc: number
        }
        Update: {
          id?: number
          id_articulo?: number
          id_mochila_spdc?: number
        }
        Relationships: []
      }
      mochila_spdc: {
        Row: {
          fecha_creacion: string | null
          fecha_modificacion: string | null
          id: number
          id_user_creacion: number
          id_user_modificacion: number | null
          numero: string | null
        }
        Insert: {
          fecha_creacion?: string | null
          fecha_modificacion?: string | null
          id?: number
          id_user_creacion: number
          id_user_modificacion?: number | null
          numero?: string | null
        }
        Update: {
          fecha_creacion?: string | null
          fecha_modificacion?: string | null
          id?: number
          id_user_creacion?: number
          id_user_modificacion?: number | null
          numero?: string | null
        }
        Relationships: []
      }
      nota: {
        Row: {
          comentario: string | null
          evidencias: string | null
          id: number
          id_tarea: number | null
        }
        Insert: {
          comentario?: string | null
          evidencias?: string | null
          id?: number
          id_tarea?: number | null
        }
        Update: {
          comentario?: string | null
          evidencias?: string | null
          id?: number
          id_tarea?: number | null
        }
        Relationships: []
      }
      notificacion: {
        Row: {
          descripcion: string | null
          fecha: string | null
          id: number
          id_estado: number | null
        }
        Insert: {
          descripcion?: string | null
          fecha?: string | null
          id?: number
          id_estado?: number | null
        }
        Update: {
          descripcion?: string | null
          fecha?: string | null
          id?: number
          id_estado?: number | null
        }
        Relationships: []
      }
      pais: {
        Row: {
          descripcion: string | null
          id: number
          indicativo: string | null
          nombre: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          indicativo?: string | null
          nombre?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          indicativo?: string | null
          nombre?: string | null
        }
        Relationships: []
      }
      pasaje: {
        Row: {
          agencia: string | null
          desde: string | null
          fecha_llegada: string | null
          fecha_salida: string | null
          hasta: string | null
          id: number
          id_persona: number | null
          id_proyecto: number | null
          medio: string | null
          tipo: string | null
        }
        Insert: {
          agencia?: string | null
          desde?: string | null
          fecha_llegada?: string | null
          fecha_salida?: string | null
          hasta?: string | null
          id?: number
          id_persona?: number | null
          id_proyecto?: number | null
          medio?: string | null
          tipo?: string | null
        }
        Update: {
          agencia?: string | null
          desde?: string | null
          fecha_llegada?: string | null
          fecha_salida?: string | null
          hasta?: string | null
          id?: number
          id_persona?: number | null
          id_proyecto?: number | null
          medio?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      perfil: {
        Row: {
          activated: boolean
          created_at: string
          email: string
          empresa: string
          first_name: string | null
          id: string
          id_gesta_os: string | null
          last_name: string | null
          login: string
          roles: string[]
          updated_at: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          email: string
          empresa?: string
          first_name?: string | null
          id: string
          id_gesta_os?: string | null
          last_name?: string | null
          login: string
          roles?: string[]
          updated_at?: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          email?: string
          empresa?: string
          first_name?: string | null
          id?: string
          id_gesta_os?: string | null
          last_name?: string | null
          login?: string
          roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      persona: {
        Row: {
          asignacion_movilizacion: number | null
          banco: string | null
          bono: number | null
          cargo: string | null
          categoria_licencia: string | null
          comuna: string | null
          contacto_emergencia: string | null
          descripcion: string | null
          direccion: string | null
          email: string | null
          empresa: string | null
          estado_civil: string | null
          estado_persona: string | null
          fecha_creacion: string | null
          fecha_nacimiento: string | null
          foto: string | null
          genero: string | null
          gratificacion: number | null
          id: number
          id_estado: number | null
          is_coach: boolean | null
          licencia_conduccion: string | null
          movil: string | null
          nacionalidad: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          numero_cargas: string | null
          numero_cuenta: string | null
          numero_id: string | null
          pais: string | null
          plan: string | null
          porcentaje_cotizacion: string | null
          region: string | null
          retencion_judicial: string | null
          sistema_prevision: string | null
          sistema_salud: string | null
          sueldo_base: number | null
          sueldo_basico_pactado: number | null
          talla_buzo: string | null
          talla_calzado: string | null
          talla_chaleco: string | null
          talla_chaleco_geologo: string | null
          talla_pantalon: string | null
          telefono: string | null
          telefono_emergencia: string | null
          tipo_cuenta: string | null
          tipo_id: string | null
        }
        Insert: {
          asignacion_movilizacion?: number | null
          banco?: string | null
          bono?: number | null
          cargo?: string | null
          categoria_licencia?: string | null
          comuna?: string | null
          contacto_emergencia?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          empresa?: string | null
          estado_civil?: string | null
          estado_persona?: string | null
          fecha_creacion?: string | null
          fecha_nacimiento?: string | null
          foto?: string | null
          genero?: string | null
          gratificacion?: number | null
          id?: number
          id_estado?: number | null
          is_coach?: boolean | null
          licencia_conduccion?: string | null
          movil?: string | null
          nacionalidad?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          numero_cargas?: string | null
          numero_cuenta?: string | null
          numero_id?: string | null
          pais?: string | null
          plan?: string | null
          porcentaje_cotizacion?: string | null
          region?: string | null
          retencion_judicial?: string | null
          sistema_prevision?: string | null
          sistema_salud?: string | null
          sueldo_base?: number | null
          sueldo_basico_pactado?: number | null
          talla_buzo?: string | null
          talla_calzado?: string | null
          talla_chaleco?: string | null
          talla_chaleco_geologo?: string | null
          talla_pantalon?: string | null
          telefono?: string | null
          telefono_emergencia?: string | null
          tipo_cuenta?: string | null
          tipo_id?: string | null
        }
        Update: {
          asignacion_movilizacion?: number | null
          banco?: string | null
          bono?: number | null
          cargo?: string | null
          categoria_licencia?: string | null
          comuna?: string | null
          contacto_emergencia?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          empresa?: string | null
          estado_civil?: string | null
          estado_persona?: string | null
          fecha_creacion?: string | null
          fecha_nacimiento?: string | null
          foto?: string | null
          genero?: string | null
          gratificacion?: number | null
          id?: number
          id_estado?: number | null
          is_coach?: boolean | null
          licencia_conduccion?: string | null
          movil?: string | null
          nacionalidad?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          numero_cargas?: string | null
          numero_cuenta?: string | null
          numero_id?: string | null
          pais?: string | null
          plan?: string | null
          porcentaje_cotizacion?: string | null
          region?: string | null
          retencion_judicial?: string | null
          sistema_prevision?: string | null
          sistema_salud?: string | null
          sueldo_base?: number | null
          sueldo_basico_pactado?: number | null
          talla_buzo?: string | null
          talla_calzado?: string | null
          talla_chaleco?: string | null
          talla_chaleco_geologo?: string | null
          talla_pantalon?: string | null
          telefono?: string | null
          telefono_emergencia?: string | null
          tipo_cuenta?: string | null
          tipo_id?: string | null
        }
        Relationships: []
      }
      persona_asociada_empresa: {
        Row: {
          id: number
          id_empresa: number | null
          id_persona: number | null
          nombre_empresa: string | null
          nombre_persona: string | null
        }
        Insert: {
          id?: number
          id_empresa?: number | null
          id_persona?: number | null
          nombre_empresa?: string | null
          nombre_persona?: string | null
        }
        Update: {
          id?: number
          id_empresa?: number | null
          id_persona?: number | null
          nombre_empresa?: string | null
          nombre_persona?: string | null
        }
        Relationships: []
      }
      persona_cargo: {
        Row: {
          cargo: number | null
          id: number
          persona: number | null
        }
        Insert: {
          cargo?: number | null
          id?: number
          persona?: number | null
        }
        Update: {
          cargo?: number | null
          id?: number
          persona?: number | null
        }
        Relationships: []
      }
      persona_historico: {
        Row: {
          estado_anterior: string | null
          estado_nuevo: string | null
          fecha_creacion: string | null
          id: number
          id_persona: number | null
          id_proyecto: number | null
          usuario_creacion: string | null
        }
        Insert: {
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha_creacion?: string | null
          id?: number
          id_persona?: number | null
          id_proyecto?: number | null
          usuario_creacion?: string | null
        }
        Update: {
          estado_anterior?: string | null
          estado_nuevo?: string | null
          fecha_creacion?: string | null
          id?: number
          id_persona?: number | null
          id_proyecto?: number | null
          usuario_creacion?: string | null
        }
        Relationships: []
      }
      persona_proyecto: {
        Row: {
          acreditado: boolean | null
          cargo: string | null
          estado: string | null
          fecha_acreditacion: string | null
          fecha_creacion: string | null
          fecha_gestion_temprana: string | null
          gestion_temprana: boolean | null
          id: number
          id_cargo: number | null
          id_persona: number | null
          id_proyecto: number | null
          motivo: string | null
          nuevo: boolean | null
          usuario_creacion: string | null
          usuario_gestion_temprana: string | null
        }
        Insert: {
          acreditado?: boolean | null
          cargo?: string | null
          estado?: string | null
          fecha_acreditacion?: string | null
          fecha_creacion?: string | null
          fecha_gestion_temprana?: string | null
          gestion_temprana?: boolean | null
          id?: number
          id_cargo?: number | null
          id_persona?: number | null
          id_proyecto?: number | null
          motivo?: string | null
          nuevo?: boolean | null
          usuario_creacion?: string | null
          usuario_gestion_temprana?: string | null
        }
        Update: {
          acreditado?: boolean | null
          cargo?: string | null
          estado?: string | null
          fecha_acreditacion?: string | null
          fecha_creacion?: string | null
          fecha_gestion_temprana?: string | null
          gestion_temprana?: boolean | null
          id?: number
          id_cargo?: number | null
          id_persona?: number | null
          id_proyecto?: number | null
          motivo?: string | null
          nuevo?: boolean | null
          usuario_creacion?: string | null
          usuario_gestion_temprana?: string | null
        }
        Relationships: []
      }
      plan_accion: {
        Row: {
          fecha: string | null
          id: number
          nombre_responsable: string | null
          plan: string | null
          reponsable: number | null
          reporte_id: number | null
        }
        Insert: {
          fecha?: string | null
          id?: number
          nombre_responsable?: string | null
          plan?: string | null
          reponsable?: number | null
          reporte_id?: number | null
        }
        Update: {
          fecha?: string | null
          id?: number
          nombre_responsable?: string | null
          plan?: string | null
          reponsable?: number | null
          reporte_id?: number | null
        }
        Relationships: []
      }
      planeacion_investigacion: {
        Row: {
          aprendizaje: string | null
          causas: string | null
          id: number
          id_incidente: number | null
          ruta_documento_peppo: string | null
          ruta_documento_plan: string | null
          ruta_documento_tipo_investigacion: string | null
        }
        Insert: {
          aprendizaje?: string | null
          causas?: string | null
          id?: number
          id_incidente?: number | null
          ruta_documento_peppo?: string | null
          ruta_documento_plan?: string | null
          ruta_documento_tipo_investigacion?: string | null
        }
        Update: {
          aprendizaje?: string | null
          causas?: string | null
          id?: number
          id_incidente?: number | null
          ruta_documento_peppo?: string | null
          ruta_documento_plan?: string | null
          ruta_documento_tipo_investigacion?: string | null
        }
        Relationships: []
      }
      preguntas: {
        Row: {
          id: number
          pregunta: string | null
          tipo: string | null
          titulo: string | null
        }
        Insert: {
          id?: number
          pregunta?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Update: {
          id?: number
          pregunta?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      privilegios_rol: {
        Row: {
          id: number
          id_tipo_usuario: number | null
          privilegio: string | null
        }
        Insert: {
          id?: number
          id_tipo_usuario?: number | null
          privilegio?: string | null
        }
        Update: {
          id?: number
          id_tipo_usuario?: number | null
          privilegio?: string | null
        }
        Relationships: []
      }
      proyecto: {
        Row: {
          descripcion: string | null
          estado: string | null
          faena: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_sistema: string | null
          id: number
          id_faena: number | null
          nombre: string | null
          razon_social_empresa: string | null
          usuario_sistema: string | null
        }
        Insert: {
          descripcion?: string | null
          estado?: string | null
          faena?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_sistema?: string | null
          id?: number
          id_faena?: number | null
          nombre?: string | null
          razon_social_empresa?: string | null
          usuario_sistema?: string | null
        }
        Update: {
          descripcion?: string | null
          estado?: string | null
          faena?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_sistema?: string | null
          id?: number
          id_faena?: number | null
          nombre?: string | null
          razon_social_empresa?: string | null
          usuario_sistema?: string | null
        }
        Relationships: []
      }
      region: {
        Row: {
          descripcion: string | null
          id: number
          id_pais: number | null
          nombre: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          id_pais?: number | null
          nombre?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          id_pais?: number | null
          nombre?: string | null
        }
        Relationships: []
      }
      reporte_flash: {
        Row: {
          actividad_especifica: string | null
          alto_potencial: boolean | null
          analisis_desv: string | null
          clasificacion: string | null
          descripcion_evento: string | null
          empresa_cliente: string | null
          estado: string | null
          evidencia_content_type: string | null
          evidencias: string | null
          faena: string | null
          falla_control_crit: boolean | null
          fecha_cierre: string | null
          fecha_compromiso: string | null
          fecha_creacion: string | null
          fecha_incidente: string | null
          fecha_revision: string | null
          id: number
          id_control_crit: number | null
          is_riesgo_fatalidad: boolean | null
          lesion: boolean | null
          medidas_inmediatas_ejecutadas: string | null
          nombre_revisor: string | null
          nombre_supervisor: string | null
          numero_compania: string | null
          ot_asociada: string | null
          ot_critica: boolean | null
          parte_cuerpo_afectada: string | null
          potencial: string | null
          reportado_por: string | null
          responsable_reporte: string | null
          tipo_actividad: string | null
          tipo_investigacion: string | null
          tipo_stp: string | null
          usuario_creacion: string | null
        }
        Insert: {
          actividad_especifica?: string | null
          alto_potencial?: boolean | null
          analisis_desv?: string | null
          clasificacion?: string | null
          descripcion_evento?: string | null
          empresa_cliente?: string | null
          estado?: string | null
          evidencia_content_type?: string | null
          evidencias?: string | null
          faena?: string | null
          falla_control_crit?: boolean | null
          fecha_cierre?: string | null
          fecha_compromiso?: string | null
          fecha_creacion?: string | null
          fecha_incidente?: string | null
          fecha_revision?: string | null
          id?: number
          id_control_crit?: number | null
          is_riesgo_fatalidad?: boolean | null
          lesion?: boolean | null
          medidas_inmediatas_ejecutadas?: string | null
          nombre_revisor?: string | null
          nombre_supervisor?: string | null
          numero_compania?: string | null
          ot_asociada?: string | null
          ot_critica?: boolean | null
          parte_cuerpo_afectada?: string | null
          potencial?: string | null
          reportado_por?: string | null
          responsable_reporte?: string | null
          tipo_actividad?: string | null
          tipo_investigacion?: string | null
          tipo_stp?: string | null
          usuario_creacion?: string | null
        }
        Update: {
          actividad_especifica?: string | null
          alto_potencial?: boolean | null
          analisis_desv?: string | null
          clasificacion?: string | null
          descripcion_evento?: string | null
          empresa_cliente?: string | null
          estado?: string | null
          evidencia_content_type?: string | null
          evidencias?: string | null
          faena?: string | null
          falla_control_crit?: boolean | null
          fecha_cierre?: string | null
          fecha_compromiso?: string | null
          fecha_creacion?: string | null
          fecha_incidente?: string | null
          fecha_revision?: string | null
          id?: number
          id_control_crit?: number | null
          is_riesgo_fatalidad?: boolean | null
          lesion?: boolean | null
          medidas_inmediatas_ejecutadas?: string | null
          nombre_revisor?: string | null
          nombre_supervisor?: string | null
          numero_compania?: string | null
          ot_asociada?: string | null
          ot_critica?: boolean | null
          parte_cuerpo_afectada?: string | null
          potencial?: string | null
          reportado_por?: string | null
          responsable_reporte?: string | null
          tipo_actividad?: string | null
          tipo_investigacion?: string | null
          tipo_stp?: string | null
          usuario_creacion?: string | null
        }
        Relationships: []
      }
      reporte_investigacion: {
        Row: {
          anexos: string | null
          aprendizaje: string | null
          estado: string | null
          fecha_cierre: string | null
          fecha_creacion: string | null
          id: number
          personas_involucradas: string | null
          reporte_id: number | null
          usuario_cierre: string | null
        }
        Insert: {
          anexos?: string | null
          aprendizaje?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          id?: number
          personas_involucradas?: string | null
          reporte_id?: number | null
          usuario_cierre?: string | null
        }
        Update: {
          anexos?: string | null
          aprendizaje?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          id?: number
          personas_involucradas?: string | null
          reporte_id?: number | null
          usuario_cierre?: string | null
        }
        Relationships: []
      }
      respuestas: {
        Row: {
          fecha: string | null
          id: number
          id_evaluacion: number | null
          id_persona: number | null
          id_pregunta: number
          id_proyecto: number | null
          motivo: string | null
          promedio: number | null
          respuesta: string | null
        }
        Insert: {
          fecha?: string | null
          id?: number
          id_evaluacion?: number | null
          id_persona?: number | null
          id_pregunta: number
          id_proyecto?: number | null
          motivo?: string | null
          promedio?: number | null
          respuesta?: string | null
        }
        Update: {
          fecha?: string | null
          id?: number
          id_evaluacion?: number | null
          id_persona?: number | null
          id_pregunta?: number
          id_proyecto?: number | null
          motivo?: string | null
          promedio?: number | null
          respuesta?: string | null
        }
        Relationships: []
      }
      riesgos_fatalidad: {
        Row: {
          descripcion: string | null
          fecha: string | null
          id: number
        }
        Insert: {
          descripcion?: string | null
          fecha?: string | null
          id?: number
        }
        Update: {
          descripcion?: string | null
          fecha?: string | null
          id?: number
        }
        Relationships: []
      }
      ruta_foto: {
        Row: {
          id: number
          ruta: string | null
        }
        Insert: {
          id?: number
          ruta?: string | null
        }
        Update: {
          id?: number
          ruta?: string | null
        }
        Relationships: []
      }
      tarea: {
        Row: {
          descripcion: string | null
          estado: string | null
          fecha_cierre: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: number
          id_actividad: number | null
          motivo: string | null
          nombre: string | null
          notas: string | null
          numero_orden_trabajo: string | null
          porcentaje_avance: number | null
          reprogramada_por: string | null
          terminada: boolean | null
          tipo_tarea: string | null
        }
        Insert: {
          descripcion?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: number
          id_actividad?: number | null
          motivo?: string | null
          nombre?: string | null
          notas?: string | null
          numero_orden_trabajo?: string | null
          porcentaje_avance?: number | null
          reprogramada_por?: string | null
          terminada?: boolean | null
          tipo_tarea?: string | null
        }
        Update: {
          descripcion?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: number
          id_actividad?: number | null
          motivo?: string | null
          nombre?: string | null
          notas?: string | null
          numero_orden_trabajo?: string | null
          porcentaje_avance?: number | null
          reprogramada_por?: string | null
          terminada?: boolean | null
          tipo_tarea?: string | null
        }
        Relationships: []
      }
      tipo_cuadrilla: {
        Row: {
          cantidad_cuadrillas: number | null
          estado: string | null
          id: number
          id_proyecto: number | null
          jornada: string | null
          turno: string | null
        }
        Insert: {
          cantidad_cuadrillas?: number | null
          estado?: string | null
          id?: number
          id_proyecto?: number | null
          jornada?: string | null
          turno?: string | null
        }
        Update: {
          cantidad_cuadrillas?: number | null
          estado?: string | null
          id?: number
          id_proyecto?: number | null
          jornada?: string | null
          turno?: string | null
        }
        Relationships: []
      }
      tipo_equipo: {
        Row: {
          id: number
          nombre: string | null
          tipo: string | null
        }
        Insert: {
          id?: number
          nombre?: string | null
          tipo?: string | null
        }
        Update: {
          id?: number
          nombre?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      tipo_equipo_tipo_cuadrilla: {
        Row: {
          cantidad_equipos: number | null
          id: number
          id_tipo_cuadrilla: number | null
          id_tipo_equipo: number | null
        }
        Insert: {
          cantidad_equipos?: number | null
          id?: number
          id_tipo_cuadrilla?: number | null
          id_tipo_equipo?: number | null
        }
        Update: {
          cantidad_equipos?: number | null
          id?: number
          id_tipo_cuadrilla?: number | null
          id_tipo_equipo?: number | null
        }
        Relationships: []
      }
      tipo_identificacion: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
        }
        Relationships: []
      }
      tipo_usuario: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string | null
        }
        Relationships: []
      }
      trabajador_citacion: {
        Row: {
          id: number
          id_citacion: number | null
          id_persona: number | null
          id_proyecto: number | null
        }
        Insert: {
          id?: number
          id_citacion?: number | null
          id_persona?: number | null
          id_proyecto?: number | null
        }
        Update: {
          id?: number
          id_citacion?: number | null
          id_persona?: number | null
          id_proyecto?: number | null
        }
        Relationships: []
      }
      trabajador_cuadrilla: {
        Row: {
          id: number
          id_cargo: number | null
          id_cuadrilla: number | null
          id_trabajador: number | null
        }
        Insert: {
          id?: number
          id_cargo?: number | null
          id_cuadrilla?: number | null
          id_trabajador?: number | null
        }
        Update: {
          id?: number
          id_cargo?: number | null
          id_cuadrilla?: number | null
          id_trabajador?: number | null
        }
        Relationships: []
      }
      trabajador_despacho: {
        Row: {
          id: number
          id_despacho: number | null
          id_persona: number
        }
        Insert: {
          id?: number
          id_despacho?: number | null
          id_persona: number
        }
        Update: {
          id?: number
          id_despacho?: number | null
          id_persona?: number
        }
        Relationships: []
      }
      trabajador_hospedaje: {
        Row: {
          id: number
          id_hospedaje: number | null
          id_persona: number
          id_proyecto: number | null
        }
        Insert: {
          id?: number
          id_hospedaje?: number | null
          id_persona: number
          id_proyecto?: number | null
        }
        Update: {
          id?: number
          id_hospedaje?: number | null
          id_persona?: number
          id_proyecto?: number | null
        }
        Relationships: []
      }
      trabajador_turno: {
        Row: {
          id: number
          id_persona: number
          id_proyecto: number | null
          id_turno: number | null
        }
        Insert: {
          id?: number
          id_persona: number
          id_proyecto?: number | null
          id_turno?: number | null
        }
        Update: {
          id?: number
          id_persona?: number
          id_proyecto?: number | null
          id_turno?: number | null
        }
        Relationships: []
      }
      trazabilidad: {
        Row: {
          fecha_registro: string | null
          id: number
          jsoon: string | null
          mensaje: string | null
          metodo: string | null
          usuario: string | null
        }
        Insert: {
          fecha_registro?: string | null
          id?: number
          jsoon?: string | null
          mensaje?: string | null
          metodo?: string | null
          usuario?: string | null
        }
        Update: {
          fecha_registro?: string | null
          id?: number
          jsoon?: string | null
          mensaje?: string | null
          metodo?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      turno: {
        Row: {
          id: number
          tipo: string | null
        }
        Insert: {
          id?: number
          tipo?: string | null
        }
        Update: {
          id?: number
          tipo?: string | null
        }
        Relationships: []
      }
      usuario_tarea: {
        Row: {
          id: number
          id_tarea: number | null
          id_usuario: number | null
        }
        Insert: {
          id?: number
          id_tarea?: number | null
          id_usuario?: number | null
        }
        Update: {
          id?: number
          id_tarea?: number | null
          id_usuario?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acreditar_trabajador: {
        Args: { p_id_persona: number; p_id_proyecto: number }
        Returns: undefined
      }
      asociar_persona_proyecto: {
        Args: {
          p_cargo: string
          p_id_cargo: number
          p_id_persona: number
          p_id_proyecto: number
          p_usuario: string
        }
        Returns: undefined
      }
      asociar_personas_proyecto_masivo: {
        Args: { p_filas: Json; p_id_proyecto: number; p_usuario: string }
        Returns: {
          detalle: string
          id_persona: number
          nombre_persona: string
          resultado: string
          rut: string
        }[]
      }
      auth_empresa: { Args: never; Returns: string }
      backup_asociado: {
        Args: { p_id_persona: number; p_id_proyecto: number; p_motivo: string }
        Returns: undefined
      }
      cambiar_cargo_asociado: {
        Args: {
          p_cargo: string
          p_id_cargo: number
          p_id_persona: number
          p_id_proyecto: number
        }
        Returns: undefined
      }
      cambiar_estado_asociado: {
        Args: {
          p_estado: string
          p_estado_filtro: string
          p_id_persona: number
          p_id_proyecto: number
        }
        Returns: string
      }
      cargos_listado: {
        Args: { p_nombre?: string }
        Returns: {
          descripcion: string
          documentos: string
          faenas: string
          id: number
          nombre: string
        }[]
      }
      cargos_proyecto_guardar: {
        Args: { p_cargos: Json; p_id: number }
        Returns: undefined
      }
      cargos_proyecto_listar: {
        Args: { p_id: number }
        Returns: {
          cantidad: number
          cantidad_noche: number
          id: number
          id_cargo: number
          nombre_cargo: string
          turnos_efectivos: number
        }[]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      despacho_eliminar: { Args: { p_id: number }; Returns: undefined }
      despacho_eliminar_accion: {
        Args: { p_id_accion: number }
        Returns: undefined
      }
      despacho_eliminar_trabajador: {
        Args: { p_id_trabajador_despacho: number }
        Returns: undefined
      }
      despacho_finalizar: { Args: { p_id: number }; Returns: undefined }
      despacho_registrar_accion: {
        Args: {
          p_accion: string
          p_aprobado: boolean
          p_comentario: string
          p_id_trabajador_despacho: number
          p_pendiente: boolean
          p_usuario: string
        }
        Returns: undefined
      }
      despacho_toggle_estado: {
        Args: {
          p_accion: string
          p_confirmado: boolean
          p_id_trabajador_despacho: number
          p_marcar: boolean
        }
        Returns: undefined
      }
      despachos_listado: {
        Args: {
          p_estado?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_id_faena?: number
          p_id_proyecto?: number
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          acreditados: number
          asistencia: number
          bodega: number
          cumplimiento: number
          cursos: number
          despachados: number
          estado: string
          faena: string
          fecha_despacho: string
          id: number
          nombre_despacho: string
          proyecto_nombre: string
          sso: number
          total: number
          total_personas: number
          transporte: number
        }[]
      }
      documento_persona_eliminar: { Args: { p_id: number }; Returns: undefined }
      documento_persona_guardar_fecha: {
        Args: { p_fecha: string; p_id: number }
        Returns: undefined
      }
      documento_persona_guardar_resultado: {
        Args: { p_id: number; p_valor: string }
        Returns: undefined
      }
      documentos_persona_limpiar_huerfanos: { Args: never; Returns: undefined }
      eliminar_asociado: {
        Args: { p_id_persona: number; p_id_proyecto: number; p_motivo: string }
        Returns: undefined
      }
      entregas_listado: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_id?: number
          p_id_faena?: number
          p_id_proyecto?: number
          p_limit?: number
          p_nombre?: string
          p_offset?: number
          p_rut?: string
          p_usuario_entrega?: string
        }
        Returns: {
          faena: string
          fecha_creacion: string
          id: number
          servicio: string
          total: number
          trabajador: string
          usuario_entrega: string
        }[]
      }
      es_alta: { Args: never; Returns: boolean }
      es_gesta: { Args: never; Returns: boolean }
      evaluacion_eliminar: { Args: { p_id: number }; Returns: undefined }
      evaluacion_existente: {
        Args: { p_id_persona: number; p_id_proyecto: number; p_tipo: string }
        Returns: Json
      }
      evaluacion_guardar: {
        Args: {
          p_comentario: string
          p_horas_vertical: number
          p_id: number
          p_id_persona: number
          p_id_proyecto: number
          p_levanta_mano: string
          p_mejora: string
          p_observacion: string
          p_peticion: string
          p_respuestas: Json
          p_tipo: string
        }
        Returns: number
      }
      evaluaciones_persona: {
        Args: { p_id_persona: number; p_tipo: string }
        Returns: Json
      }
      evaluaciones_proyecto: {
        Args: { p_id_proyecto: number; p_tipo: string }
        Returns: Json
      }
      faenas_listado: {
        Args: { p_nombre?: string }
        Returns: {
          descripcion: string
          empresa: string
          id: number
          nombre: string
          usuarios: string
        }[]
      }
      gestion_temprana_toggle: {
        Args: { p_id_persona: number; p_id_proyecto: number; p_usuario: string }
        Returns: boolean
      }
      has_role: { Args: { r: string }; Returns: boolean }
      inspecciones_mochila: {
        Args: { p_id_mochila: number }
        Returns: {
          fecha: string
          id: number
          mantencion: boolean
          servicio: string
          trabajador: string
          usuario_creacion: string
        }[]
      }
      licencia_rut_normalizar: { Args: { p_rut: string }; Returns: string }
      licencia_spot_eliminar: { Args: { p_id: number }; Returns: undefined }
      licencia_spot_guardar: {
        Args: {
          p_cargo: string
          p_id: number
          p_licencia_gesta: boolean
          p_nombre: string
          p_observaciones: string
          p_rut: string
          p_usuario: string
          p_vencimiento_mel: string
          p_vencimiento_texto: string
        }
        Returns: number
      }
      licencia_spot_puede_editar: { Args: never; Returns: boolean }
      licencias_spot_buscar_personas: {
        Args: { p_q: string }
        Returns: {
          nombre: string
          rut: string
        }[]
      }
      licencias_spot_listar: {
        Args: never
        Returns: {
          cargo: string
          ciudad: string
          dias_restantes: number
          estado_mel: string
          id: number
          licencia_gesta: boolean
          nombre: string
          observaciones: string
          puede_conducir: boolean
          rut: string
          updated_at: string
          updated_by: string
          vencimiento_mel: string
          vencimiento_texto: string
        }[]
      }
      mochilas_listado: {
        Args: never
        Returns: {
          fecha_creacion: string
          id: number
          numero: string
          usuario: string
        }[]
      }
      notificaciones_documentos: {
        Args: never
        Returns: {
          por_vencer: number
          vencidos: number
        }[]
      }
      oficializar_nomina: {
        Args: { p_id_proyecto: number; p_ids_persona: number[] }
        Returns: string
      }
      persona_cambiar_estado: {
        Args: { p_estado: string; p_id: number; p_usuario: string }
        Returns: undefined
      }
      persona_comunas: {
        Args: never
        Returns: {
          comuna: string
        }[]
      }
      persona_documentos: {
        Args: { p_categoria: string; p_id: number; p_solo_publicos: boolean }
        Returns: {
          fecha_vencimiento: string
          id: number
          nombre_documento: string
          tipo_documento: string
          tipo_resultado: string
          valor_resultado: string
          vencido: boolean
        }[]
      }
      persona_documentos_requeridos: {
        Args: {
          p_categoria: string
          p_ids_cargo: number[]
          p_solo_publicos: boolean
        }
        Returns: {
          id: number
          id_cargo: number
          nombre: string
          requerido: boolean
        }[]
      }
      persona_eliminar: { Args: { p_id: number }; Returns: undefined }
      persona_en_despacho: {
        Args: { p_id_persona: number; p_id_proyecto: number }
        Returns: boolean
      }
      persona_guardar_bloqueo: {
        Args: {
          p_descripcion: string
          p_estado_bloqueo: string
          p_id: number
          p_motivo: string
          p_usuario: string
        }
        Returns: undefined
      }
      persona_servicios: {
        Args: { p_id: number }
        Returns: {
          acreditado: boolean
          actual: boolean
          estado: string
          faena: string
          fecha_creacion: string
          id_proyecto: number
          nombre_cargo: string
          nombre_servicio: string
          nuevo: boolean
        }[]
      }
      persona_verificar_documentos: {
        Args: { p_id: number; p_ids_cargo: number[] }
        Returns: {
          documento: string
        }[]
      }
      persona_visible: { Args: { pid: number }; Returns: boolean }
      personas_listado: {
        Args: {
          p_comuna?: string
          p_empresa?: string
          p_estado?: string
          p_id_cargo?: number
          p_id_faena?: number
          p_limit?: number
          p_nombre?: string
          p_offset?: number
          p_rut?: string
        }
        Returns: {
          cargos: string
          comuna: string
          estado_persona: string
          id: number
          nombre_completo: string
          num_id: string
          servicio: string
          telefono: string
          total: number
        }[]
      }
      preguntas_por_tipo: {
        Args: { p_tipo: string }
        Returns: {
          id: number
          pregunta: string
          tipo: string
          titulo: string
        }[]
      }
      proyecto_activar: { Args: { p_id: number }; Returns: undefined }
      proyecto_eliminar: { Args: { p_id: number }; Returns: undefined }
      proyecto_evaluaciones_pendientes: {
        Args: { p_id: number }
        Returns: number
      }
      proyecto_finalizar: { Args: { p_id: number }; Returns: undefined }
      proyecto_visible: { Args: { pid: number }; Returns: boolean }
      puede_editar_estados_personal: { Args: never; Returns: boolean }
      puede_gestionar_accion: { Args: { p_accion: string }; Returns: boolean }
      reasociar_persona: {
        Args: { p_id_persona: number; p_id_proyecto: number; p_motivo: string }
        Returns: undefined
      }
      tiene_rol_despacho: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
