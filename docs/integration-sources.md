# Referencias verificadas para integraciones

## Meta WhatsApp Cloud API

La guía oficial de Meta indica que una aplicación con el caso de uso de WhatsApp debe vincular una cuenta de WhatsApp Business, disponer del identificador del número empresarial y utilizar un token de acceso. Para envíos de mensajes, Meta ilustra el endpoint `https://graph.facebook.com/v23.0/<PHONE_NUMBER_ID>/messages` con autenticación `Authorization: Bearer <SYSTEM_USER_ACCESS_TOKEN>`. También indica que los webhooks son necesarios para recibir notificaciones de estado como entregado o leído.

Fuente: [WhatsApp Cloud API Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started), consultada el 21 de agosto de 2026.

## Google Gemini API

La documentación oficial de Google AI señala que Gemini requiere una clave de API para autenticación y ofrece la operación `models.generateContent` para generar respuestas. NexoPOS utiliza la clave únicamente en el servidor y no la entrega al dispositivo móvil.

Fuentes: [Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key) y [Gemini API reference](https://ai.google.dev/api), consultadas el 21 de agosto de 2026.
