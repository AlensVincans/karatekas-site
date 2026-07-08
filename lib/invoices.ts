import type { StoreOrder } from "./orders";

type SellerDetails = {
  name: string;
  registrationNumber: string;
  vatNumber: string;
  address: string;
  email: string;
  bank: string;
  iban: string;
  swift: string;
};

function envText(name: string, fallback: string) {
  const value = process.env[name]?.trim();

  return value || fallback;
}

function sellerDetails(): SellerDetails {
  return {
    name: envText("INVOICE_SELLER_NAME", "BBK AUTO, SIA"),
    registrationNumber: envText("INVOICE_SELLER_REG_NO", "40003924244"),
    vatNumber: envText("INVOICE_SELLER_VAT_NO", "LV40003924244"),
    address: envText("INVOICE_SELLER_ADDRESS", "Riga, Ilukstes iela 103 k-3 - 29, LV-1082"),
    email: envText("INVOICE_SELLER_EMAIL", "info@karatekas.eu"),
    bank: envText("INVOICE_SELLER_BANK", ""),
    iban: envText("INVOICE_SELLER_IBAN", ""),
    swift: envText("INVOICE_SELLER_SWIFT", ""),
  };
}

function ascii(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: unknown) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(value: number) {
  return `${value.toFixed(2)} EUR`;
}

function date(value?: string) {
  const parsed = value ? new Date(value) : new Date();

  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function buyerAddress(order: StoreOrder) {
  const address = order.shippingAddress;

  return [
    address?.streetAddress,
    address?.locality,
    address?.postalCode,
    address?.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function pdfLine(x: number, y: number, text: unknown, size = 10) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET\n`;
}

function pdfRow(y: number, values: Array<[number, unknown, number?]>) {
  return values.map(([x, text, size]) => pdfLine(x, y, text, size ?? 9)).join("");
}

function pdfDocument(content: string) {
  const objects = [
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}endstream`,
    "<< /Type /Page /Parent 4 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 1 0 R >> >> /Contents 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Catalog /Pages 4 0 R >>",
  ];
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 5 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return Buffer.from(chunks.join(""), "utf8");
}

export function buildInvoicePdf(order: StoreOrder) {
  const seller = sellerDetails();
  const invoiceNumber = order.invoiceNumber ?? order.id;
  let content = "";
  let y = 800;

  content += pdfLine(46, y, "TAX INVOICE / PVN REKINS", 18);
  content += pdfLine(410, y, `No. ${invoiceNumber}`, 12);
  y -= 24;
  content += pdfLine(46, y, `Issued: ${date(order.invoiceIssuedAt || order.createdAt)}`);
  content += pdfLine(240, y, `Due: ${date(order.invoiceDueAt || order.createdAt)}`);
  content += pdfLine(410, y, `Order: ${order.id}`);
  y -= 28;

  content += pdfLine(46, y, "Seller", 12);
  content += pdfLine(310, y, "Buyer", 12);
  y -= 16;
  content += pdfLine(46, y, seller.name);
  content += pdfLine(310, y, order.customer.company || order.customer.name);
  y -= 14;
  content += pdfLine(46, y, `Reg. No.: ${seller.registrationNumber}`);
  content += pdfLine(310, y, `Email: ${order.customer.email}`);
  y -= 14;
  content += pdfLine(46, y, `VAT No.: ${seller.vatNumber}`);
  content += pdfLine(310, y, buyerAddress(order) || "Address not provided");
  y -= 14;
  content += pdfLine(46, y, seller.address);
  content += pdfLine(310, y, order.pickupPointName ? `Pickup: ${order.pickupPointName}` : "");
  y -= 14;
  content += pdfLine(46, y, seller.email);
  y -= 24;

  if (seller.iban || seller.bank) {
    content += pdfLine(
      46,
      y,
      `Bank: ${seller.bank || "-"}  IBAN: ${seller.iban || "-"}  SWIFT: ${seller.swift || "-"}`,
    );
    y -= 22;
  }

  content += pdfRow(y, [
    [46, "Item", 10],
    [302, "Qty", 10],
    [344, "Unit net", 10],
    [420, "VAT", 10],
    [488, "Total net", 10],
  ]);
  y -= 10;
  content += `0.5 w 46 ${y + 6} m 548 ${y + 6} l S\n`;
  y -= 10;

  order.lines.slice(0, 24).forEach((line) => {
    const name = [line.productName, line.variationName, line.sku]
      .filter(Boolean)
      .join(" / ")
      .slice(0, 58);
    const lineVat = order.noVat ? "0%" : "21%";

    content += pdfRow(y, [
      [46, name],
      [304, line.quantity],
      [344, money(line.unitPrice)],
      [420, lineVat],
      [488, money(line.total)],
    ]);
    y -= 15;
  });

  if (order.shippingPrice > 0) {
    content += pdfRow(y, [
      [46, `Delivery: ${order.shippingMethodName}`],
      [304, 1],
      [344, money(order.shippingPrice)],
      [420, order.noVat ? "0%" : "21%"],
      [488, money(order.shippingPrice)],
    ]);
    y -= 15;
  }

  y -= 12;
  content += pdfLine(344, y, "Subtotal net");
  content += pdfLine(488, y, money(order.totals.subtotal + order.totals.shipping));
  y -= 16;
  content += pdfLine(344, y, order.noVat ? "VAT 0%" : "VAT 21%");
  content += pdfLine(488, y, money(order.totals.vat));
  y -= 18;
  content += pdfLine(344, y, "Total payable", 12);
  content += pdfLine(488, y, money(order.totals.total), 12);
  y -= 26;

  content += pdfLine(46, y, `Payment method: ${order.paymentMethod}`);
  y -= 14;
  content += pdfLine(46, y, `Delivery method: ${order.shippingMethodName}`);
  y -= 14;
  content += pdfLine(46, y, `Currency: ${order.totals.currency}`);
  y -= 18;

  if (order.noVat) {
    content += pdfLine(
      46,
      y,
      "Invoice issued without VAT. Add legal VAT exemption reference in seller settings if required.",
    );
  }

  content += pdfLine(
    46,
    38,
    "Rekins ir sagatavots elektroniski un ir derigs bez paraksta.",
    9,
  );

  return pdfDocument(content);
}
