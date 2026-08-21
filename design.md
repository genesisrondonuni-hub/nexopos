# Diseño de interfaz — NexoPOS

## Principios de experiencia

NexoPOS se diseña para uso operativo en **orientación vertical 9:16**, priorizando acciones frecuentes al alcance del pulgar y una lectura rápida durante el servicio. La interfaz aplica patrones de iOS: jerarquía tipográfica clara, áreas táctiles amplias, navegación mediante pestañas para los módulos principales y hojas modales para las acciones de alta concentración, como el cobro. Se utilizará un tono visual sobrio y confiable, adecuado tanto para un restaurante como para una pequeña empresa de comercio.

## Pantallas

| Pantalla | Contenido principal | Funcionalidad clave |
|---|---|---|
| Resumen | Indicadores de ventas, gastos, utilidad y actividad reciente | Consultar el estado diario y entrar rápidamente al POS o a los pedidos |
| Punto de venta | Buscador, categorías, cuadrícula de productos y cuenta actual | Añadir productos o venta libre, ajustar cantidades, registrar pagos divididos y cerrar la venta |
| Cobro | Total, pagos por método, propina, monto recibido y cambio | Validar que los pagos sumen el total y confirmar la transacción |
| Inventario | Stock disponible, precio, costo, categoría y estado de catálogo | Consultar productos, cambiar visibilidad y revisar alertas de existencias bajas |
| Pedidos | Lista filtrable por estado: pendientes, en proceso, pagados y archivados | Actualizar el estado de una orden y revisar su entrega o recogida |
| Detalle de pedido | Cliente, productos, total, método de entrega y estado | Revisar el pedido y avanzar su ciclo de atención |
| Ajustes | Resumen del negocio, caja activa y accesos administrativos | Centralizar futuras opciones de negocio, empleados y facturación |
| Catálogo público | Encabezado del negocio, buscador, categorías y productos visibles | Permitir al cliente descubrir el menú sin iniciar sesión |
| Carrito público | Productos seleccionados, cantidades, subtotal y total | Ajustar el pedido antes de solicitar entrega o recogida |
| Confirmación de pedido | Nombre, teléfono, modalidad de entrega y dirección opcional | Crear un mensaje estructurado y abrir WhatsApp con el pedido listo para enviar |

## Flujos principales

El flujo de venta comienza en **Punto de venta**. La persona cajera busca o selecciona un artículo, lo añade a la cuenta, opcionalmente agrega una venta libre y toca **Cobrar**. En la hoja de cobro puede distribuir el total entre efectivo y tarjeta, ingresar una propina y verificar el cambio antes de confirmar. Al completarse, la aplicación actualiza el resumen del día, registra el movimiento y reduce el inventario de los productos vendidos.

El flujo de pedidos inicia en **Pedidos**, donde la persona usuaria selecciona una orden pendiente. En el detalle puede moverla a *En proceso*, *Pagado* o *Archivado*, manteniendo un historial operativo comprensible. En una siguiente iteración, estas mismas órdenes podrán originarse desde el catálogo virtual y generar el mensaje estructurado para WhatsApp.

El flujo público se inicia desde una URL compartible del catálogo. La persona cliente explora únicamente los productos habilitados, agrega artículos al carrito y ajusta sus cantidades. Al continuar, completa su nombre, teléfono y método de entrega; si selecciona domicilio, se solicita una dirección. La acción final genera un mensaje legible con el detalle, total, modalidad de entrega y datos de contacto, y abre la conversación de WhatsApp del negocio. El pedido se registra en el estado local como *Pendiente* antes de la redirección, de manera que el personal puede atenderlo desde el módulo de pedidos.

## Paleta y estilo visual

| Elemento | Color | Uso |
|---|---|---|
| Carbón Nexo | `#17211F` | Texto principal, iconografía y fondos oscuros de navegación |
| Verde cocina | `#197B63` | Acciones principales, ventas confirmadas y elementos activos |
| Menta suave | `#DDF4EA` | Fondos de indicadores positivos y etiquetas de éxito |
| Arena | `#F6F3EE` | Fondo general cálido, que reduce la fatiga visual durante turnos largos |
| Coral | `#D65A45` | Alertas de inventario y acciones de eliminación |
| Oro | `#D99A22` | Propinas, avisos y estados pendientes |

La tipografía nativa mantiene una presentación clara y compacta. Las superficies utilizan tarjetas blancas de radio medio, separadas por espacios consistentes. Los números financieros se muestran con suficiente tamaño y contraste, mientras que los estados se distinguen con etiquetas de color acompañadas por texto, para no depender solo del color.
