import type { Language } from "./i18n";

export const legalServiceLinks = [
  { slug: "delivery-information", title: "Delivery Information" },
  { slug: "payments", title: "Payments" },
  { slug: "return-of-goods", title: "Return of Goods" },
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "gdpr", title: "GDPR" },
  { slug: "cookies", title: "Cookies" },
] as const;

export type LegalPageSlug = (typeof legalServiceLinks)[number]["slug"];

export const legalServiceTitles: Record<Language, Record<LegalPageSlug, string>> = {
  ru: {
    "delivery-information": "Информация о доставке",
    payments: "Оплата",
    "return-of-goods": "Возврат товара",
    "privacy-policy": "Политика конфиденциальности",
    gdpr: "GDPR",
    cookies: "Cookies",
  },
  lv: {
    "delivery-information": "Piegādes informācija",
    payments: "Apmaksa",
    "return-of-goods": "Preču atgriešana",
    "privacy-policy": "Privātuma politika",
    gdpr: "GDPR",
    cookies: "Sīkdatnes",
  },
  en: {
    "delivery-information": "Delivery Information",
    payments: "Payments",
    "return-of-goods": "Return of Goods",
    "privacy-policy": "Privacy Policy",
    gdpr: "GDPR",
    cookies: "Cookies",
  },
  et: {
    "delivery-information": "Tarneinfo",
    payments: "Maksed",
    "return-of-goods": "Kauba tagastamine",
    "privacy-policy": "Privaatsuspoliitika",
    gdpr: "GDPR",
    cookies: "Küpsised",
  },
  lt: {
    "delivery-information": "Pristatymo informacija",
    payments: "Apmokėjimas",
    "return-of-goods": "Prekių grąžinimas",
    "privacy-policy": "Privatumo politika",
    gdpr: "GDPR",
    cookies: "Slapukai",
  },
};

export function legalServiceTitle(slug: LegalPageSlug, language: Language) {
  return legalServiceTitles[language]?.[slug] ?? legalServiceTitles.en[slug];
}
