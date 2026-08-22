# Referencias de integraciones

## Google Sheets privadas

La autorización prevista usa el flujo OAuth 2.0 de aplicación web, solicitando únicamente el alcance de solo lectura de Sheets. El servidor generará una URL de consentimiento con estado verificable, intercambiará el código devuelto por tokens y consultará un rango de la hoja mediante el endpoint oficial de valores.

- [OAuth 2.0 para aplicaciones web de Google](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Sheets API: spreadsheets.values.get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)

Las credenciales de cliente y los tokens se mantienen únicamente en el servidor; la aplicación móvil conserva solamente el identificador de hoja y el nombre de pestaña elegidos por el administrador.
