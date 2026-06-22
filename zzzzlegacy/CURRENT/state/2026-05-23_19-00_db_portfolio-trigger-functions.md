# DB Snapshot — Portfolio Legacy Trigger Functions & RPC Signatures

**Date:** 2026-05-23  
**Time:** 19:00  
**Reviewer:** DB Command  
**Project Ref:** nkdrjlmbtqbywhcthppm  
**Source:** Live Supabase Management API — pg_trigger, pg_proc  
**Trigger:** Migration 20260523190000 Section 2 failure — `DROP TRIGGER ... ON vc.vport_portfolio_items` errored because the table no longer exists  
**Application Scope:** VCSM  

---

## Query 1 — Active Triggers Referencing Legacy Functions

**Query:**
```sql
SELECT t.tgname AS trigger_name, n.nspname AS table_schema, c.relname AS table_name, p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE p.proname IN ('ensure_portfolio_cover_media', 'ensure_portfolio_item_metrics_row')
ORDER BY table_schema, table_name, trigger_name
```

**Result:** `[]` — **No triggers exist** referencing either function on any live table.

**Conclusion:** When `vc.vport_portfolio_items` and `vc.vport_portfolio_item_metrics` were dropped, their triggers were automatically removed by PostgreSQL (triggers are dropped with their owning table). No `DROP TRIGGER` statement is needed in the migration.

---

## Query 2 — Orphaned Trigger Functions

**Query:**
```sql
SELECT p.proname, n.nspname, p.prosecdef, pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('ensure_portfolio_cover_media', 'ensure_portfolio_item_metrics_row')
AND n.nspname = 'vc'
```

**Result:**

### `vc.ensure_portfolio_cover_media()`

```sql
CREATE OR REPLACE FUNCTION vc.ensure_portfolio_cover_media()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'vc', 'public'
 SET row_security TO 'off'
AS $function$
begin
  if new.media_role = 'cover' then
    update vc.vport_portfolio_items        -- ← BROKEN: table no longer exists
    set cover_media_id = new.id,
        updated_at = now()
    where id = new.portfolio_item_id;
  end if;
  return new;
end;
$function$
```

**Status:** ORPHANED — function exists, no trigger attached, references non-existent `vc.vport_portfolio_items`.

---

### `vc.ensure_portfolio_item_metrics_row()`

```sql
CREATE OR REPLACE FUNCTION vc.ensure_portfolio_item_metrics_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'vc', 'public'
 SET row_security TO 'off'
AS $function$
begin
  insert into vc.vport_portfolio_item_metrics (portfolio_item_id)   -- ← BROKEN: table no longer exists
  values (new.id)
  on conflict (portfolio_item_id) do nothing;
  return new;
end;
$function$
```

**Status:** ORPHANED — function exists, no trigger attached, references non-existent `vc.vport_portfolio_item_metrics`.

---

## Query 3 — Broken RPC Exact Signatures

**Query:**
```sql
SELECT p.proname, n.nspname, array_to_string(p.proargtypes::regtype[], ', ') AS arg_types
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('get_vport_portfolio', 'get_barber_vport_portfolio', 'get_barber_vport_portfolio_item_detail')
AND n.nspname = 'vc'
ORDER BY proname
```

**Result:**

| Function | Schema | Arg Types |
|---|---|---|
| `get_barber_vport_portfolio` | `vc` | `uuid, integer, integer` |
| `get_barber_vport_portfolio_item_detail` | `vc` | `uuid` |
| `get_vport_portfolio` | `vc` | `uuid, integer, integer` |

---

## Migration Fix Applied

**Problem:** Migration Section 2 had:
```sql
DROP TRIGGER IF EXISTS ensure_cover_media_trigger ON vc.vport_portfolio_items;
DROP TRIGGER IF EXISTS ensure_metrics_row_trigger ON vc.vport_portfolio_items;
```
This failed with `42P01: relation "vc.vport_portfolio_items" does not exist` because PostgreSQL validates the table reference even with `IF EXISTS` on the trigger.

**Fix applied to `20260523190000_portfolio_card_p0_security.sql`:**
- Removed both `DROP TRIGGER` statements (no triggers exist — already removed with the dropped tables)
- Corrected RPC signatures in Section 1 to match live DB

**Final Section 1 (RPCs):**
```sql
DROP FUNCTION IF EXISTS vc.get_vport_portfolio(uuid, integer, integer);
DROP FUNCTION IF EXISTS vc.get_barber_vport_portfolio(uuid, integer, integer);
DROP FUNCTION IF EXISTS vc.get_barber_vport_portfolio_item_detail(uuid);
```

**Final Section 2 (orphaned functions — no triggers to drop):**
```sql
DROP FUNCTION IF EXISTS vc.ensure_portfolio_cover_media();
DROP FUNCTION IF EXISTS vc.ensure_portfolio_item_metrics_row();
```
