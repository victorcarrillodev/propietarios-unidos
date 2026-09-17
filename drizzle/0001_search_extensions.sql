-- Búsqueda rápida sin importar acentos ni mayúsculas (ej. "gonzalez" encuentra "González").
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
-- unaccent() no es IMMUTABLE; esta envoltura sí lo es y permite usarla en índices.
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  RETURN public.unaccent('public.unaccent'::regdictionary, $1);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS members_full_name_search_idx ON members USING gin (f_unaccent(full_name) gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS posts_title_search_idx ON posts USING gin (f_unaccent(title) gin_trgm_ops);
