# Autenticación y Roles — Influmetics MVP

## Stack

```
Supabase Auth (maneja login, registro, sesión, password reset)
    │
    ▼
Tabla public.profiles (rol, empresa, nombre — creada automáticamente al registrarse)
    │
    ▼
React Context (AuthContext — expone user + profile a toda la app)
```

---

## Roles disponibles

| Rol | Uso |
|-----|-----|
| `admin` | Acceso total: crear/editar/eliminar todo, gestionar usuarios |
| `growth_manager` (default) | CRUD de campañas e influencers, ver métricas |
| `viewer` | Solo lectura: dashboards, reportes |

---

## Cómo se usa en componentes

```tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";

function MiComponente() {
  const { user, profile, isLoading, login, signup, logout } = useAuth();

  if (isLoading) return <p>Cargando...</p>;
  if (!user) return <p>No autenticado</p>;

  return (
    <div>
      <p>Nombre: {profile?.name}</p>
      <p>Rol: {profile?.role}</p>
      <p>Empresa: {profile?.company}</p>
    </div>
  );
}
```

---

## Cómo proteger rutas del dashboard

El middleware ya protege `/dashboard/*` — redirige a `/` si no hay sesión.

Para proteger **por rol** dentro de una página:

```tsx
const { profile } = useAuth();

if (profile?.role === "viewer" && accionRestringida) {
  toast.error("No tienes permiso");
  return;
}
```

Para proteger **API routes**:

```ts
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "viewer") {
    return NextResponse.json({ error: "Solo lectura" }, { status: 403 });
  }

  // ... lógica normal
}
```

---

## Cómo crear un nuevo usuario

```
Desde el frontend:
  signup-form.tsx → usa useAuth().signup(email, password, name, role?, company?)
  El trigger handle_new_user() crea el perfil automáticamente en profiles

Desde Supabase Dashboard:
  Authentication > Users > Invite user
  Luego editar profiles.role en Table Editor si necesitas cambiar el rol
```

---

## Cómo hacer admin a alguien

1. Ve a **Supabase Dashboard > Table Editor > profiles**
2. Busca el usuario por email
3. Cambia la celda `role` de `growth_manager` a `admin`
4. Guarda — el cambio es inmediato, no necesita relogin

---

## Cómo agregar un nuevo rol

Solo cambia la string en la columna `role` de `profiles`. No hay tabla de roles fija.

Ejemplo: si necesitas `analyst`, solo escribes `analyst` en profiles.role de ese usuario.

Luego en el código:
```ts
if (profile?.role === "analyst") {
  // lógica específica
}
```

---

## Arquitectura de datos

```
auth.users (Supabase interna — NO tocar)
  │
  ├── id: UUID
  ├── email: string
  └── raw_user_meta_data: { full_name, role, company }

public.profiles (tabla nuestra — creada por trigger)
  │
  ├── id: UUID → FK a auth.users(id)
  ├── name: string
  ├── email: string
  ├── role: string (default: 'growth_manager')
  ├── company: string (default: '')
  ├── country: string (default: '')
  └── created_at / updated_at
```

El trigger `handle_new_user()` se dispara después de cada registro en `auth.users` y replica los metadatos en `public.profiles`. Si el registro falla, el usuario no se crea (todo en la misma transacción).

---

## Password reset

El formulario `/forgot-password` usa `supabase.auth.resetPasswordForEmail()`.
Supabase envía el correo automáticamente (configurable en Auth > Settings > Templates).
