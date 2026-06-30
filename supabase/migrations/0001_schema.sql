-- =============================================================================
-- 0001_schema.sql  —  Esquema real de docnomina (prod 'diplanner'/docnomina)
-- =============================================================================
-- Origen: pg_dump (PostgreSQL 13.10) del backup DocDb30-06.sql, extraído con
-- pg_restore --schema-only --no-owner --no-privileges, limpiado de comandos psql.
-- 85 tablas de negocio. Artefactos JHipster descartados al final (§7.2):
--   databasechangelog* (Liquibase) y jhi_persistent_token (Supabase Auth los
--   reemplaza). Se CONSERVAN jhi_user/jhi_authority/jhi_user_authority para la
--   migración de usuarios -> perfil (luego se podrán dropear).
-- =============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 13.10
-- Dumped by pg_dump version 13.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accion_despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accion_despacho (
    id bigint NOT NULL,
    id_trabajador_despacho bigint,
    comentario character varying,
    fecha timestamp without time zone,
    aprobado boolean,
    accion character varying,
    usuario_creacion character varying,
    usuario_modificacion character varying,
    fecha_modificacion timestamp without time zone,
    pendiente boolean
);


--
-- Name: accion_incidente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accion_incidente (
    id bigint NOT NULL,
    id_reporte_flash bigint,
    ubicacion_documento character varying,
    descripcion character varying
);


--
-- Name: actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actividad (
    id bigint NOT NULL,
    id_proyecto bigint,
    nombre character varying(255),
    descripcion character varying(255),
    usuario_sistema character varying(255),
    fecha_sistema timestamp without time zone
);


--
-- Name: alerta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerta (
    id bigint NOT NULL,
    comentario character varying(255),
    evidencias character varying(255),
    tipo_alerta character varying(255),
    id_tarea bigint
);


--
-- Name: articulo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulo (
    id bigint NOT NULL,
    descripcion character varying,
    marca character varying,
    opcional boolean,
    identificador boolean,
    clasificacion character varying,
    talla character varying,
    color character varying,
    tipo character varying,
    modelo character varying(255),
    fecha_fabricacion timestamp without time zone,
    fecha_expiracion timestamp without time zone
);


--
-- Name: articulo_cargo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulo_cargo (
    id bigint NOT NULL,
    id_articulo bigint,
    id_cargo bigint
);


--
-- Name: aviso_mantenimiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aviso_mantenimiento (
    id bigint NOT NULL,
    titulo character varying(200),
    mensaje character varying(1000),
    fecha_inicio timestamp without time zone,
    duracion_minutos integer,
    anticipacion_minutos integer,
    activo boolean,
    created_by character varying(50) NOT NULL,
    created_date timestamp without time zone,
    last_modified_by character varying(50),
    last_modified_date timestamp without time zone
);


--
-- Name: bloqueo_persona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bloqueo_persona (
    id bigint NOT NULL,
    id_persona bigint,
    fecha_bloqueo timestamp without time zone,
    motivo_bloqueo character varying(255),
    descripcio_bloqueo character varying(255),
    usuario character varying(255),
    estado character varying(255)
);


--
-- Name: cargo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cargo (
    id bigint NOT NULL,
    nombre character varying(255),
    descripcion character varying(255),
    tipo_cargo character varying,
    valor_turno bigint
);


--
-- Name: cargo_tipo_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cargo_tipo_cuadrilla (
    id bigint NOT NULL,
    id_tipo_cuadrilla bigint,
    id_cargo bigint,
    cantidad_personal integer
);


--
-- Name: cargos_solicitados_proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cargos_solicitados_proyectos (
    id bigint NOT NULL,
    id_proyecto bigint,
    id_cargo bigint,
    cantidad bigint,
    nombre_cargo character varying,
    cantidad_noche bigint,
    turnos_efectivos bigint
);


--
-- Name: categoria_cargo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria_cargo (
    id bigint NOT NULL,
    nombre_categoria character varying(255),
    descripcion character varying(255),
    empresa_cliente bigint
);


--
-- Name: citacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citacion (
    id bigint NOT NULL,
    fecha_citacion timestamp without time zone
);


--
-- Name: comuna; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comuna (
    id bigint NOT NULL,
    nombre character varying(60),
    descripcion character varying(50),
    id_region bigint,
    codigo_unico_territorial bigint
);


--
-- Name: controles_criticos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.controles_criticos (
    id bigint NOT NULL,
    descripcion character varying(255),
    riesgo_fatalidad_asociado character varying(255),
    fecha timestamp without time zone
);


--
-- Name: cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuadrilla (
    id bigint NOT NULL,
    numero bigint,
    nombre character varying,
    id_tipo_cuadrilla bigint,
    id_responsable bigint,
    estado character varying
);


--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


--
-- Name: despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.despacho (
    id bigint NOT NULL,
    id_proyecto bigint NOT NULL,
    nombre_despacho character varying,
    estado character varying,
    fecha_despacho timestamp without time zone
);


--
-- Name: detalle_entrega_epp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_entrega_epp (
    id bigint NOT NULL,
    id_entrega bigint,
    id_articulo bigint,
    entregado boolean,
    interno boolean,
    cantidad integer,
    talla character varying,
    color character varying,
    tipo character varying,
    identificador character varying(255),
    marca character varying(255),
    id_detalle_mantenido bigint,
    modelo character varying
);


--
-- Name: documento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documento (
    id bigint NOT NULL,
    nombre character varying(255),
    descripcion character varying(255),
    empresa character varying(200),
    requerido boolean,
    todas boolean,
    privado boolean,
    categoria_documento character varying(255),
    resultado boolean,
    tipo_resultado character varying
);


--
-- Name: documento_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documento_cuadrilla (
    id bigint NOT NULL,
    id_cuadrilla bigint,
    id_documento bigint,
    ruta character varying
);


--
-- Name: documento_reporte_flash; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documento_reporte_flash (
    id bigint NOT NULL,
    id_reporte_flash bigint,
    nombre character varying,
    ubicacion character varying
);


--
-- Name: documento_tipo_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documento_tipo_cuadrilla (
    id bigint NOT NULL,
    id_tipo_cuadrilla bigint,
    id_documento bigint,
    cantidad_documentos integer
);


--
-- Name: documentos_cargo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_cargo (
    id bigint NOT NULL,
    id_cargo bigint,
    nombre character varying(255),
    requerido boolean,
    privado boolean,
    categoria_documento character varying(255)
);


--
-- Name: documentos_persona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_persona (
    id bigint NOT NULL,
    id_persona bigint,
    nombre_documento character varying(255),
    documento character varying(255),
    vencido boolean,
    fecha_vencimiento timestamp without time zone,
    semaforo character varying,
    tipo_documento character varying(255),
    valor_resultado character varying
);


--
-- Name: empresa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa (
    id bigint NOT NULL,
    razon_social character varying(60),
    nit character varying(50),
    direccion character varying(255),
    descripcion character varying(255),
    telefono character varying(255),
    estado character varying(255),
    id_ciudad bigint,
    persona_contacto character varying(255),
    telefono_contacto character varying(255),
    logo_uri_color character varying,
    logo_uri_blanco character varying
);


--
-- Name: empresa_cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa_cliente (
    id bigint NOT NULL,
    razon_social character varying(255),
    nit character varying(255),
    direccion character varying(255),
    descripcion character varying(255),
    telefono character varying(255),
    estado character varying(255),
    id_ciudad bigint,
    persona_contacto character varying(255),
    telefono_contacto character varying(255)
);


--
-- Name: entrega_epp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entrega_epp (
    id bigint NOT NULL,
    fecha_creacion timestamp without time zone,
    usuario_entrega character varying,
    id_persona bigint,
    id_proyecto bigint,
    id_faena bigint,
    id_cargo bigint,
    path_firma character varying,
    razon_social_empresa character varying,
    id_mochila_spdc bigint,
    comentarios character varying
);


--
-- Name: equipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipo (
    id bigint NOT NULL,
    id_interno character varying(255),
    path_foto character varying(255),
    id_tipo_equipo bigint,
    marca character varying(255),
    color character varying(255),
    year integer,
    modelo character varying(255),
    patente character varying(255),
    tipo_propiedad character varying(255),
    asignado boolean,
    id_persona_asignada bigint,
    estado character varying(255)
);


--
-- Name: equipo_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipo_cuadrilla (
    id bigint NOT NULL,
    id_cuadrilla bigint,
    id_equipo bigint,
    id_responsable bigint
);


--
-- Name: estado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estado (
    id bigint NOT NULL,
    nombre character varying(255),
    descripcion character varying(255)
);


--
-- Name: evaluacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluacion (
    id bigint NOT NULL,
    id_persona bigint,
    id_proyecto bigint,
    fecha timestamp without time zone,
    promedio numeric(2,1),
    tipo character varying,
    observacion character varying,
    levanta_mano character varying,
    mejora character varying,
    peticion character varying,
    horas_vertical integer,
    comentario character varying
);


--
-- Name: evaluacion_articulo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluacion_articulo (
    id bigint NOT NULL,
    id_inspeccion bigint,
    id_articulo bigint,
    respuesta_visual character varying,
    respuesta_tactil character varying,
    respuesta_funcional character varying,
    apto boolean,
    comentario character varying
);


--
-- Name: faena; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faena (
    id bigint NOT NULL,
    nombre character varying(255),
    descripcion character varying(255),
    empresa character varying(255),
    usuario_sistema character varying(255),
    fecha_sistema timestamp without time zone
);


--
-- Name: faena_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faena_usuario (
    id bigint NOT NULL,
    nombre_usuario character varying(255),
    nombre_faena character varying(255),
    id_usuario bigint,
    id_faena bigint
);


--
-- Name: faenas_cargo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faenas_cargo (
    id bigint NOT NULL,
    idcargo bigint,
    idfaena bigint
);


--
-- Name: faenas_responsables_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faenas_responsables_usuario (
    id bigint NOT NULL,
    id_faena bigint,
    id_faenid_usuario bigint
);


--
-- Name: herramienta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.herramienta (
    id bigint NOT NULL,
    nombre character varying(255),
    id_estado bigint,
    descripcion character varying(255)
);


--
-- Name: historial_mochila_spdc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_mochila_spdc (
    id bigint NOT NULL,
    id_mochila_spdc bigint NOT NULL,
    id_user bigint NOT NULL,
    fecha timestamp without time zone,
    accion character varying
);


--
-- Name: historico_tarea; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_tarea (
    id bigint NOT NULL,
    numero_orden_trabajo character varying(255),
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    fecha_cierre timestamp without time zone,
    descripcion character varying(255),
    porcentaje_avance integer,
    terminada boolean,
    tipo_tarea character varying(255),
    fecha_creacion timestamp without time zone,
    usuario_creacion_id bigint NOT NULL
);


--
-- Name: hospedaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hospedaje (
    id bigint NOT NULL,
    hotel character varying,
    direccion character varying,
    fecha_ingreso timestamp without time zone,
    fecha_salida timestamp without time zone
);


--
-- Name: incidente_riesgos_fatalidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidente_riesgos_fatalidad (
    id bigint NOT NULL,
    id_reporte_flash bigint,
    id_riesgos_fatalidad bigint
);


--
-- Name: inspeccion_mochila; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inspeccion_mochila (
    id bigint NOT NULL,
    id_mochila bigint,
    mantencion boolean,
    id_entrega bigint,
    exposicion character varying,
    fecha timestamp without time zone,
    observaciones character varying,
    usuario_creacion character varying
);


--
-- Name: investigador_incidente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investigador_incidente (
    id bigint NOT NULL,
    id_usuario bigint,
    id_incidente bigint,
    rol_investigacion character varying(255),
    nombre_usuario character varying
);


--
-- Name: jhi_authority; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jhi_authority (
    name character varying(50) NOT NULL
);


--
-- Name: jhi_persistent_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jhi_persistent_token (
    series character varying(20) NOT NULL,
    user_id bigint,
    token_value character varying(20) NOT NULL,
    token_date date,
    ip_address character varying(39),
    user_agent character varying(255)
);


--
-- Name: jhi_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jhi_user (
    id bigint NOT NULL,
    login character varying(50) NOT NULL,
    password_hash character varying(60) NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(191),
    image_url character varying(256),
    activated boolean NOT NULL,
    lang_key character varying(10),
    activation_key character varying(20),
    reset_key character varying(20),
    created_by character varying(50) NOT NULL,
    created_date timestamp without time zone,
    reset_date timestamp without time zone,
    last_modified_by character varying(50),
    last_modified_date timestamp without time zone,
    empresa character varying(200),
    id_gesta_os character varying(36)
);


--
-- Name: jhi_user_authority; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jhi_user_authority (
    user_id bigint NOT NULL,
    authority_name character varying(50) NOT NULL
);


--
-- Name: mensaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensaje (
    id bigint NOT NULL,
    nombre character varying(255),
    fecha_registro timestamp without time zone,
    mensaje character varying(255),
    usuario character varying(255)
);


--
-- Name: mochila_articulo_spdc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mochila_articulo_spdc (
    id bigint NOT NULL,
    id_articulo bigint NOT NULL,
    id_mochila_spdc bigint NOT NULL
);


--
-- Name: mochila_spdc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mochila_spdc (
    id bigint NOT NULL,
    numero character varying,
    id_user_creacion bigint NOT NULL,
    id_user_modificacion bigint,
    fecha_creacion timestamp without time zone,
    fecha_modificacion timestamp without time zone
);


--
-- Name: nota; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nota (
    id bigint NOT NULL,
    comentario character varying(255),
    evidencias character varying(255),
    id_tarea bigint
);


--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacion (
    id bigint NOT NULL,
    descripcion character varying(255),
    fecha timestamp without time zone,
    id_estado bigint
);


--
-- Name: pais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pais (
    id bigint NOT NULL,
    nombre character varying(60),
    descripcion character varying(50),
    indicativo character varying(50)
);


--
-- Name: pasaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pasaje (
    id bigint NOT NULL,
    tipo character varying,
    medio character varying,
    agencia character varying,
    desde character varying,
    hasta character varying,
    fecha_salida timestamp without time zone,
    fecha_llegada timestamp without time zone,
    id_persona bigint,
    id_proyecto bigint
);


--
-- Name: persona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona (
    id bigint NOT NULL,
    nombre_completo character varying(255),
    tipo_id character varying(255),
    numero_id character varying(255),
    email character varying(255),
    telefono character varying(255),
    direccion character varying(255),
    id_estado bigint,
    descripcion character varying(255),
    nombre_usuario character varying(255),
    empresa character varying(255),
    cargo character varying(255),
    foto character varying,
    retencion_judicial character varying(255),
    numero_cargas character varying(255),
    sueldo_base double precision,
    gratificacion double precision,
    bono double precision,
    asignacion_movilizacion double precision,
    sueldo_basico_pactado double precision,
    fecha_creacion timestamp without time zone,
    movil character varying(255),
    telefono_emergencia character varying(255),
    nacionalidad character varying(255),
    genero character varying(255),
    estado_civil character varying(255),
    licencia_conduccion character varying(255),
    pais character varying(255),
    region character varying(255),
    comuna character varying(255),
    sistema_prevision character varying(255),
    sistema_salud character varying(255),
    talla_pantalon character varying(255),
    talla_chaleco character varying(255),
    talla_buzo character varying(255),
    talla_calzado character varying(255),
    talla_chaleco_geologo character varying(255),
    banco character varying(255),
    tipo_cuenta character varying(255),
    numero_cuenta character varying(255),
    plan character varying(255),
    porcentaje_cotizacion character varying(255),
    contacto_emergencia character varying(255),
    categoria_licencia character varying(255),
    estado_persona character varying(255),
    fecha_nacimiento timestamp without time zone,
    is_coach boolean
);


--
-- Name: persona_asociada_empresa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona_asociada_empresa (
    id bigint NOT NULL,
    id_persona bigint,
    nombre_persona character varying(255),
    id_empresa bigint,
    nombre_empresa character varying(255)
);


--
-- Name: persona_cargo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona_cargo (
    id bigint NOT NULL,
    cargo bigint,
    persona bigint
);


--
-- Name: persona_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona_historico (
    id bigint NOT NULL,
    id_persona bigint,
    estado_anterior character varying(255),
    estado_nuevo character varying(255),
    fecha_creacion timestamp without time zone,
    id_proyecto bigint,
    usuario_creacion character varying(255)
);


--
-- Name: persona_proyecto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona_proyecto (
    id bigint NOT NULL,
    id_proyecto bigint,
    id_persona bigint,
    estado character varying(255),
    fecha_creacion timestamp without time zone,
    usuario_creacion character varying(255),
    cargo character varying(255),
    motivo character varying,
    acreditado boolean,
    fecha_acreditacion time without time zone,
    id_cargo bigint,
    nuevo boolean,
    gestion_temprana boolean,
    usuario_gestion_temprana character varying,
    fecha_gestion_temprana timestamp without time zone
);


--
-- Name: plan_accion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_accion (
    id bigint NOT NULL,
    reponsable bigint,
    nombre_responsable character varying,
    plan character varying(255),
    fecha timestamp without time zone,
    reporte_id bigint
);


--
-- Name: planeacion_investigacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planeacion_investigacion (
    id bigint NOT NULL,
    id_incidente bigint,
    causas character varying(255),
    aprendizaje character varying(255),
    ruta_documento_plan character varying(255),
    ruta_documento_peppo character varying(255),
    ruta_documento_tipo_investigacion character varying(255)
);


--
-- Name: preguntas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preguntas (
    id bigint NOT NULL,
    pregunta character varying,
    tipo character varying,
    titulo character varying
);


--
-- Name: privilegios_rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.privilegios_rol (
    id bigint NOT NULL,
    id_tipo_usuario bigint,
    privilegio character varying(255)
);


--
-- Name: proyecto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proyecto (
    id bigint NOT NULL,
    nombre character varying(255),
    descripcion character varying(255),
    estado character varying(255),
    faena character varying(255),
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    usuario_sistema character varying(255),
    fecha_sistema timestamp without time zone,
    id_faena bigint,
    razon_social_empresa character varying(255)
);


--
-- Name: region; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.region (
    id bigint NOT NULL,
    nombre character varying(60),
    descripcion character varying(50),
    id_pais bigint
);


--
-- Name: reporte_flash; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reporte_flash (
    id bigint NOT NULL,
    fecha_creacion timestamp without time zone,
    usuario_creacion character varying(255),
    fecha_incidente timestamp without time zone,
    numero_compania character varying(255),
    ot_asociada character varying(255),
    ot_critica boolean,
    clasificacion character varying(255),
    is_riesgo_fatalidad boolean,
    falla_control_crit boolean,
    alto_potencial boolean,
    lesion boolean,
    tipo_stp character varying(255),
    parte_cuerpo_afectada character varying(255),
    potencial character varying(255),
    reportado_por character varying(255),
    nombre_supervisor character varying(255),
    nombre_revisor character varying(255),
    empresa_cliente character varying(255),
    faena character varying(255),
    tipo_actividad character varying(255),
    actividad_especifica character varying(255),
    descripcion_evento character varying(255),
    id_control_crit bigint,
    analisis_desv character varying(255),
    medidas_inmediatas_ejecutadas character varying(255),
    evidencias bytea,
    responsable_reporte character varying(255),
    estado character varying(255),
    fecha_compromiso timestamp without time zone,
    evidencia_content_type character varying(255),
    tipo_investigacion character varying,
    fecha_cierre timestamp without time zone,
    fecha_revision timestamp without time zone
);


--
-- Name: respuestas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.respuestas (
    id bigint NOT NULL,
    respuesta character varying(255),
    id_persona bigint,
    id_pregunta bigint NOT NULL,
    id_proyecto bigint,
    fecha timestamp without time zone,
    motivo character varying,
    promedio numeric,
    id_evaluacion bigint
);


--
-- Name: riesgos_fatalidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.riesgos_fatalidad (
    id bigint NOT NULL,
    descripcion character varying(255),
    fecha timestamp without time zone
);


--
-- Name: ruta_foto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ruta_foto (
    id bigint NOT NULL,
    ruta character varying
);


--
-- Name: sequence_generator; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator
    START WITH 50
    INCREMENT BY 50
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator10; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator10
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator11; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator11
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator12; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator12
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator13; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator13
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator14; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator14
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator15; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator15
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator16; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator16
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator17; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator17
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator18; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator18
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator19; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator19
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator2; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator2
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator20; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator20
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator21; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator21
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator22; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator22
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator23; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator23
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator24; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator24
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator3; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator3
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator4; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator4
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator5; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator5
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator6; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator6
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator7; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator7
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator8; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator8
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sequence_generator9; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sequence_generator9
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tarea; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarea (
    id bigint NOT NULL,
    numero_orden_trabajo character varying(255),
    estado character varying(255),
    motivo character varying(255),
    reprogramada_por character varying(255),
    notas character varying(255),
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    fecha_cierre timestamp without time zone,
    descripcion character varying(255),
    nombre character varying(255),
    porcentaje_avance integer,
    terminada boolean,
    tipo_tarea character varying(255),
    id_actividad bigint
);


--
-- Name: tipo_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_cuadrilla (
    id bigint NOT NULL,
    id_proyecto bigint,
    turno character varying(255),
    jornada character varying(255),
    cantidad_cuadrillas integer,
    estado character varying(255)
);


--
-- Name: tipo_cuadrilla_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipo_cuadrilla_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_cuadrilla_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipo_cuadrilla_seq OWNED BY public.tipo_cuadrilla.id;


--
-- Name: tipo_equipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_equipo (
    id bigint NOT NULL,
    nombre character varying,
    tipo character varying
);


--
-- Name: tipo_equipo_tipo_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_equipo_tipo_cuadrilla (
    id bigint NOT NULL,
    id_tipo_cuadrilla bigint,
    id_tipo_equipo bigint,
    cantidad_equipos integer
);


--
-- Name: tipo_identificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_identificacion (
    id bigint NOT NULL,
    nombre character varying(255),
    descripcion character varying(255)
);


--
-- Name: tipo_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_usuario (
    id bigint NOT NULL,
    nombre character varying(255),
    descripcion character varying(255)
);


--
-- Name: trabajador_citacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajador_citacion (
    id bigint NOT NULL,
    id_proyecto bigint,
    id_persona bigint,
    id_citacion bigint
);


--
-- Name: trabajador_cuadrilla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajador_cuadrilla (
    id bigint NOT NULL,
    id_trabajador bigint,
    id_cuadrilla bigint,
    id_cargo bigint
);


--
-- Name: trabajador_despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajador_despacho (
    id bigint NOT NULL,
    id_persona bigint NOT NULL,
    id_despacho bigint
);


--
-- Name: trabajador_hospedaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajador_hospedaje (
    id bigint NOT NULL,
    id_persona bigint NOT NULL,
    id_proyecto bigint,
    id_hospedaje bigint
);


--
-- Name: trabajador_turno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajador_turno (
    id bigint NOT NULL,
    id_persona bigint NOT NULL,
    id_proyecto bigint,
    id_turno bigint
);


--
-- Name: trazabilidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trazabilidad (
    id bigint NOT NULL,
    metodo character varying(255),
    jsoon character varying(255),
    fecha_registro timestamp without time zone,
    usuario character varying(255),
    mensaje character varying(255)
);


--
-- Name: turno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.turno (
    id bigint NOT NULL,
    tipo character varying
);


--
-- Name: usuario_tarea; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_tarea (
    id bigint NOT NULL,
    id_usuario bigint,
    id_tarea bigint
);


--
-- Name: accion_despacho accion_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accion_despacho
    ADD CONSTRAINT accion_despacho_pkey PRIMARY KEY (id);


--
-- Name: accion_incidente accion_incidente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accion_incidente
    ADD CONSTRAINT accion_incidente_pkey PRIMARY KEY (id);


--
-- Name: actividad actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividad
    ADD CONSTRAINT actividad_pkey PRIMARY KEY (id);


--
-- Name: alerta alerta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerta
    ADD CONSTRAINT alerta_pkey PRIMARY KEY (id);


--
-- Name: articulo_cargo articulo_cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulo_cargo
    ADD CONSTRAINT articulo_cargo_pkey PRIMARY KEY (id);


--
-- Name: articulo articulo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulo
    ADD CONSTRAINT articulo_pkey PRIMARY KEY (id);


--
-- Name: bloqueo_persona bloqueo_persona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueo_persona
    ADD CONSTRAINT bloqueo_persona_pkey PRIMARY KEY (id);


--
-- Name: cargo cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargo
    ADD CONSTRAINT cargo_pkey PRIMARY KEY (id);


--
-- Name: cargo_tipo_cuadrilla cargo_tipo_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargo_tipo_cuadrilla
    ADD CONSTRAINT cargo_tipo_cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: cargos_solicitados_proyectos cargos_solicitados_proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargos_solicitados_proyectos
    ADD CONSTRAINT cargos_solicitados_proyectos_pkey PRIMARY KEY (id);


--
-- Name: categoria_cargo categoria_cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria_cargo
    ADD CONSTRAINT categoria_cargo_pkey PRIMARY KEY (id);


--
-- Name: citacion citacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citacion
    ADD CONSTRAINT citacion_pkey PRIMARY KEY (id);


--
-- Name: comuna comuna_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comuna
    ADD CONSTRAINT comuna_pkey PRIMARY KEY (id);


--
-- Name: controles_criticos controles_criticos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_criticos
    ADD CONSTRAINT controles_criticos_pkey PRIMARY KEY (id);


--
-- Name: cuadrilla cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuadrilla
    ADD CONSTRAINT cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: despacho despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho
    ADD CONSTRAINT despacho_pkey PRIMARY KEY (id);


--
-- Name: detalle_entrega_epp detalle_entrega_epp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_entrega_epp
    ADD CONSTRAINT detalle_entrega_epp_pkey PRIMARY KEY (id);


--
-- Name: documento_cuadrilla documento_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_cuadrilla
    ADD CONSTRAINT documento_cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: documento documento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT documento_pkey PRIMARY KEY (id);


--
-- Name: documento_reporte_flash documento_reporte_flash_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_reporte_flash
    ADD CONSTRAINT documento_reporte_flash_pkey PRIMARY KEY (id);


--
-- Name: documento_tipo_cuadrilla documento_tipo_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento_tipo_cuadrilla
    ADD CONSTRAINT documento_tipo_cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: documentos_cargo documentos_cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_cargo
    ADD CONSTRAINT documentos_cargo_pkey PRIMARY KEY (id);


--
-- Name: documentos_persona documentos_persona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_persona
    ADD CONSTRAINT documentos_persona_pkey PRIMARY KEY (id);


--
-- Name: empresa_cliente empresa_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_cliente
    ADD CONSTRAINT empresa_cliente_pkey PRIMARY KEY (id);


--
-- Name: empresa empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (id);


--
-- Name: entrega_epp entrega_epp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrega_epp
    ADD CONSTRAINT entrega_epp_pkey PRIMARY KEY (id);


--
-- Name: equipo_cuadrilla equipo_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_cuadrilla
    ADD CONSTRAINT equipo_cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: equipo equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_pkey PRIMARY KEY (id);


--
-- Name: estado estado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estado
    ADD CONSTRAINT estado_pkey PRIMARY KEY (id);


--
-- Name: evaluacion_articulo evaluacion_articulo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluacion_articulo
    ADD CONSTRAINT evaluacion_articulo_pkey PRIMARY KEY (id);


--
-- Name: evaluacion evaluacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluacion
    ADD CONSTRAINT evaluacion_pkey PRIMARY KEY (id);


--
-- Name: faena faena_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faena
    ADD CONSTRAINT faena_pkey PRIMARY KEY (id);


--
-- Name: faena_usuario faena_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faena_usuario
    ADD CONSTRAINT faena_usuario_pkey PRIMARY KEY (id);


--
-- Name: faenas_cargo faenas_cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faenas_cargo
    ADD CONSTRAINT faenas_cargo_pkey PRIMARY KEY (id);


--
-- Name: faenas_responsables_usuario faenas_responsables_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faenas_responsables_usuario
    ADD CONSTRAINT faenas_responsables_usuario_pkey PRIMARY KEY (id);


--
-- Name: herramienta herramienta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.herramienta
    ADD CONSTRAINT herramienta_pkey PRIMARY KEY (id);


--
-- Name: historial_mochila_spdc historial_mochila_spdc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_mochila_spdc
    ADD CONSTRAINT historial_mochila_spdc_pkey PRIMARY KEY (id);


--
-- Name: historico_tarea historico_tarea_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_tarea
    ADD CONSTRAINT historico_tarea_pkey PRIMARY KEY (id);


--
-- Name: hospedaje hospedaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospedaje
    ADD CONSTRAINT hospedaje_pkey PRIMARY KEY (id);


--
-- Name: incidente_riesgos_fatalidad incidente_riesgos_fatalidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidente_riesgos_fatalidad
    ADD CONSTRAINT incidente_riesgos_fatalidad_pkey PRIMARY KEY (id);


--
-- Name: inspeccion_mochila inspeccion_mochila_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inspeccion_mochila
    ADD CONSTRAINT inspeccion_mochila_pkey PRIMARY KEY (id);


--
-- Name: investigador_incidente investigador_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigador_incidente
    ADD CONSTRAINT investigador_pkey PRIMARY KEY (id);


--
-- Name: jhi_authority jhi_authority_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_authority
    ADD CONSTRAINT jhi_authority_pkey PRIMARY KEY (name);


--
-- Name: jhi_persistent_token jhi_persistent_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_persistent_token
    ADD CONSTRAINT jhi_persistent_token_pkey PRIMARY KEY (series);


--
-- Name: jhi_user_authority jhi_user_authority_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_user_authority
    ADD CONSTRAINT jhi_user_authority_pkey PRIMARY KEY (user_id, authority_name);


--
-- Name: jhi_user jhi_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_user
    ADD CONSTRAINT jhi_user_pkey PRIMARY KEY (id);


--
-- Name: mensaje mensaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensaje
    ADD CONSTRAINT mensaje_pkey PRIMARY KEY (id);


--
-- Name: mochila_articulo_spdc mochila_articulo_spdc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mochila_articulo_spdc
    ADD CONSTRAINT mochila_articulo_spdc_pkey PRIMARY KEY (id);


--
-- Name: mochila_spdc mochila_spdc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mochila_spdc
    ADD CONSTRAINT mochila_spdc_pkey PRIMARY KEY (id);


--
-- Name: nota nota_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nota
    ADD CONSTRAINT nota_pkey PRIMARY KEY (id);


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY (id);


--
-- Name: pais pais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pais
    ADD CONSTRAINT pais_pkey PRIMARY KEY (id);


--
-- Name: pasaje pasaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pasaje
    ADD CONSTRAINT pasaje_pkey PRIMARY KEY (id);


--
-- Name: persona_asociada_empresa persona_asociada_empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona_asociada_empresa
    ADD CONSTRAINT persona_asociada_empresa_pkey PRIMARY KEY (id);


--
-- Name: persona_cargo persona_cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona_cargo
    ADD CONSTRAINT persona_cargo_pkey PRIMARY KEY (id);


--
-- Name: persona_historico persona_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona_historico
    ADD CONSTRAINT persona_historico_pkey PRIMARY KEY (id);


--
-- Name: persona persona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_pkey PRIMARY KEY (id);


--
-- Name: persona_proyecto persona_proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona_proyecto
    ADD CONSTRAINT persona_proyecto_pkey PRIMARY KEY (id);


--
-- Name: aviso_mantenimiento pk_aviso_mantenimiento; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aviso_mantenimiento
    ADD CONSTRAINT pk_aviso_mantenimiento PRIMARY KEY (id);


--
-- Name: plan_accion plan_accion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_accion
    ADD CONSTRAINT plan_accion_pkey PRIMARY KEY (id);


--
-- Name: planeacion_investigacion planeacion_investigacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_investigacion
    ADD CONSTRAINT planeacion_investigacion_pkey PRIMARY KEY (id);


--
-- Name: preguntas preguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_pkey PRIMARY KEY (id);


--
-- Name: privilegios_rol privilegios_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privilegios_rol
    ADD CONSTRAINT privilegios_rol_pkey PRIMARY KEY (id);


--
-- Name: proyecto proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT proyecto_pkey PRIMARY KEY (id);


--
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (id);


--
-- Name: reporte_flash reporte_flash_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporte_flash
    ADD CONSTRAINT reporte_flash_pkey PRIMARY KEY (id);


--
-- Name: respuestas respuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas
    ADD CONSTRAINT respuestas_pkey PRIMARY KEY (id);


--
-- Name: riesgos_fatalidad riesgos_fatalidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riesgos_fatalidad
    ADD CONSTRAINT riesgos_fatalidad_pkey PRIMARY KEY (id);


--
-- Name: ruta_foto ruta_foto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ruta_foto
    ADD CONSTRAINT ruta_foto_pkey PRIMARY KEY (id);


--
-- Name: tarea tarea_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarea
    ADD CONSTRAINT tarea_pkey PRIMARY KEY (id);


--
-- Name: tipo_cuadrilla tipo_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_cuadrilla
    ADD CONSTRAINT tipo_cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: tipo_equipo tipo_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_equipo
    ADD CONSTRAINT tipo_equipo_pkey PRIMARY KEY (id);


--
-- Name: tipo_equipo_tipo_cuadrilla tipo_equipo_tipo_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_equipo_tipo_cuadrilla
    ADD CONSTRAINT tipo_equipo_tipo_cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: tipo_identificacion tipo_identificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_identificacion
    ADD CONSTRAINT tipo_identificacion_pkey PRIMARY KEY (id);


--
-- Name: tipo_usuario tipo_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_usuario
    ADD CONSTRAINT tipo_usuario_pkey PRIMARY KEY (id);


--
-- Name: trabajador_citacion trabajador_citacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_citacion
    ADD CONSTRAINT trabajador_citacion_pkey PRIMARY KEY (id);


--
-- Name: trabajador_cuadrilla trabajador_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_cuadrilla
    ADD CONSTRAINT trabajador_cuadrilla_pkey PRIMARY KEY (id);


--
-- Name: trabajador_despacho trabajador_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_despacho
    ADD CONSTRAINT trabajador_despacho_pkey PRIMARY KEY (id);


--
-- Name: trabajador_hospedaje trabajador_hospedaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_hospedaje
    ADD CONSTRAINT trabajador_hospedaje_pkey PRIMARY KEY (id_persona);


--
-- Name: trabajador_turno trabajador_turno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_turno
    ADD CONSTRAINT trabajador_turno_pkey PRIMARY KEY (id);


--
-- Name: trazabilidad trazabilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trazabilidad
    ADD CONSTRAINT trazabilidad_pkey PRIMARY KEY (id);


--
-- Name: turno turno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turno
    ADD CONSTRAINT turno_pkey PRIMARY KEY (id);


--
-- Name: usuario_tarea usuario_tarea_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_tarea
    ADD CONSTRAINT usuario_tarea_pkey PRIMARY KEY (id);


--
-- Name: jhi_user ux_user_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_user
    ADD CONSTRAINT ux_user_email UNIQUE (email);


--
-- Name: jhi_user ux_user_login; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_user
    ADD CONSTRAINT ux_user_login UNIQUE (login);


--
-- Name: ix_accion_despacho_trab_despacho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_accion_despacho_trab_despacho ON public.accion_despacho USING btree (id_trabajador_despacho);


--
-- Name: ix_despacho_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_despacho_proyecto ON public.despacho USING btree (id_proyecto);


--
-- Name: ix_entrega_epp_persona_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entrega_epp_persona_proyecto ON public.entrega_epp USING btree (id_persona, id_proyecto);


--
-- Name: ix_evaluacion_persona_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_evaluacion_persona_proyecto ON public.evaluacion USING btree (id_persona, id_proyecto);


--
-- Name: ix_pasaje_persona_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pasaje_persona_proyecto ON public.pasaje USING btree (id_persona, id_proyecto);


--
-- Name: ix_persona_proyecto_per_proy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_persona_proyecto_per_proy ON public.persona_proyecto USING btree (id_persona, id_proyecto);


--
-- Name: ix_trab_citacion_persona_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trab_citacion_persona_proyecto ON public.trabajador_citacion USING btree (id_persona, id_proyecto);


--
-- Name: ix_trab_despacho_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trab_despacho_persona ON public.trabajador_despacho USING btree (id_persona);


--
-- Name: ix_trab_turno_persona_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trab_turno_persona_proyecto ON public.trabajador_turno USING btree (id_persona, id_proyecto);


--
-- Name: jhi_user_authority fk_authority_name; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_user_authority
    ADD CONSTRAINT fk_authority_name FOREIGN KEY (authority_name) REFERENCES public.jhi_authority(name);


--
-- Name: jhi_user_authority fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_user_authority
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.jhi_user(id);


--
-- Name: jhi_persistent_token fk_user_persistent_token; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jhi_persistent_token
    ADD CONSTRAINT fk_user_persistent_token FOREIGN KEY (user_id) REFERENCES public.jhi_user(id);


--
-- PostgreSQL database dump complete
--



-- --- Artefactos JHipster/Liquibase descartados (§7.2) ---
drop table if exists public.databasechangelog cascade;
drop table if exists public.databasechangeloglock cascade;
drop table if exists public.jhi_persistent_token cascade;
