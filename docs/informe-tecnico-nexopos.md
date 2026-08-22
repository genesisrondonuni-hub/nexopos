# Informe técnico de NexoPOS

**Versión de referencia:** `4ff79d6c`  
**Producto:** Aplicación móvil NexoPOS para restaurantes y pymes  
**Estado de la revisión:** 21 de agosto de 2026  
**Idioma de la interfaz:** Español (Colombia)

## Resumen ejecutivo

NexoPOS es una aplicación móvil construida con React Native y Expo para centralizar la operación comercial de restaurantes, comida rápida, supermercados, abastos, bodegas y licorerías. La versión actual reúne POS, inventario, pedidos, catálogo público con WhatsApp, CRM configurable, importaciones, agentes de ventas y mecanismos de integración segura con Gemini, Google Sheets y Meta WhatsApp.

La aplicación mantiene los datos operativos en almacenamiento local del dispositivo para que los flujos esenciales funcionen sin depender de una configuración de credenciales. Las credenciales externas se reservan para el servidor y no se guardan ni se exponen en el teléfono.

## Arquitectura técnica

| Componente | Tecnología y responsabilidad |
|---|---|
| Aplicación móvil | React Native 0.81, Expo SDK 54 y Expo Router 6, con orientación vertical y navegación por pestañas. |
| Lenguaje | TypeScript 5.9 en modo estricto. |
| Interfaz | NativeWind 4 y `StyleSheet.create`, con una identidad visual verde de operación y variaciones por perfil de negocio. |
| Estado local | Context API y AsyncStorage para productos, carrito, pedidos, CRM, perfiles e importaciones. |
| Servidor | Express y tRPC para las rutas de POS, pedidos, Gemini, CRM, Google Sheets y agente de ventas. |
| Pruebas | Vitest con pruebas unitarias y de rutas para reglas de negocio, códigos, importación, CRM, WhatsApp y agentes. |

> **Principio de seguridad:** las claves de Gemini, Google y Meta se consumen únicamente desde rutas del servidor. El cliente móvil solo recibe estados de disponibilidad y respuestas permitidas.

## Funciones implementadas

| Área | Capacidades disponibles |
|---|---|
| Punto de venta | Catálogo por categorías, carrito, venta libre, cobro dividido, propinas, actualización de existencias y búsqueda por nombre, descripción o código. |
| Escaneo y códigos | Códigos de producto únicos con formato normalizado, buscador por código y escáner de barras con ingreso manual de respaldo. |
| Inventario | Stock mínimo, categorías personalizadas, creación y edición validada, descripción, costo, precio, código, imágenes, historial de movimientos y reversión de importaciones. |
| Imágenes | Selección desde cámara o biblioteca para cada producto e importación masiva de imágenes cuyo nombre coincide con el código del producto. |
| Pedidos | Estados Pendiente, En proceso, Pagado y Archivado; pedidos desde POS, catálogo y agente comercial. |
| Catálogo público | Productos visibles, carrito, datos de cliente, selección de entrega y mensaje estructurado dirigido al WhatsApp configurable del negocio. |
| CRM | Pipeline editable, oportunidades, delivery, plantillas, automatizaciones y seguimiento de estados. |
| Perfiles | Restaurante, comida rápida, supermercado, abasto, bodega y licorería con módulos, categorías y lenguaje visual adaptados. |
| Importaciones | Vista previa e importación de TXT, CSV, Excel, Google Sheets publicadas e historial reversible. |
| Integraciones | Panel de estado de Gemini, OAuth preparado para Google Sheets privadas y adaptador de Meta WhatsApp Cloud API. |

## Agente comercial por tipo de negocio

El CRM incorpora una pantalla de **Agente de ventas**. El agente recibe el mensaje del cliente, usa el catálogo y el stock disponibles, y adapta su contexto a cada perfil. Por ejemplo, en comida rápida prioriza pedidos y despacho, en supermercados identifica productos por código, en abastos contempla unidades o peso y en licorerías solicita verificación de mayoría de edad para entregas.

| Etapa | Comportamiento actual |
|---|---|
| Consulta | El agente responde con Gemini cuando la clave esté activa. Sin clave presenta una propuesta local segura para operar y probar el flujo. |
| Propuesta | Solo incluye productos existentes con existencias. El operador puede modificar cantidades antes de confirmar. |
| Delivery | Solicita dirección cuando se selecciona domicilio y respeta si el perfil y CRM permiten este servicio. |
| Confirmación | La venta nunca se registra, cobra ni descuenta inventario sin una confirmación explícita del operador. |
| Ejecución | Tras confirmar, crea el pedido, actualiza el inventario, registra el movimiento y genera una oportunidad CRM con seguimiento de delivery cuando aplique. |

## Calidad y validación

La revisión final ejecutó satisfactoriamente `pnpm check` y `pnpm test`. El resultado vigente es de **34 pruebas aprobadas**, distribuidas en 13 archivos de prueba, con 2 pruebas omitidas por requerir credenciales externas deliberadamente no configuradas.

| Validación | Resultado |
|---|---|
| Compilación TypeScript estricta | Aprobada, sin errores. |
| Reglas de códigos y búsqueda de producto | Aprobadas. |
| Importación y reversión de inventario | Aprobadas. |
| Perfiles y experiencia contextual | Aprobadas. |
| CRM, templates y modo seguro de Meta | Aprobados. |
| Catálogo y formato de pedido WhatsApp | Aprobados. |
| Agente comercial y reglas de delivery | Aprobados. |

## Estructura principal del código fuente

| Ruta | Contenido |
|---|---|
| `app/` | Pantallas móviles, incluyendo POS, inventario, CRM, agente de ventas, catálogo y configuraciones. |
| `components/` | Componentes compartidos de interfaz, contenedores y diseño operativo. |
| `lib/` | Contextos y estado persistente: POS, CRM, perfiles, integraciones y utilidades. |
| `shared/` | Tipos de dominio, validadores y reglas de producto, importación, negocio y agente comercial. |
| `server/` | Adaptadores de Gemini, Meta WhatsApp, Google Sheets, agente de ventas y rutas tRPC. |
| `tests/` | Pruebas automatizadas de reglas y endpoints. |
| `assets/images/` | Iconos y recursos de marca para las plataformas móviles. |

## Ejecución local

Para instalar y ejecutar el proyecto desde el código fuente entregado, se recomienda Node.js 22 y `pnpm` 9 o superior.

```bash
pnpm install
pnpm dev
```

Para verificar la calidad del código:

```bash
pnpm check
pnpm test
```

## Integraciones listas para activación posterior

La aplicación está preparada para usar Gemini en análisis y atención comercial, y Meta WhatsApp Cloud API para plantillas y estados de delivery. Su activación real está pendiente por decisión administrativa, ya que requiere registrar de forma segura en el servidor la clave de Gemini, el token de Meta y el identificador del número empresarial de WhatsApp.

También permanecen pendientes la autorización OAuth real de Google Sheets privadas, los webhooks de Meta para recibir estados de entrega y una validación de extremo a extremo con credenciales de producción.

## Recomendaciones de continuación

La siguiente etapa consiste en registrar las credenciales en el entorno seguro del servidor, probar una plantilla aprobada de Meta con un número de prueba y conectar los webhooks de estados. Después conviene definir horarios de atención, criterios de escalamiento a un asesor humano y políticas de cancelación para que el agente comercial opere con reglas claras.
