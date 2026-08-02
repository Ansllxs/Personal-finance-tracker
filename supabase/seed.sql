-- Datos semilla opcionales
-- Ejecutar DESPUÉS de crear tu usuaria e iniciar sesión.
-- Reemplaza YOUR_USER_ID con el UUID de auth.users.

-- Ejemplo de uso (desde SQL Editor, con tu user id):
-- select id from auth.users; -- copia el id
-- Luego reemplaza :user_id abajo o usa la función seed desde la app (Ajustes > Cargar datos de ejemplo).

/*
-- Plantilla manual (descomenta y sustituye el UUID):

do $$
declare
  uid uuid := 'YOUR_USER_ID'::uuid;
  acc_bank uuid;
  acc_sinpe uuid;
  acc_cash uuid;
  acc_card uuid;
  cat_beca uuid;
begin
  -- Ver seed completo en src/lib/seed-data.ts (preferido desde la app)
  raise notice 'Usa la app: Ajustes → Cargar datos de ejemplo';
end $$;
*/
