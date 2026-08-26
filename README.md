# NexoPOS

NexoPOS es una aplicación móvil de gestión para restaurantes y pequeñas empresas, construida con Expo SDK 54, React Native, Expo Router, TypeScript, NativeWind y un servidor Express/tRPC. La aplicación incluye POS, inventario, pedidos, CRM, caja, catálogo público, abastecimiento, analítica comercial y preparación para integraciones de Meta WhatsApp, Google Sheets y Gemini.

## Requisitos

Se requiere Node.js 22 o una versión compatible con Expo SDK 54, pnpm 9 y, para builds nativos, una cuenta de Expo Application Services (EAS). La instalación reproducible usa el lockfile incluido.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm test
```

La exportación web se valida con:

```bash
npx expo export --platform web
```

## Configuración segura

Copia `.env.example` a `.env` únicamente en entornos locales o en el gestor de secretos del proveedor de despliegue. Las variables con prefijo `EXPO_PUBLIC_` pueden terminar en el bundle del cliente. Las credenciales de base de datos, OAuth, Gemini y Meta deben permanecer del lado del servidor y nunca deben convertirse en variables `EXPO_PUBLIC_*`.

El servidor expone `GET /api/health` para comprobaciones de disponibilidad. En producción, configura `PORT`, `CORS_ORIGINS`, `DATABASE_URL` y `JWT_SECRET` como mínimo. `CORS_ORIGINS` debe contener los orígenes web exactos, separados por comas, que pueden llamar a la API. Las integraciones opcionales se activan solamente cuando sus credenciales correspondientes son válidas.

## Desarrollo

Para iniciar simultáneamente la API y la aplicación web:

```bash
pnpm dev
```

La aplicación web se sirve normalmente en `http://localhost:8081` y la API en el puerto definido por `PORT`, normalmente `3000`. Si el puerto preferido está ocupado, el servidor busca otro puerto disponible dentro del rango inmediato; en producción se recomienda reservar un puerto fijo, definir `EXPO_PUBLIC_API_BASE_URL` con la URL pública de la API y configurar `CORS_ORIGINS` con el dominio web exacto.

## Publicación móvil con EAS

El repositorio incluye `eas.json` con perfiles `development`, `preview` y `production`:

```bash
npx eas login
npx eas build:configure
npx eas build --platform all --profile preview
npx eas build --platform all --profile production
npx eas submit --platform all --profile production
```

Antes del primer build se deben revisar el identificador de paquete iOS/Android, la cuenta propietaria de Expo, los certificados y los datos de las tiendas. Los activos de icono, splash y favicon están versionados localmente para que el build no dependa de enlaces simbólicos externos.

## Publicación del servidor

El servidor es una aplicación Node.js compilable con:

```bash
pnpm build
pnpm start
```

El proveedor elegido debe ejecutar `pnpm install --frozen-lockfile`, `pnpm build` y `pnpm start`, asignar el puerto entregado por `PORT`, configurar las variables de `.env.example` y exponer la ruta `/api/health`. La base de datos debe aplicar las migraciones Drizzle mediante `pnpm db:push` siguiendo la política de migraciones del proveedor.

## Estado de integraciones

Meta WhatsApp, Google Sheets privadas y Gemini tienen adaptadores, validaciones y estados administrativos preparados, pero requieren credenciales reales del propietario para activarse. No se incluyen credenciales en el repositorio ni se activan pruebas que dependan de servicios externos por defecto.

## Criterios de entrega

Antes de publicar una versión, ejecuta `pnpm check`, `pnpm lint`, `pnpm test` y `npx expo export --platform web`. También conviene revisar el flujo de apertura de caja, alta de productos, escaneo, venta, cobro, pedidos, CRM, importación y respaldo desde un dispositivo físico o una compilación preview.
