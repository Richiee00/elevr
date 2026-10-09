# Dashboard de ventas Shopify

Genera un dashboard HTML autónomo a partir del export de pedidos de Shopify
(`Orders → Export`, CSV separado por `;`).

```bash
python3 build_dashboard.py orders_export.csv dashboard.html
```

Abre `dashboard.html` en el navegador. Contiene solo agregados por pedido y línea
(fecha de pago, país, importes, producto, unidades); no incluye emails ni direcciones.
El HTML generado y los CSV están en `.gitignore` porque contienen datos del negocio.

Secciones: evolución general, productos y estacionalidad, finanzas (envíos, impuestos,
descuentos, reembolsos), países, comparación estacional entre años, y calidad/metodología.
