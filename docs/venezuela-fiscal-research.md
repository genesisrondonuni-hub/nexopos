# Referencia de adaptación fiscal venezolana

> Estado: investigación de producto. Este documento no certifica cumplimiento ni sustituye la asesoría de un contador o asesor fiscal venezolano.

La Providencia Administrativa **SNAT/2024/000102**, publicada en la Gaceta Oficial N.° 43.032 del 19 de diciembre de 2024, regula la utilización de medios digitales para la emisión de facturas y otros documentos. Como referencia de diseño, sus artículos 17 a 19 contemplan autorización, integridad, autenticidad, trazabilidad, auditoría de emisiones/modificaciones/anulaciones, respaldo, contingencia, disponibilidad de consulta y conservación de documentos.

Para NexoPOS, esto implica que el módulo fiscal debe diferenciarse del comprobante operativo: no debe declarar una factura fiscal como emitida sin que el negocio haya configurado el modo autorizado, la imprenta digital y los demás requisitos aplicables. La sincronización planificada debe conservar un registro de auditoría inmutable y funcionar con cola de contingencia.

El portal del SENIAT indica que solo los **software homologados y versiones específicas** incluidos en su lista pueden emitir facturas y otros documentos fiscales bajo la Providencia SNAT/2024/000121. Por eso NexoPOS solo almacenará una ficha preparatoria del proveedor o imprenta elegida por el negocio, con su referencia de autorización y estado de verificación manual; no activará emisión, números de control ni credenciales hasta completar la validación oficial.

## Fuentes de consulta

1. [Providencia SNAT/2024/000102 — texto de consulta](https://docs.cachicamo.app/fiscal/providencia000102)
2. [Gaceta Oficial N.° 43.032 — referencia de publicación](https://finanzasdigital.com/gaceta-oficial-n-43-032-medios-digitales-emision-facturas/)
3. [SENIAT — software y versiones autorizadas](https://declaraciones.seniat.gob.ve/portal/page/portal/MANEJADOR_CONTENIDO_SENIAT/03TRIBUTOS/3-5.html)
4. [The Factory HKA Venezuela — información del proveedor](https://imprenta.thefactoryhka.com.ve/)
