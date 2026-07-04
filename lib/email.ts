import nodemailer, { type SendMailOptions } from "nodemailer";
import { buildInvoicePdf } from "./invoices";
import type { StoreOrder } from "./orders";

type MailAttachment = NonNullable<SendMailOptions["attachments"]>[number];

function envText(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function envBool(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

export function smtpConfigured() {
  return Boolean(envText("SMTP_HOST") && envText("SMTP_USER") && envText("SMTP_PASS"));
}

function smtpTransport() {
  if (!smtpConfigured()) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host: envText("SMTP_HOST", "smtp.titan.email"),
    port: Number(envText("SMTP_PORT", "465")) || 465,
    secure: envBool("SMTP_SECURE", true),
    auth: {
      user: envText("SMTP_USER"),
      pass: envText("SMTP_PASS"),
    },
  });
}

function mailFrom() {
  return envText("SMTP_FROM", envText("SMTP_USER", "info@karatekas.eu"));
}

function adminEmail() {
  return envText("ADMIN_ORDER_EMAIL", mailFrom());
}

function money(value: number) {
  return `${value.toFixed(2)} EUR`;
}

function orderLinesText(order: StoreOrder) {
  return order.lines
    .map(
      (line) =>
        `${line.quantity} x ${line.productName}${line.variationName ? ` / ${line.variationName}` : ""} = ${money(line.total)}`,
    )
    .join("\n");
}

function orderSummary(order: StoreOrder) {
  return [
    `Order: ${order.id}`,
    `Invoice: ${order.invoiceNumber ?? "-"}`,
    `Customer: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    order.customer.company ? `Company: ${order.customer.company}` : "",
    `Payment: ${order.paymentMethod} (${order.paymentStatus})`,
    `Delivery: ${order.shippingMethodName}`,
    order.pickupPointName ? `Pickup point: ${order.pickupPointName}` : "",
    `Subtotal: ${money(order.totals.subtotal)}`,
    `PVN: ${money(order.totals.vat)}`,
    `Shipping: ${money(order.totals.shipping)}`,
    `Total: ${money(order.totals.total)}`,
    "",
    orderLinesText(order),
  ]
    .filter(Boolean)
    .join("\n");
}

function invoiceAttachment(order: StoreOrder): MailAttachment {
  return {
    filename: `${order.invoiceNumber ?? order.id}-pavadzime.pdf`,
    content: buildInvoicePdf(order),
    contentType: "application/pdf",
  };
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
}) {
  const transport = smtpTransport();

  return transport.sendMail({
    from: mailFrom(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
}

export async function sendEmailConfirmation(input: {
  to: string;
  name: string;
  confirmUrl: string;
}) {
  const text = [
    `Hello ${input.name || "Karatekas customer"},`,
    "",
    "Please confirm your Karatekas.eu account by opening this link:",
    input.confirmUrl,
    "",
    "If you did not create this account, ignore this email.",
  ].join("\n");

  return sendMail({
    to: input.to,
    subject: "Confirm your Karatekas.eu account",
    text,
    html: `<p>Hello ${input.name || "Karatekas customer"},</p><p>Please confirm your Karatekas.eu account:</p><p><a href="${input.confirmUrl}">Confirm account</a></p>`,
  });
}

export async function sendOrderEmails(order: StoreOrder) {
  const attachment = invoiceAttachment(order);
  const customerText = [
    `Hello ${order.customer.name},`,
    "",
    "Thank you for your order at Karatekas.eu.",
    "Your order information and pavadzime/invoice PDF are attached.",
    "",
    orderSummary(order),
  ].join("\n");

  const adminText = [
    "New Karatekas.eu order received.",
    "",
    orderSummary(order),
  ].join("\n");

  await Promise.all([
    sendMail({
      to: order.customer.email,
      subject: `Karatekas.eu order ${order.id}`,
      text: customerText,
      attachments: [attachment],
    }),
    sendMail({
      to: adminEmail(),
      subject: `New order ${order.id} - ${money(order.totals.total)}`,
      text: adminText,
      attachments: [attachment],
    }),
  ]);
}

export async function sendB2BUnpaidInvoiceReminder(order: StoreOrder) {
  if (order.paymentStatus === "paid" || order.paymentMethod === "card") {
    return null;
  }

  return sendMail({
    to: order.customer.email,
    subject: `Payment reminder: ${order.invoiceNumber ?? order.id}`,
    text: [
      `Hello ${order.customer.name},`,
      "",
      `This is a reminder that invoice ${order.invoiceNumber ?? order.id} is unpaid.`,
      `Amount due: ${money(order.totals.total)}`,
      "",
      "The pavadzime/invoice PDF is attached.",
    ].join("\n"),
    attachments: [invoiceAttachment(order)],
  });
}

export async function sendTestEmail(to = adminEmail()) {
  return sendMail({
    to,
    subject: "Karatekas.eu SMTP test",
    text: "Titan SMTP email sending is configured and working.",
  });
}
