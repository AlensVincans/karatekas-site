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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailDate(value?: string) {
  const date = value ? new Date(value) : new Date();

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function paymentLabel(order: StoreOrder) {
  const labels: Record<StoreOrder["paymentMethod"], string> = {
    card: "Card / Montonio",
    invoice: "Invoice",
    defer15: "Invoice, 15 day deferred payment",
  };

  return labels[order.paymentMethod];
}

function statusPill(status: string) {
  const color = status === "paid" ? "#0f766e" : "#b45309";
  const background = status === "paid" ? "#e6fffa" : "#fff7ed";

  return `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${background};color:${color};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(status)}</span>`;
}

function shippingAddressText(order: StoreOrder) {
  const address = order.shippingAddress;

  if (!address) {
    return "";
  }

  return [
    address.name,
    address.companyName,
    address.streetAddress,
    [address.locality, address.region, address.postalCode].filter(Boolean).join(", "),
    address.country,
    address.phoneNumber
      ? `Phone: +${address.phoneCountryCode ?? ""} ${address.phoneNumber}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function detailsTable(rows: Array<[string, string]>) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows
        .filter(([, value]) => value)
        .map(
          ([label, value]) => `
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #eee7df;color:#776f67;font-size:13px;">${escapeHtml(label)}</td>
              <td align="right" style="padding:11px 0;border-bottom:1px solid #eee7df;color:#17120f;font-size:13px;font-weight:800;">${value}</td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

function orderLinesHtml(order: StoreOrder) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e3ded8;border-radius:14px;overflow:hidden;">
      <thead>
        <tr style="background:#f7f5f2;">
          <th align="left" style="padding:13px 14px;color:#17120f;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Product</th>
          <th align="center" style="padding:13px 10px;color:#17120f;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Qty</th>
          <th align="right" style="padding:13px 14px;color:#17120f;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.lines
          .map(
            (line) => `
              <tr>
                <td style="padding:14px;border-top:1px solid #eee7df;">
                  <div style="color:#17120f;font-size:14px;font-weight:800;line-height:1.35;">${escapeHtml(line.productName)}</div>
                  ${
                    line.variationName
                      ? `<div style="color:#776f67;font-size:13px;margin-top:3px;">${escapeHtml(line.variationName)}</div>`
                      : ""
                  }
                  ${
                    line.sku
                      ? `<div style="color:#a39b93;font-size:12px;margin-top:4px;">SKU ${escapeHtml(line.sku)}</div>`
                      : ""
                  }
                </td>
                <td align="center" style="padding:14px 10px;border-top:1px solid #eee7df;color:#17120f;font-size:14px;font-weight:800;">${line.quantity}</td>
                <td align="right" style="padding:14px;border-top:1px solid #eee7df;color:#17120f;font-size:14px;font-weight:900;">${money(line.total)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function totalsTable(order: StoreOrder) {
  return detailsTable([
    ["Subtotal", money(order.totals.subtotal)],
    ["PVN", money(order.totals.vat)],
    ["Shipping", money(order.totals.shipping)],
    ["Total", `<span style="font-size:18px;color:#ff6b00;">${money(order.totals.total)}</span>`],
  ]);
}

function emailShell(input: {
  title: string;
  eyebrow?: string;
  preheader: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  const cta = input.cta
    ? `
      <tr>
        <td style="padding:8px 0 26px;">
          <a href="${escapeHtml(input.cta.href)}" style="display:inline-block;background:#ff6b00;color:#ffffff;text-decoration:none;font-weight:900;font-size:14px;padding:14px 20px;border-radius:12px;">${escapeHtml(input.cta.label)}</a>
        </td>
      </tr>
    `
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f1ed;color:#17120f;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ed;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #e3ded8;box-shadow:0 22px 60px rgba(23,18,15,.12);">
            <tr>
              <td style="background:#050505;padding:24px 28px;color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-size:20px;font-weight:900;letter-spacing:-.02em;">Karatekas.eu</div>
                      <div style="color:#ff8a2a;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.16em;margin-top:4px;">Karate Equipment</div>
                    </td>
                    <td align="right">
                      <span style="display:inline-block;width:42px;height:42px;border-radius:14px;background:#ff6b00;color:#050505;text-align:center;line-height:42px;font-size:22px;font-weight:900;">K</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 10px;">
                ${
                  input.eyebrow
                    ? `<div style="color:#ff6b00;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.16em;margin-bottom:10px;">${escapeHtml(input.eyebrow)}</div>`
                    : ""
                }
                <h1 style="font-size:34px;line-height:1.05;margin:0;color:#17120f;letter-spacing:-.04em;">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            ${cta}
            <tr>
              <td style="padding:8px 28px 30px;">${input.body}</td>
            </tr>
            <tr>
              <td style="background:#f7f5f2;padding:18px 28px;color:#776f67;font-size:12px;line-height:1.6;">
                Karatekas.eu - premium karate equipment, Baltic delivery and secure checkout.<br />
                This email was sent automatically from info@karatekas.eu.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function orderEmailHtml(order: StoreOrder, audience: "admin" | "customer") {
  const isAdmin = audience === "admin";
  const title = isAdmin ? `New order ${order.id}` : `Order ${order.id} received`;
  const intro = isAdmin
    ? `You've received a new order from ${escapeHtml(order.customer.name)}.`
    : `Thank you, ${escapeHtml(order.customer.name)}. We received your order and attached the pavadzime/invoice PDF.`;
  const address = shippingAddressText(order);
  const details = detailsTable([
    ["Order", escapeHtml(order.id)],
    ["Invoice", escapeHtml(order.invoiceNumber ?? "-")],
    ["Date", escapeHtml(emailDate(order.createdAt))],
    ["Customer", escapeHtml(order.customer.name)],
    ["Email", `<a href="mailto:${escapeHtml(order.customer.email)}" style="color:#ff6b00;text-decoration:none;">${escapeHtml(order.customer.email)}</a>`],
    ["Company", escapeHtml(order.customer.company ?? "")],
    ["Payment", `${escapeHtml(paymentLabel(order))} ${statusPill(order.paymentStatus)}`],
    ["Delivery", escapeHtml(order.shippingMethodName)],
    ["Pickup point", escapeHtml(order.pickupPointName ?? "")],
    ["Shipping status", escapeHtml(order.shippingStatus)],
  ]);

  return emailShell({
    title,
    eyebrow: isAdmin ? "Admin notification" : "Order confirmation",
    preheader: isAdmin
      ? `New order ${order.id} for ${money(order.totals.total)}`
      : `Your Karatekas.eu order ${order.id} was received.`,
    body: `
      <p style="margin:0 0 22px;color:#4f4740;font-size:16px;line-height:1.65;">${intro}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 0 22px;">
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:18px;">
              <div style="color:#9a3412;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.14em;margin-bottom:8px;">Order summary</div>
              ${details}
            </div>
          </td>
        </tr>
      </table>
      <h2 style="font-size:18px;margin:4px 0 12px;color:#17120f;">Products</h2>
      ${orderLinesHtml(order)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
        <tr>
          <td width="50%" valign="top" style="padding-right:10px;">
            <div style="border:1px solid #e3ded8;border-radius:16px;padding:16px;">
              <div style="font-size:13px;color:#776f67;font-weight:900;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px;">Delivery</div>
              <div style="font-size:14px;color:#17120f;font-weight:800;line-height:1.55;">${escapeHtml(order.shippingMethodName)}</div>
              ${
                address
                  ? `<div style="white-space:pre-line;font-size:13px;color:#776f67;line-height:1.55;margin-top:8px;">${escapeHtml(address)}</div>`
                  : ""
              }
            </div>
          </td>
          <td width="50%" valign="top" style="padding-left:10px;">
            <div style="border:1px solid #e3ded8;border-radius:16px;padding:16px;">
              <div style="font-size:13px;color:#776f67;font-weight:900;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;">Totals</div>
              ${totalsTable(order)}
            </div>
          </td>
        </tr>
      </table>
    `,
  });
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
  const name = input.name || "Karatekas customer";
  const text = [
    `Hello ${name},`,
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
    html: emailShell({
      title: "Confirm your account",
      eyebrow: "Welcome to Karatekas.eu",
      preheader: "Confirm your Karatekas.eu account to finish registration.",
      cta: { href: input.confirmUrl, label: "Confirm account" },
      body: `
        <p style="margin:0 0 16px;color:#4f4740;font-size:16px;line-height:1.65;">Hello ${escapeHtml(name)},</p>
        <p style="margin:0 0 18px;color:#4f4740;font-size:16px;line-height:1.65;">Please confirm your Karatekas.eu account. After confirmation you can sign in, view your order history and use checkout faster.</p>
        <div style="background:#f7f5f2;border:1px solid #e3ded8;border-radius:16px;padding:16px;color:#776f67;font-size:13px;line-height:1.6;">
          If the button does not work, open this link in your browser:<br />
          <a href="${escapeHtml(input.confirmUrl)}" style="color:#ff6b00;word-break:break-all;">${escapeHtml(input.confirmUrl)}</a>
        </div>
        <p style="margin:18px 0 0;color:#776f67;font-size:13px;line-height:1.6;">If you did not create this account, you can safely ignore this email.</p>
      `,
    }),
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
      html: orderEmailHtml(order, "customer"),
      attachments: [attachment],
    }),
    sendMail({
      to: adminEmail(),
      subject: `New order ${order.id} - ${money(order.totals.total)}`,
      text: adminText,
      html: orderEmailHtml(order, "admin"),
      attachments: [attachment],
    }),
  ]);
}

export async function sendB2BUnpaidInvoiceReminder(order: StoreOrder) {
  if (order.paymentStatus === "paid" || order.paymentMethod === "card") {
    return null;
  }

  const subject = `Payment reminder: ${order.invoiceNumber ?? order.id}`;
  const text = [
      `Hello ${order.customer.name},`,
      "",
      `This is a reminder that invoice ${order.invoiceNumber ?? order.id} is unpaid.`,
      `Amount due: ${money(order.totals.total)}`,
      "",
      "The pavadzime/invoice PDF is attached.",
    ].join("\n");

  return sendMail({
    to: order.customer.email,
    subject,
    text,
    html: emailShell({
      title: "Payment reminder",
      eyebrow: "B2B invoice",
      preheader: `Invoice ${order.invoiceNumber ?? order.id} is still unpaid.`,
      body: `
        <p style="margin:0 0 18px;color:#4f4740;font-size:16px;line-height:1.65;">Hello ${escapeHtml(order.customer.name)},</p>
        <p style="margin:0 0 20px;color:#4f4740;font-size:16px;line-height:1.65;">This is a friendly reminder that invoice <strong>${escapeHtml(order.invoiceNumber ?? order.id)}</strong> is still unpaid.</p>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:18px;margin-bottom:18px;">
          ${detailsTable([
            ["Invoice", escapeHtml(order.invoiceNumber ?? order.id)],
            ["Order", escapeHtml(order.id)],
            ["Amount due", `<span style="font-size:18px;color:#ff6b00;">${money(order.totals.total)}</span>`],
            ["Due date", escapeHtml(order.invoiceDueAt ? emailDate(order.invoiceDueAt) : "-")],
          ])}
        </div>
        <p style="margin:0;color:#776f67;font-size:13px;line-height:1.6;">The pavadzime/invoice PDF is attached to this email.</p>
      `,
    }),
    attachments: [invoiceAttachment(order)],
  });
}

export async function sendTestEmail(to = adminEmail()) {
  return sendMail({
    to,
    subject: "Karatekas.eu SMTP test",
    text: "Titan SMTP email sending is configured and working.",
    html: emailShell({
      title: "SMTP test successful",
      eyebrow: "Email system",
      preheader: "Titan SMTP email sending is configured and working.",
      body: `
        <p style="margin:0;color:#4f4740;font-size:16px;line-height:1.65;">Titan SMTP email sending is configured and working. Future order, invoice and account emails will use this Karatekas.eu template.</p>
      `,
    }),
  });
}
