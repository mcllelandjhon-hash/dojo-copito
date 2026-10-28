import { OrdersPage } from "./OrdersPage.js";

export function SalesPage() {
  return (
    <OrdersPage
      title="Ventas"
      subtitle="Pedidos de clientes. Al confirmar se descuenta el stock y se genera la factura por cobrar."
      endpoint="/api/v1/sales"
      partyEndpoint="/api/v1/customers"
      partyLabel="Cliente"
      partyField="customerId"
      priceField="priceCents"
      actions={[
        { key: "confirm", label: "Confirmar", path: "confirm" },
        { key: "fulfill", label: "Entregar", path: "fulfill" },
        { key: "cancel", label: "Cancelar", path: "cancel" },
      ]}
    />
  );
}
