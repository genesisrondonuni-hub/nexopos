# Configuración de Meta WhatsApp Cloud API para NexoPOS

## Endpoint preparado

Cuando el proyecto tenga una URL pública, configure en Meta la siguiente ruta como **Callback URL**:

```text
https://<dominio-del-proyecto>/api/webhooks/meta-whatsapp
```

El endpoint atiende el desafío `GET` de Meta y recibe eventos `POST` de mensajes y estados. Antes de aceptar un evento valida la firma `X-Hub-Signature-256` con HMAC-SHA256; los eventos inválidos responden con `401` y no se procesan.

## Secretos requeridos en el servidor

| Variable | Uso |
|---|---|
| `META_WHATSAPP_ACCESS_TOKEN` | Envía plantillas por Cloud API. |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Identifica el número empresarial que emite mensajes. |
| `META_WHATSAPP_WABA_ID` | Identifica la cuenta de WhatsApp Business. |
| `META_WEBHOOK_VERIFY_TOKEN` | Coincide con el token configurado en el panel de Meta para el desafío GET. |
| `META_APP_SECRET` | Verifica la firma HMAC de cada evento POST. |
| `GEMINI_API_KEY` | Habilita respuestas Gemini del agente comercial desde el servidor. |

## Plantillas que deben aprobarse en Meta

| Nombre sugerido | Variables de cuerpo | Uso en NexoPOS |
|---|---|---|
| `crm_bienvenida` | Nombre del cliente | Primer contacto de un lead. |
| `crm_estado_delivery` | Nombre del cliente, estado | Avisos de preparación, ruta o entrega. |
| `crm_fuera_horario` | Nombre del cliente, próximo horario | Respuesta fuera de horario. |
| `crm_asesor_humano` | Nombre del cliente | Derivación a un asesor humano. |

## Pasos de activación

1. Registrar los secretos del servidor mediante la configuración segura del proyecto.
2. Publicar una versión con URL HTTPS válida y copiar el endpoint indicado arriba.
3. En el panel de Meta, configurar Callback URL y Verify Token, y suscribirse al campo `messages`.
4. Enviar un evento de prueba desde Meta. NexoPOS solo responderá con éxito si la firma HMAC es válida.
5. Comprobar los eventos desde el endpoint interno de CRM y, finalmente, activar las plantillas aprobadas.

La configuración se mantiene pendiente de las credenciales del administrador; ningún secreto queda almacenado en la aplicación móvil.
