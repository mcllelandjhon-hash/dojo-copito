import { OrdersPage } from "./OrdersPage.js";

export function PurchasesPage() {
  return (
    <OrdersPage
      title="Compras"
      subtitle="Órdenes a proveedores. Al recibir ingresa el stock y se genera la factura por pagar."
      endpoint="/api/v1/purchases"
      partyEndpoint="/api/v1/suppliers"
      partyLabel="Proveedor"
      partyField="supplierId"
      priceField="costCents"
      actions={[
        { key: "receive", label: "Recibir", path: "receive" },
        { key: "cancel", label: "Cancelar", path: "cancel" },
      ]}
    />
  );
}
