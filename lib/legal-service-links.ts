export const legalServiceLinks = [
  { slug: "delivery-information", title: "Delivery Information" },
  { slug: "payments", title: "Payments" },
  { slug: "return-of-goods", title: "Return of Goods" },
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "gdpr", title: "GDPR" },
  { slug: "cookies", title: "Cookies" },
] as const;

export type LegalPageSlug = (typeof legalServiceLinks)[number]["slug"];
