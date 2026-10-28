import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@copito.local" },
    create: { name: "Administradora Copito", email: "admin@copito.local", passwordHash, role: "ADMIN" },
    // No se toca update: si el admin ya existe, su contraseña actual se respeta
    // (la semilla puede correr en cada arranque sin revertir cambios).
    update: {},
  });
  await prisma.user.upsert({
    where: { email: "ventas@copito.local" },
    create: { name: "Valeria Ventas", email: "ventas@copito.local", passwordHash: await bcrypt.hash("Ventas123!", 10), role: "SALES" },
    update: {},
  });

  await prisma.companySettings.upsert({
    where: { id: "default" },
    create: { id: "default", legalName: "Copito Comercial S.A.C.", tradeName: "Copito", taxId: "20601010101", email: "hola@copito.local", currency: "PEN", taxRateBps: 1800 },
    update: {},
  });

  const [catGeneral, catOficina] = await Promise.all([
    prisma.category.upsert({ where: { name: "General" }, create: { name: "General" }, update: {} }),
    prisma.category.upsert({ where: { name: "Oficina" }, create: { name: "Oficina" }, update: {} }),
  ]);

  const productData = [
    { sku: "SRV-001", name: "Servicio de consultoría (hora)", costCents: 5000, priceCents: 12000, stock: 40, minStock: 5, categoryId: catGeneral.id },
    { sku: "PAP-010", name: "Papel bond A4 (paquete)", costCents: 1200, priceCents: 2200, stock: 120, minStock: 20, categoryId: catOficina.id },
    { sku: "TEC-100", name: "Teclado inalámbrico", costCents: 4500, priceCents: 8900, stock: 15, minStock: 5, categoryId: catOficina.id },
    { sku: "TEC-200", name: "Mouse ergonómico", costCents: 2800, priceCents: 5900, stock: 4, minStock: 8, categoryId: catOficina.id },
  ];
  for (const data of productData) {
    await prisma.product.upsert({ where: { sku: data.sku }, create: data, update: data });
  }

  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    create: { id: "seed-customer-1", name: "Cliente Demo S.A.C.", taxId: "20505050505", email: "compras@clientedemo.pe", phone: "+51 999 888 777", address: "Av. Ejemplo 123, Lima" },
    update: {},
  });
  await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    create: { id: "seed-supplier-1", name: "Proveedor Demo S.R.L.", taxId: "20404040404", email: "ventas@proveedordemo.pe", phone: "+51 988 777 666" },
    update: {},
  });

  const dept = await prisma.department.upsert({ where: { name: "Administración" }, create: { name: "Administración" }, update: {} });
  await prisma.department.upsert({ where: { name: "Ventas" }, create: { name: "Ventas" }, update: {} });
  await prisma.employee.upsert({
    where: { email: "ana@copito.local" },
    create: { firstName: "Ana", lastName: "Torres", email: "ana@copito.local", position: "Gerente general", departmentId: dept.id, salaryCents: 650000 },
    update: {},
  });

  // SQLite no admite skipDuplicates en createMany: solo se siembra si está vacío.
  if ((await prisma.financeTransaction.count()) === 0) {
    await prisma.financeTransaction.createMany({
      data: [
        { type: "INCOME", category: "Otros ingresos", description: "Ingreso inicial de demostración", amountCents: 150000 },
        { type: "EXPENSE", category: "Oficina", description: "Útiles de oficina", amountCents: 25000 },
      ],
    });
  }

  console.log("Seed completado.");
  console.log("Admin:  admin@copito.local / Admin123!");
  console.log("Ventas: ventas@copito.local / Ventas123!");
  void customer;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
