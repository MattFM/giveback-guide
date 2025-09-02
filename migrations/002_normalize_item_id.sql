-- 002_normalize_item_id.sql
-- Preview rows that look like JSON objects (manual check before running):
-- SELECT id, list_id, item_type, item_id FROM list_items WHERE item_id LIKE '{%';

-- Safe PL/pgSQL block: iterate rows where item_id starts with '{', attempt to parse JSON,
-- build a normalized string and update item_id. Parsing errors are caught and skipped.

DO $$
DECLARE
  r RECORD;
  obj jsonb;
  new_id TEXT;
BEGIN
  FOR r IN SELECT id, item_id FROM list_items WHERE item_id LIKE '{%'
  LOOP
    BEGIN
      obj := r.item_id::jsonb;

      IF obj ? 'prefix' AND obj ? 'number' THEN
        -- e.g. {"prefix":"PRO","number":777} => PRO-777
        new_id := upper(obj ->> 'prefix') || '-' || obj ->> 'number';
      ELSIF obj ? 'id' THEN
        new_id := obj ->> 'id';
      ELSIF obj ? 'value' THEN
        new_id := obj ->> 'value';
      ELSIF obj ? 'name' THEN
        new_id := obj ->> 'name';
      ELSE
        -- fallback: use the JSON text representation (best-effort)
        new_id := trim(both '"' from obj::text);
      END IF;

      -- final safety: ensure non-empty
      IF new_id IS NOT NULL AND length(trim(new_id)) > 0 THEN
        UPDATE list_items SET item_id = new_id WHERE id = r.id;
      ELSE
        RAISE NOTICE 'Row % produced empty normalized id, skipping', r.id;
      END IF;

    EXCEPTION WHEN others THEN
      -- Don't fail the whole migration; report the row and continue
      RAISE NOTICE 'Skipping row % due to parse/update error: %', r.id, SQLERRM;
    END;
  END LOOP;
END$$ LANGUAGE plpgsql;

-- After running, verify no JSON-like rows remain:
-- SELECT id, item_id FROM list_items WHERE item_id LIKE '{%';
