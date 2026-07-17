-- =============================================================================
-- 0033_licencias_spot.sql — Licencias Spot (dominio NUEVO del original,
-- commits e46b3b5/983ccf3: gestor y visor de licencias MEL/Gesta del personal
-- Spot). La tabla no existía en el backup (2026-06-30): se crea aquí como el
-- changelog Liquibase 20260702120000 (precondition IF NOT EXISTS incluida).
--
-- Paridad de lógica (LicenciaSpotDTO/LicenciaSpotServiceImpl):
--   estado MEL calculado EN VIVO: sin fecha → SIN_FECHA; < hoy → VENCIDA;
--   <= 30 días → POR_VENCER; si no → VIGENTE. puede_conducir = vencimiento >= hoy.
--   Orden del listado: días restantes DESC con NULLS LAST (vigentes primero).
--   ciudad = persona.comuna cruzada por RUT EXACTO (numero_id = rut, fiel).
--   RUT normalizado (RutUtil): sin puntos/espacios, mayúscula, guion antes
--   del DV si no lo trae.
-- Permisos (fiel al @PreAuthorize del Resource): lectura = authenticated;
-- escritura y typeahead = ROLE_ADMIN / SUPERADMINISTRADOR / RECLUTADOR
-- (authority NUEVA del original — se asigna en perfil.roles, sin seed).
-- =============================================================================

create table if not exists public.licencia_spot (
  id bigint primary key default nextval('public.sequence_generator'),
  rut varchar(20),
  nombre varchar(255),
  cargo varchar(255),
  vencimiento_mel date,
  vencimiento_texto varchar(60),
  licencia_gesta boolean,
  observaciones varchar(500),
  updated_at timestamp,
  updated_by varchar(255),
  constraint ux_licencia_spot_rut unique (rut)
);

alter table public.licencia_spot enable row level security;

drop policy if exists licencia_spot_select on public.licencia_spot;
create policy licencia_spot_select on public.licencia_spot
  for select to authenticated using (true);
-- Sin policies de escritura: todas las mutaciones van por RPC SECURITY DEFINER.

-- Normalización de RUT (RutUtil.normalizar fiel)
create or replace function public.licencia_rut_normalizar(p_rut text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s text;
begin
  if p_rut is null then
    return null;
  end if;
  s := upper(replace(replace(trim(p_rut), '.', ''), ' ', ''));
  if s = '' then
    return null;
  end if;
  if position('-' in s) = 0 and length(s) > 1 then
    s := left(s, length(s) - 1) || '-' || right(s, 1);
  end if;
  return s;
end;
$$;

grant execute on function public.licencia_rut_normalizar(text) to authenticated;

-- ¿Puede editar? (guard compartido de las mutaciones)
create or replace function public.licencia_spot_puede_editar()
returns boolean
language sql
stable
set search_path = public
as $$
  select has_role('ROLE_ADMIN') or has_role('SUPERADMINISTRADOR') or has_role('RECLUTADOR');
$$;

grant execute on function public.licencia_spot_puede_editar() to authenticated;

-- Listado con campos calculados + ciudad (findAll + enriquecerCiudad + orden)
create or replace function public.licencias_spot_listar()
returns table(
  id bigint,
  rut text,
  nombre text,
  cargo text,
  vencimiento_mel date,
  vencimiento_texto text,
  licencia_gesta boolean,
  observaciones text,
  updated_at timestamp,
  updated_by text,
  estado_mel text,
  dias_restantes integer,
  puede_conducir boolean,
  ciudad text
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id,
         l.rut::text,
         l.nombre::text,
         l.cargo::text,
         l.vencimiento_mel,
         l.vencimiento_texto::text,
         l.licencia_gesta,
         l.observaciones::text,
         l.updated_at,
         l.updated_by::text,
         case
           when l.vencimiento_mel is null then 'SIN_FECHA'
           when l.vencimiento_mel < current_date then 'VENCIDA'
           when (l.vencimiento_mel - current_date) <= 30 then 'POR_VENCER'
           else 'VIGENTE'
         end,
         (l.vencimiento_mel - current_date),
         (l.vencimiento_mel is not null and l.vencimiento_mel >= current_date),
         (select p.comuna::text from public.persona p where p.numero_id = l.rut limit 1)
    from public.licencia_spot l
   order by (l.vencimiento_mel - current_date) desc nulls last;
$$;

grant execute on function public.licencias_spot_listar() to authenticated;

-- Crear/editar (create + update del Resource, con sus validaciones exactas)
create or replace function public.licencia_spot_guardar(
  p_id bigint,
  p_rut text,
  p_nombre text,
  p_cargo text,
  p_vencimiento_mel date,
  p_vencimiento_texto text,
  p_licencia_gesta boolean,
  p_observaciones text,
  p_usuario text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rut text;
  v_id bigint;
begin
  if not public.licencia_spot_puede_editar() then
    raise exception 'No tienes permisos para editar licencias.';
  end if;

  v_rut := public.licencia_rut_normalizar(p_rut);

  if p_id is null then
    -- create: RUT obligatorio + persona debe existir + RUT único
    if v_rut is null then
      raise exception 'El RUT es obligatorio';
    end if;
    if not exists (
      select 1 from public.persona p
       where p.numero_id = trim(p_rut) or p.numero_id = v_rut
    ) then
      raise exception 'La persona no existe en el sistema';
    end if;
    if exists (select 1 from public.licencia_spot l where l.rut = v_rut) then
      raise exception 'Ya existe una licencia con ese RUT';
    end if;
    insert into public.licencia_spot
      (rut, nombre, cargo, vencimiento_mel, vencimiento_texto, licencia_gesta, observaciones, updated_at, updated_by)
    values
      (v_rut, p_nombre, p_cargo, p_vencimiento_mel, p_vencimiento_texto,
       coalesce(p_licencia_gesta, false), p_observaciones, now(), p_usuario)
    returning licencia_spot.id into v_id;
    return v_id;
  end if;

  -- update (save completo, fiel al PUT)
  if not exists (select 1 from public.licencia_spot l where l.id = p_id) then
    raise exception 'ID inválido';
  end if;
  update public.licencia_spot
     set rut = coalesce(v_rut, licencia_spot.rut),
         nombre = p_nombre,
         cargo = p_cargo,
         vencimiento_mel = p_vencimiento_mel,
         vencimiento_texto = p_vencimiento_texto,
         licencia_gesta = coalesce(p_licencia_gesta, false),
         observaciones = p_observaciones,
         updated_at = now(),
         updated_by = p_usuario
   where licencia_spot.id = p_id;
  return p_id;
end;
$$;

grant execute on function public.licencia_spot_guardar(bigint, text, text, text, date, text, boolean, text, text) to authenticated;

-- Eliminar (deleteById gateado)
create or replace function public.licencia_spot_eliminar(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.licencia_spot_puede_editar() then
    raise exception 'No tienes permisos para editar licencias.';
  end if;
  delete from public.licencia_spot where id = p_id;
end;
$$;

grant execute on function public.licencia_spot_eliminar(bigint) to authenticated;

-- Typeahead de personas (buscarParaLicencia: nombre o RUT, límite 20,
-- dedup por RUT — gateado a los roles de edición como el @PreAuthorize)
create or replace function public.licencias_spot_buscar_personas(p_q text)
returns table(rut text, nombre text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.licencia_spot_puede_editar() then
    raise exception 'No tienes permisos para editar licencias.';
  end if;
  if p_q is null or length(trim(p_q)) < 2 then
    return;
  end if;
  -- Fiel al original: primero top-20 ordenado por nombre, DESPUÉS dedup por
  -- RUT conservando la primera aparición (puede devolver < 20).
  return query
  select t.rut, t.nombre
    from (
      select distinct on (s.numero_id) s.numero_id::text as rut, s.nombre_completo::text as nombre, s.rn
        from (
          select p.numero_id, p.nombre_completo,
                 row_number() over (order by p.nombre_completo) as rn
            from public.persona p
           where p.numero_id is not null
             and (upper(p.nombre_completo) like '%' || upper(trim(p_q)) || '%'
                  or upper(p.numero_id) like '%' || upper(trim(p_q)) || '%')
           order by p.nombre_completo
           limit 20
        ) s
       order by s.numero_id, s.rn
    ) t
   order by t.rn;
end;
$$;

grant execute on function public.licencias_spot_buscar_personas(text) to authenticated;

-- Postgres da EXECUTE a PUBLIC por defecto → revocar de anon/public.
revoke execute on function public.licencia_rut_normalizar(text) from public, anon;
revoke execute on function public.licencia_spot_puede_editar() from public, anon;
revoke execute on function public.licencias_spot_listar() from public, anon;
revoke execute on function public.licencia_spot_guardar(bigint, text, text, text, date, text, boolean, text, text) from public, anon;
revoke execute on function public.licencia_spot_eliminar(bigint) from public, anon;
revoke execute on function public.licencias_spot_buscar_personas(text) from public, anon;
