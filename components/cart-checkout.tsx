"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { pricedVariation } from "../lib/pricing";
import type { PaymentMethod, Product } from "../lib/store-data";
import { availableStock, useInventoryLevels } from "../lib/inventory-client";
import { applyPromoPrice, usePromoPrices, usePromoRules } from "../lib/promotions";
import { productTitle, type Language } from "../lib/i18n";
import { productImages, useProductImages } from "../lib/product-media";
import { readCartLines, writeCartLines, type CartLine } from "../lib/cart-client";
import {
  isSelfPickupShippingType,
  oversizedOrderLine,
} from "../lib/oversized-shipping";
import { useLanguage } from "./language";
import { useDemoSession } from "./session";

type ShippingType =
  | "parcel_machine"
  | "parcel_shop"
  | "post_office"
  | "courier"
  | "self_pickup";
type DeliveryCountry =
  | "LV"
  | "LT"
  | "EE"
  | "AT"
  | "BE"
  | "BG"
  | "HR"
  | "CY"
  | "CZ"
  | "DK"
  | "FI"
  | "FR"
  | "DE"
  | "GR"
  | "HU"
  | "IE"
  | "IT"
  | "LU"
  | "MT"
  | "NL"
  | "PL"
  | "PT"
  | "RO"
  | "SK"
  | "SI"
  | "ES"
  | "SE";
type SelectedDeliveryCountry = "" | DeliveryCountry;
const defaultDeliveryCountry: DeliveryCountry = "LV";
const montonioInternationalName = "Montonio International Shipping";

type ShippingMethodOption = {
  id: string;
  carrier: string;
  carrierCode: string;
  carrierName: string;
  name: string;
  type: "pickupPoint" | "courier" | "selfPickup";
  shippingType: ShippingType;
  subtype?: string;
  serviceId?: string;
  price: number;
  currency: "EUR";
  available: boolean;
};

type PickupPoint = {
  id: string;
  name: string;
  type: string;
  streetAddress?: string;
  locality?: string;
  postalCode?: string;
  carrierCode: string;
  countryCode: string;
};

type ShippingAddress = {
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
  phoneCountryCode: string;
  phoneNumber: string;
};

const pendingMontonioOrderKey = "kg_pending_montonio_order";

type PendingMontonioOrder = {
  orderId?: string;
  merchantReference?: string;
};

async function cancelPendingMontonioOrder() {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.sessionStorage.getItem(pendingMontonioOrderKey);

  if (!raw) {
    return false;
  }

  let pending: PendingMontonioOrder;

  try {
    pending = JSON.parse(raw) as PendingMontonioOrder;
  } catch {
    window.sessionStorage.removeItem(pendingMontonioOrderKey);
    return false;
  }

  if (!pending.orderId || !pending.merchantReference) {
    window.sessionStorage.removeItem(pendingMontonioOrderKey);
    return false;
  }

  try {
    const response = await fetch("/api/montonio/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: pending.orderId,
        merchantReference: pending.merchantReference,
      }),
    });

    if (response.ok) {
      window.sessionStorage.removeItem(pendingMontonioOrderKey);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

const baseFallbackShippingMethods: ShippingMethodOption[] = [
  {
    id: "self-pickup-riga",
    carrier: "self",
    carrierCode: "self",
    carrierName: "Karatekas",
    name: "Pick up from store",
    type: "selfPickup",
    shippingType: "self_pickup",
    subtype: "selfPickup",
    price: 0,
    currency: "EUR",
    available: true,
  },
  {
    id: "omniva-parcel-machine",
    carrier: "omniva",
    carrierCode: "omniva",
    carrierName: "Omniva",
    name: "Omniva parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 2.2,
    currency: "EUR",
    available: true,
  },
  {
    id: "dpd-parcel-machine",
    carrier: "dpd",
    carrierCode: "dpd",
    carrierName: "DPD",
    name: "DPD parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 2.09,
    currency: "EUR",
    available: true,
  },
  {
    id: "smartposti-parcel-machine",
    carrier: "smartposti",
    carrierCode: "smartposti",
    carrierName: "Smartposti",
    name: "Smartposti parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 1.95,
    currency: "EUR",
    available: true,
  },
  {
    id: "unisend-parcel-machine",
    carrier: "unisend",
    carrierCode: "unisend",
    carrierName: "Unisend",
    name: "Unisend parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 1.99,
    currency: "EUR",
    available: true,
  },
  {
    id: "latvijas-pasts-post-office",
    carrier: "latvijas_pasts",
    carrierCode: "latvijas_pasts",
    carrierName: "Latvijas Pasts",
    name: "Latvijas Pasts",
    type: "pickupPoint",
    shippingType: "post_office",
    subtype: "postOffice",
    price: 1.99,
    currency: "EUR",
    available: true,
  },
  {
    id: "dpd-courier-standard",
    carrier: "dpd",
    carrierCode: "dpd",
    carrierName: "Courier",
    name: "Courier delivery",
    type: "courier",
    shippingType: "courier",
    subtype: "standard",
    price: 6.38,
    currency: "EUR",
    available: true,
  },
  {
    id: "dpd-courier-standard-international",
    carrier: "montonio_international",
    carrierCode: "dpd",
    carrierName: "Montonio",
    name: montonioInternationalName,
    type: "courier",
    shippingType: "courier",
    subtype: "international",
    price: 8.5,
    currency: "EUR",
    available: true,
  },
];

const manualShippingPrices: Partial<Record<DeliveryCountry, Record<string, number>>> = {
  LV: {
    "self:self_pickup": 0,
    "omniva:parcel_machine": 2.2,
    "dpd:parcel_machine": 2.09,
    "smartposti:parcel_machine": 1.95,
    "unisend:parcel_machine": 1.99,
    "latvijas_pasts:parcel_machine": 1.99,
    "latvijas_pasts:post_office": 1.99,
    "dpd:courier": 6.38,
  },
  LT: {
    "self:self_pickup": 0,
    "omniva:parcel_machine": 4,
    "dpd:parcel_machine": 4.5,
    "smartposti:parcel_machine": 3.95,
    "unisend:parcel_machine": 3,
    "latvijas_pasts:parcel_machine": 4,
    "latvijas_pasts:post_office": 4,
    "dpd:courier": 5.5,
  },
  EE: {
    "self:self_pickup": 0,
    "omniva:parcel_machine": 4,
    "dpd:parcel_machine": 4.5,
    "smartposti:parcel_machine": 3.95,
    "unisend:parcel_machine": 3,
    "latvijas_pasts:parcel_machine": 4,
    "latvijas_pasts:post_office": 4,
    "dpd:courier": 5.5,
  },
};

const balticDeliveryCountries = new Set<DeliveryCountry>(["LV", "LT", "EE"]);

function isBalticDeliveryCountry(country: DeliveryCountry) {
  return balticDeliveryCountries.has(country);
}

function isMontonioInternationalMethod(method: Pick<ShippingMethodOption, "id" | "carrier" | "name">) {
  return (
    method.id.includes("international") ||
    method.carrier === "montonio_international" ||
    method.name.toLowerCase().includes("montonio international")
  );
}

function fallbackShippingMethods(country: DeliveryCountry) {
  const defaultPrices = manualShippingPrices[defaultDeliveryCountry] ?? {};
  const prices = manualShippingPrices[country] ?? defaultPrices;
  const availableMethods = isBalticDeliveryCountry(country)
    ? baseFallbackShippingMethods.filter((method) => !isMontonioInternationalMethod(method))
    : baseFallbackShippingMethods.filter(
        (method) =>
          method.shippingType === "self_pickup" ||
          isMontonioInternationalMethod(method),
      );

  return availableMethods.map((method) => ({
    ...method,
    price:
      prices[`${method.carrierCode}:${method.shippingType}`] ??
      defaultPrices[`${method.carrierCode}:${method.shippingType}`] ??
      method.price,
  }));
}

function effectiveDeliveryCountry(country: SelectedDeliveryCountry): DeliveryCountry {
  return country || defaultDeliveryCountry;
}

function shippingMethodMatches(
  preferred: ShippingMethodOption,
  candidate: ShippingMethodOption,
) {
  return (
    candidate.carrierCode === preferred.carrierCode &&
    candidate.shippingType === preferred.shippingType &&
    (!preferred.subtype || !candidate.subtype || candidate.subtype === preferred.subtype)
  );
}

function preferredShippingMethodId(
  currentId: string,
  previousMethods: ShippingMethodOption[],
  nextMethods: ShippingMethodOption[],
) {
  const exact = nextMethods.find((method) => method.id === currentId);

  if (exact) {
    return exact.id;
  }

  const preferred = previousMethods.find((method) => method.id === currentId);
  const matching = preferred
    ? nextMethods.find((method) => shippingMethodMatches(preferred, method))
    : undefined;

  return matching?.id ?? nextMethods[0]?.id ?? currentId;
}

const deliveryCountries: Array<{
  code: DeliveryCountry;
  name: string;
  phoneCode: string;
  locality: string;
  region: string;
}> = [
  { code: "LV", name: "Latvia", phoneCode: "371", locality: "Riga", region: "Riga" },
  { code: "LT", name: "Lithuania", phoneCode: "370", locality: "Vilnius", region: "Vilnius" },
  { code: "EE", name: "Estonia", phoneCode: "372", locality: "Tallinn", region: "Harju" },
  { code: "AT", name: "Austria", phoneCode: "43", locality: "Vienna", region: "Vienna" },
  { code: "BE", name: "Belgium", phoneCode: "32", locality: "Brussels", region: "Brussels" },
  { code: "BG", name: "Bulgaria", phoneCode: "359", locality: "Sofia", region: "Sofia" },
  { code: "HR", name: "Croatia", phoneCode: "385", locality: "Zagreb", region: "Zagreb" },
  { code: "CY", name: "Cyprus", phoneCode: "357", locality: "Nicosia", region: "Nicosia" },
  { code: "CZ", name: "Czechia", phoneCode: "420", locality: "Prague", region: "Prague" },
  { code: "DK", name: "Denmark", phoneCode: "45", locality: "Copenhagen", region: "Capital Region" },
  { code: "FI", name: "Finland", phoneCode: "358", locality: "Helsinki", region: "Uusimaa" },
  { code: "FR", name: "France", phoneCode: "33", locality: "Paris", region: "Ile-de-France" },
  { code: "DE", name: "Germany", phoneCode: "49", locality: "Berlin", region: "Berlin" },
  { code: "GR", name: "Greece", phoneCode: "30", locality: "Athens", region: "Attica" },
  { code: "HU", name: "Hungary", phoneCode: "36", locality: "Budapest", region: "Budapest" },
  { code: "IE", name: "Ireland", phoneCode: "353", locality: "Dublin", region: "Leinster" },
  { code: "IT", name: "Italy", phoneCode: "39", locality: "Rome", region: "Lazio" },
  { code: "LU", name: "Luxembourg", phoneCode: "352", locality: "Luxembourg", region: "Luxembourg" },
  { code: "MT", name: "Malta", phoneCode: "356", locality: "Valletta", region: "Valletta" },
  { code: "NL", name: "Netherlands", phoneCode: "31", locality: "Amsterdam", region: "North Holland" },
  { code: "PL", name: "Poland", phoneCode: "48", locality: "Warsaw", region: "Masovian" },
  { code: "PT", name: "Portugal", phoneCode: "351", locality: "Lisbon", region: "Lisbon" },
  { code: "RO", name: "Romania", phoneCode: "40", locality: "Bucharest", region: "Bucharest" },
  { code: "SK", name: "Slovakia", phoneCode: "421", locality: "Bratislava", region: "Bratislava" },
  { code: "SI", name: "Slovenia", phoneCode: "386", locality: "Ljubljana", region: "Ljubljana" },
  { code: "ES", name: "Spain", phoneCode: "34", locality: "Madrid", region: "Madrid" },
  { code: "SE", name: "Sweden", phoneCode: "46", locality: "Stockholm", region: "Stockholm" },
];

const copy = {
  ru: {
    title: "Корзина и оплата",
    empty: "Корзина пустая. Добавьте товары из каталога.",
    checkout: "Оформление",
    shipping: "Доставка",
    pickupSearch: "Поиск пункта выдачи",
    pickupSelect: "Выберите пункт выдачи",
    pickupLoading: "Загружаем пункты выдачи...",
    noPickupPoints: "Пункты выдачи не найдены.",
    courierAddress: "Адрес курьерской доставки",
    street: "Улица и дом",
    city: "Город",
    region: "Регион",
    postalCode: "Индекс",
    country: "Страна",
    phoneCountry: "Код телефона",
    phone: "Телефон",
    payment: "Оплата",
    card: "Карта",
    invoice: "Счёт",
    defer15: "15 дней",
    noVat: "Счёт без PVN",
    termsPrefix: "Я прочитал(а) и согласен(на) с ",
    termsLink: "правилами и условиями",
    termsSuffix: "",
    termsRequired: "Подтвердите согласие с правилами и условиями.",
    goods: "Товары",
    inStock: "в наличии",
    readyGroups: "групп товаров готовы к выбору доставки.",
    qty: "Кол-во",
    removeItem: "Удалить товар",
    total: "Итого",
    placeOrder: "Оформить заказ",
    needLogin: "Сначала войдите или зарегистрируйтесь.",
    cartEmpty: "Корзина пустая.",
    b2bOnly: "Оплата по счёту и отсрочка доступны только B2B.",
    shippingRequired: "Сначала выберите способ доставки.",
    pickupRequired: "Выберите пункт выдачи.",
    addressRequired: "Заполните адрес и телефон для курьера.",
    oversizedSelfPickup:
      "В корзине крупный товар. Для такого заказа доступен только самовывоз.",
    oversizedDisabled: "Недоступно для крупного товара",
    cardStatus: "Переходим к оплате Montonio.",
    redirecting: "Открываем Montonio...",
    paymentError: "Не удалось открыть оплату Montonio. Попробуйте ещё раз.",
    invoiceStatus: "Заказ создан. Счёт будет подготовлен администратором.",
    deferStatus: "Заказ создан. Отсрочка 15 дней будет проверена администратором.",
  },
  lv: {
    title: "Grozs un apmaksa",
    empty: "Grozs ir tukšs. Pievienojiet preces no kataloga.",
    checkout: "Noformēšana",
    shipping: "Piegāde",
    pickupSearch: "Meklēt saņemšanas punktu",
    pickupSelect: "Izvēlieties saņemšanas punktu",
    pickupLoading: "Ielādējam saņemšanas punktus...",
    noPickupPoints: "Saņemšanas punkti nav atrasti.",
    courierAddress: "Kurjera piegādes adrese",
    street: "Iela un māja",
    city: "Pilsēta",
    region: "Reģions",
    postalCode: "Pasta indekss",
    country: "Valsts",
    phoneCountry: "Tālruņa kods",
    phone: "Tālrunis",
    payment: "Apmaksa",
    card: "Karte",
    invoice: "Rēķins",
    defer15: "15 dienas",
    noVat: "Rēķins bez PVN",
    termsPrefix: "Es esmu izlasījis un piekrītu lapas ",
    termsLink: "noteikumiem un nosacījumiem",
    termsSuffix: "",
    termsRequired: "Lūdzu, apstipriniet piekrišanu noteikumiem un nosacījumiem.",
    goods: "Preces",
    inStock: "noliktavā",
    readyGroups: "preču grupas gatavas piegādes izvēlei.",
    qty: "Daudzums",
    removeItem: "Noņemt preci",
    total: "Kopā",
    placeOrder: "Noformēt pasūtījumu",
    needLogin: "Vispirms ieejiet vai reģistrējieties.",
    cartEmpty: "Grozs ir tukšs.",
    b2bOnly: "Rēķins un atliktais maksājums pieejams tikai B2B.",
    shippingRequired: "Vispirms izvēlieties piegādes veidu.",
    pickupRequired: "Izvēlieties saņemšanas punktu.",
    addressRequired: "Aizpildiet adresi un tālruni kurjeram.",
    oversizedSelfPickup:
      "Grozā ir lielgabarīta prece. Šādam pasūtījumam pieejama tikai saņemšana uz vietas.",
    oversizedDisabled: "Nav pieejams lielgabarīta precei",
    cardStatus: "Pārejam uz Montonio apmaksu.",
    redirecting: "Atveram Montonio...",
    paymentError: "Neizdevās atvērt Montonio maksājumu. Mēģiniet vēlreiz.",
    invoiceStatus: "Pasūtījums izveidots. Administrators sagatavos rēķinu.",
    deferStatus: "Pasūtījums izveidots. 15 dienu atlikšanu pārbaudīs administrators.",
  },
  en: {
    title: "Cart and payment",
    empty: "Your cart is empty. Add products from the catalog.",
    checkout: "Checkout",
    shipping: "Delivery",
    pickupSearch: "Search pickup point",
    pickupSelect: "Choose pickup point",
    pickupLoading: "Loading pickup points...",
    noPickupPoints: "No pickup points found.",
    courierAddress: "Courier delivery address",
    street: "Street address",
    city: "City",
    region: "Region",
    postalCode: "Postal code",
    country: "Country",
    phoneCountry: "Phone code",
    phone: "Phone",
    payment: "Payment",
    card: "Card",
    invoice: "Invoice",
    defer15: "15 days",
    noVat: "Invoice without VAT",
    termsPrefix: "I have read and agree to the site's ",
    termsLink: "terms and conditions",
    termsSuffix: "",
    termsRequired: "Please confirm that you agree to the terms and conditions.",
    goods: "Products",
    inStock: "in stock",
    readyGroups: "item groups ready for delivery selection.",
    qty: "Qty",
    removeItem: "Remove item",
    total: "Total",
    placeOrder: "Place order",
    needLogin: "Please sign in or register first.",
    cartEmpty: "The cart is empty.",
    b2bOnly: "Invoice and deferred payment are available only for B2B.",
    shippingRequired: "Choose a delivery method first.",
    pickupRequired: "Choose a pickup point.",
    addressRequired: "Fill courier address and phone.",
    oversizedSelfPickup:
      "Your cart contains an oversized item. This order is available only for store pickup.",
    oversizedDisabled: "Unavailable for oversized item",
    cardStatus: "Redirecting to Montonio.",
    redirecting: "Opening Montonio...",
    paymentError: "Could not open Montonio payment. Please try again.",
    invoiceStatus: "Order created. The invoice will be prepared by admin.",
    deferStatus: "Order created. 15-day deferred payment will be checked by admin.",
  },
  et: {
    title: "Ostukorv ja makse",
    empty: "Ostukorv on tühi. Lisa tooteid kataloogist.",
    checkout: "Kassa",
    shipping: "Tarne",
    pickupSearch: "Otsi väljastuspunkti",
    pickupSelect: "Vali väljastuspunkt",
    pickupLoading: "Laeme väljastuspunkte...",
    noPickupPoints: "Väljastuspunkte ei leitud.",
    courierAddress: "Kulleri tarneaadress",
    street: "Tänav ja maja",
    city: "Linn",
    region: "Piirkond",
    postalCode: "Postiindeks",
    country: "Riik",
    phoneCountry: "Telefonikood",
    phone: "Telefon",
    payment: "Makse",
    card: "Kaart",
    invoice: "Arve",
    defer15: "15 päeva",
    noVat: "Arve ilma PVN-ita",
    termsPrefix: "Olen lugenud ja nõustun saidi ",
    termsLink: "tingimustega",
    termsSuffix: "",
    termsRequired: "Palun kinnita nõustumist tingimustega.",
    goods: "Tooted",
    inStock: "laos",
    readyGroups: "tootegruppi on tarne valikuks valmis.",
    qty: "Kogus",
    removeItem: "Eemalda toode",
    total: "Kokku",
    placeOrder: "Vormista tellimus",
    needLogin: "Palun logi sisse või registreeru.",
    cartEmpty: "Ostukorv on tühi.",
    b2bOnly: "Arve ja edasilükatud makse on saadaval ainult B2B jaoks.",
    shippingRequired: "Vali esmalt tarneviis.",
    pickupRequired: "Vali väljastuspunkt.",
    addressRequired: "Täida kulleri aadress ja telefon.",
    oversizedSelfPickup:
      "Ostukorvis on suuremõõtmeline kaup. Selle tellimuse saab ainult ise ära tuua.",
    oversizedDisabled: "Pole suuremõõtmelisele kaubale saadaval",
    cardStatus: "Suundume Montonio maksesse.",
    redirecting: "Avame Montonio...",
    paymentError: "Montonio makset ei õnnestunud avada. Proovi uuesti.",
    invoiceStatus: "Tellimus loodud. Administraator valmistab arve ette.",
    deferStatus: "Tellimus loodud. 15-päevase maksepikenduse kontrollib administraator.",
  },
  lt: {
    title: "Krepšelis ir apmokėjimas",
    empty: "Krepšelis tuščias. Pridėkite prekių iš katalogo.",
    checkout: "Apmokėjimas",
    shipping: "Pristatymas",
    pickupSearch: "Ieškoti atsiėmimo punkto",
    pickupSelect: "Pasirinkite atsiėmimo punktą",
    pickupLoading: "Įkeliami atsiėmimo punktai...",
    noPickupPoints: "Atsiėmimo punktų nerasta.",
    courierAddress: "Kurjerio pristatymo adresas",
    street: "Gatvė ir namas",
    city: "Miestas",
    region: "Regionas",
    postalCode: "Pašto kodas",
    country: "Šalis",
    phoneCountry: "Telefono kodas",
    phone: "Telefonas",
    payment: "Apmokėjimas",
    card: "Kortelė",
    invoice: "Sąskaita",
    defer15: "15 dienų",
    noVat: "Sąskaita be PVN",
    termsPrefix: "Perskaičiau ir sutinku su svetainės ",
    termsLink: "taisyklėmis ir sąlygomis",
    termsSuffix: "",
    termsRequired: "Patvirtinkite sutikimą su taisyklėmis ir sąlygomis.",
    goods: "Prekės",
    inStock: "sandėlyje",
    readyGroups: "prekių grupės paruoštos pristatymo pasirinkimui.",
    qty: "Kiekis",
    removeItem: "Pašalinti prekę",
    total: "Iš viso",
    placeOrder: "Pateikti užsakymą",
    needLogin: "Pirmiausia prisijunkite arba užsiregistruokite.",
    cartEmpty: "Krepšelis tuščias.",
    b2bOnly: "Sąskaita ir atidėtas mokėjimas prieinami tik B2B.",
    shippingRequired: "Pirmiausia pasirinkite pristatymo būdą.",
    pickupRequired: "Pasirinkite atsiėmimo punktą.",
    addressRequired: "Užpildykite kurjerio adresą ir telefoną.",
    oversizedSelfPickup:
      "Krepšelyje yra didelė prekė. Tokį užsakymą galima tik atsiimti vietoje.",
    oversizedDisabled: "Netinka didelei prekei",
    cardStatus: "Pereiname prie Montonio apmokėjimo.",
    redirecting: "Atidarome Montonio...",
    paymentError: "Nepavyko atidaryti Montonio mokėjimo. Bandykite dar kartą.",
    invoiceStatus: "Užsakymas sukurtas. Administratorius paruoš sąskaitą.",
    deferStatus: "Užsakymas sukurtas. 15 dienų atidėjimą patikrins administratorius.",
  },
} as const;

function readCart() {
  return readCartLines();
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function findVariationInProducts(products: Product[], variationId: string) {
  for (const product of products) {
    const variation = product.variations.find((item) => item.id === variationId);

    if (variation) {
      return { product, variation };
    }
  }

  return null;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function localeForLanguage(language: Language) {
  if (language === "lv") return "lv-LV";
  if (language === "en") return "en-GB";
  if (language === "et") return "et-EE";
  if (language === "lt") return "lt-LT";

  return "ru-RU";
}

function cartMoney(value: number, language: Language) {
  const locale = localeForLanguage(language);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const totalsCopy = {
  ru: { withoutVat: "Без PVN" },
  lv: { withoutVat: "Bez PVN" },
  en: { withoutVat: "Without VAT" },
  et: { withoutVat: "Ilma PVN-ita" },
  lt: { withoutVat: "Be PVM" },
} as const;

const deliveryLabels = {
  ru: {
    countries: { LV: "Латвия", LT: "Литва", EE: "Эстония" },
    selfPickupName: "Забрать самому",
    courierName: "Курьерская доставка",
    selfPickup: "самовывоз",
    courier: "адрес",
    postOffice: "почтовое отделение",
    parcelMachine: "пакомат",
  },
  lv: {
    countries: { LV: "Latvija", LT: "Lietuva", EE: "Igaunija" },
    selfPickupName: "Saņemt uz vietas",
    courierName: "Kurjera piegāde",
    selfPickup: "saņemšana uz vietas",
    courier: "adrese",
    postOffice: "pasta nodaļa",
    parcelMachine: "paku automāts",
  },
  en: {
    countries: { LV: "Latvia", LT: "Lithuania", EE: "Estonia" },
    selfPickupName: "Pick up from store",
    courierName: "Courier delivery",
    selfPickup: "self pickup",
    courier: "address",
    postOffice: "post office",
    parcelMachine: "parcel machine",
  },
  et: {
    countries: { LV: "Läti", LT: "Leedu", EE: "Eesti" },
    selfPickupName: "Tulen ise järele",
    courierName: "Kulleriga tarne",
    selfPickup: "ise järele tulemine",
    courier: "aadress",
    postOffice: "postkontor",
    parcelMachine: "pakiautomaat",
  },
  lt: {
    countries: { LV: "Latvija", LT: "Lietuva", EE: "Estija" },
    selfPickupName: "Atsiimti vietoje",
    courierName: "Kurjerio pristatymas",
    selfPickup: "atsiėmimas vietoje",
    courier: "adresas",
    postOffice: "pašto skyrius",
    parcelMachine: "paštomatas",
  },
} as const;

function localizedRegionName(code: DeliveryCountry, language: Language) {
  try {
    return new Intl.DisplayNames([localeForLanguage(language)], { type: "region" }).of(code);
  } catch {
    return undefined;
  }
}

function shippingLabels(language: Language) {
  return deliveryLabels[language as keyof typeof deliveryLabels] ?? deliveryLabels.en;
}

function countryLabel(code: DeliveryCountry, language: Language) {
  const labels = shippingLabels(language).countries as Partial<Record<DeliveryCountry, string>>;

  return (
    labels[code] ??
    localizedRegionName(code, language) ??
    deliveryCountries.find((country) => country.code === code)?.name ??
    code
  );
}

function methodName(method: ShippingMethodOption, language: Language) {
  const labels = shippingLabels(language);

  if (method.shippingType === "self_pickup") {
    return labels.selfPickupName;
  }

  if (method.shippingType === "courier") {
    if (isMontonioInternationalMethod(method)) {
      return montonioInternationalName;
    }

    return labels.courierName;
  }

  if (method.shippingType === "post_office") {
    return method.carrierName;
  }

  return `${method.carrierName} ${labels.parcelMachine}`;
}

function methodDetails(method: ShippingMethodOption, language: Language) {
  const labels = shippingLabels(language);

  if (method.shippingType === "self_pickup") {
    return labels.selfPickup;
  }

  const typeLabel =
    method.shippingType === "courier"
      ? labels.courier
      : method.shippingType === "post_office"
        ? labels.postOffice
        : labels.parcelMachine;

  return `${method.carrierName} - ${typeLabel}`;
}

function carrierIcon(method: ShippingMethodOption) {
  const carrierText = [
    method.carrierCode,
    method.carrier,
    method.carrierName,
    method.name,
    method.shippingType,
  ]
    .join(" ")
    .toLowerCase();

  if (method.shippingType === "self_pickup" || carrierText.includes("self")) {
    return { alt: "Self pickup", className: "self", src: "/shipping-logos/pickup.webp?v=20260710" };
  }

  if (carrierText.includes("montonio")) {
    return {
      alt: "Montonio",
      className: "montonio",
      src: "/shipping-logos/montonio.png?v=20260724",
    };
  }

  if (method.shippingType === "courier") {
    return { alt: "Courier", className: "courier", src: "/shipping-logos/courier.webp?v=20260710" };
  }

  if (carrierText.includes("dpd")) {
    return { alt: "DPD", className: "dpd", src: "/shipping-logos/dpd.png" };
  }

  if (
    carrierText.includes("smartposti") ||
    carrierText.includes("smartpost") ||
    carrierText.includes("smart_post") ||
    carrierText.includes("itella")
  ) {
    return { alt: "Smartposti", className: "smartposti", src: "/shipping-logos/smartposti.png" };
  }

  if (carrierText.includes("unisend")) {
    return { alt: "Unisend", className: "unisend", src: "/shipping-logos/unisend.png" };
  }

  if (carrierText.includes("venipak")) {
    return { alt: "Venipak", className: "venipak", src: "/shipping-logos/venipak.png" };
  }

  if (
    carrierText.includes("pasts") ||
    carrierText.includes("latvijas") ||
    carrierText.includes("latvian") ||
    carrierText.includes("latvia_post") ||
    carrierText.includes("post_office")
  ) {
    return { alt: "Latvijas Pasts", className: "pasts", src: "/shipping-logos/latvijas-pasts.png" };
  }

  return { alt: "Omniva", className: "omniva", src: "/shipping-logos/omniva.png" };
}

export function CartCheckout() {
  const { session, role } = useDemoSession();
  const { language } = useLanguage();
  const promoPrices = usePromoPrices();
  const promoRules = usePromoRules();
  const { levels } = useInventoryLevels();
  const productImageMap = useProductImages();
  const c = copy[language as keyof typeof copy] ?? copy.en;
  const totalsLabels = totalsCopy[language as keyof typeof totalsCopy] ?? totalsCopy.en;
  const [cart, setCart] = useState<CartLine[]>(() => readCart());
  const [checkoutProducts, setCheckoutProducts] = useState<Product[]>([]);
  const [shippingCountry, setShippingCountry] = useState<SelectedDeliveryCountry>("");
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>(
    () => fallbackShippingMethods(defaultDeliveryCountry),
  );
  const shippingMethodsRef = useRef(shippingMethods);
  const [shippingId, setShippingId] = useState(
    () => fallbackShippingMethods(defaultDeliveryCountry)[0].id,
  );
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupPointId, setPickupPointId] = useState("");
  const [pickupQuery, setPickupQuery] = useState("");
  const [pickupLoading, setPickupLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    streetAddress: "",
    locality: "",
    region: "",
    postalCode: "",
    country: "",
    phoneCountryCode: "",
    phoneNumber: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeShippingCountry = effectiveDeliveryCountry(shippingCountry);

  useEffect(() => {
    shippingMethodsRef.current = shippingMethods;
  }, [shippingMethods]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/products")
      .then((response) => response.json())
      .then((data: { products?: Product[] }) => {
        if (!cancelled && Array.isArray(data.products) && data.products.length) {
          setCheckoutProducts(data.products);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void cancelPendingMontonioOrder().then((cancelled) => {
      if (cancelled) {
        setIsSubmitting(false);
        setStatus("");
      }
    });

    const cancelOnReturn = () => {
      void cancelPendingMontonioOrder().then((cancelled) => {
        if (cancelled) {
          setIsSubmitting(false);
          setStatus("");
        }
      });
    };
    const cancelOnVisible = () => {
      if (document.visibilityState === "visible") {
        void cancelPendingMontonioOrder().then((cancelled) => {
          if (cancelled) {
            setIsSubmitting(false);
            setStatus("");
          }
        });
      }
    };

    window.addEventListener("pageshow", cancelOnReturn);
    window.addEventListener("focus", cancelOnReturn);
    document.addEventListener("visibilitychange", cancelOnVisible);

    return () => {
      window.removeEventListener("pageshow", cancelOnReturn);
      window.removeEventListener("focus", cancelOnReturn);
      document.removeEventListener("visibilitychange", cancelOnVisible);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/shipping/montonio/methods?country=${activeShippingCountry}`)
      .then((response) => response.json())
      .then((data: { methods?: ShippingMethodOption[] }) => {
        if (cancelled) {
          return;
        }

        const activeMethods = (data.methods ?? []).filter((method) => method.available);
        const nextMethods = activeMethods.length
          ? activeMethods
          : fallbackShippingMethods(activeShippingCountry);
        const previousMethods = shippingMethodsRef.current;

        setShippingMethods(nextMethods);
        setShippingId((current) =>
          preferredShippingMethodId(current, previousMethods, nextMethods),
        );
      })
      .catch(() => {
        if (!cancelled) {
          const fallbackMethods = fallbackShippingMethods(activeShippingCountry);
          const previousMethods = shippingMethodsRef.current;

          setShippingMethods(fallbackMethods);
          setShippingId((current) =>
            preferredShippingMethodId(current, previousMethods, fallbackMethods),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeShippingCountry]);

  const selectedShippingMethod =
    shippingMethods.find((method) => method.id === shippingId) ??
    shippingMethods[0] ??
    fallbackShippingMethods(activeShippingCountry)[0];

  useEffect(() => {
    if (!selectedShippingMethod || selectedShippingMethod.type !== "pickupPoint") {
      const timeout = window.setTimeout(() => {
        setPickupPoints([]);
        setPickupPointId("");
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    let cancelled = false;
    const params = new URLSearchParams({
      carrier: selectedShippingMethod.carrierCode,
      country: activeShippingCountry,
      type: selectedShippingMethod.subtype || "parcelMachine",
    });

    const loadingTimeout = window.setTimeout(() => setPickupLoading(true), 0);
    fetch(`/api/shipping/montonio/pickup-points?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { pickupPoints?: PickupPoint[] }) => {
        if (cancelled) {
          return;
        }

        const points = data.pickupPoints ?? [];

        setPickupPoints(points);
        setPickupPointId("");
      })
      .catch(() => {
        if (!cancelled) {
          setPickupPoints([]);
          setPickupPointId("");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPickupLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimeout);
    };
  }, [
    selectedShippingMethod,
    activeShippingCountry,
  ]);

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const found = findVariationInProducts(checkoutProducts, line.variationId);

          if (!found) {
            return null;
          }

          const price = applyPromoPrice(
            pricedVariation(found.product, found.variation, role),
            found.variation.id,
            role,
            promoPrices,
            promoRules,
            { productId: found.product.id, brand: found.product.brand },
          );
          return {
            ...line,
            ...found,
            price,
            availability: availableStock(found.variation, levels),
            total: price.final * line.qty,
          };
        })
        .filter(isPresent),
    [cart, checkoutProducts, levels, promoPrices, promoRules, role],
  );
  const oversizedLine = useMemo(() => oversizedOrderLine(lines), [lines]);
  const oversizedProductName = oversizedLine ? productTitle(oversizedLine.product, language) : "";
  const oversizedMessage = oversizedProductName
    ? `${c.oversizedSelfPickup} (${oversizedProductName})`
    : c.oversizedSelfPickup;

  const filteredPickupPoints = useMemo(() => {
    const query = normalizeSearch(pickupQuery);

    if (!query) {
      return pickupPoints;
    }

    return pickupPoints.filter((point) =>
      [
        point.name,
        point.streetAddress,
        point.locality,
        point.postalCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [pickupPoints, pickupQuery]);
  const selectedPickupPoint = pickupPoints.find((point) => point.id === pickupPointId);
  const shippingPrice = selectedShippingMethod?.price ?? 0;
  const grossItems = lines.reduce((sum, line) => sum + line.total, 0);
  const total = grossItems + shippingPrice;
  const vat = total * 21 / 121;
  const subtotal = total - vat;
  const totalWithoutVat = subtotal;
  const canUseB2B = role === "b2b" || role === "admin";
  const selfPickupMethodId = shippingMethods.find((method) =>
    isSelfPickupShippingType(method.shippingType),
  )?.id;

  useEffect(() => {
    if (!oversizedLine || !selfPickupMethodId || shippingId === selfPickupMethodId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShippingId(selfPickupMethodId);
      setPickupPointId("");
      setPickupQuery("");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [oversizedLine, selfPickupMethodId, shippingId]);

  function updateQty(variationId: string, qty: number) {
    const next =
      qty <= 0
        ? cart.filter((line) => line.variationId !== variationId)
        : cart.map((line) =>
            line.variationId === variationId ? { ...line, qty } : line,
          );

    setCart(next);
    writeCartLines(next);
  }

  function updateAddress(patch: Partial<ShippingAddress>) {
    setShippingAddress((address) => ({ ...address, ...patch }));
  }

  function updateShippingCountry(country: SelectedDeliveryCountry) {
    const fallbackMethods = fallbackShippingMethods(effectiveDeliveryCountry(country));
    const previousMethods = shippingMethodsRef.current;

    setShippingCountry(country);
    setShippingMethods(fallbackMethods);
    setShippingId((current) =>
      preferredShippingMethodId(current, previousMethods, fallbackMethods),
    );
    setPickupQuery("");
    setPickupPointId("");
    setShippingAddress({
      streetAddress: "",
      locality: "",
      region: "",
      postalCode: "",
      country: "",
      phoneCountryCode: "",
      phoneNumber: "",
    });
  }

  function validateShipping() {
    if (!selectedShippingMethod) {
      setStatus(c.shippingRequired);
      return false;
    }

    if (oversizedLine && !isSelfPickupShippingType(selectedShippingMethod.shippingType)) {
      setStatus(oversizedMessage);
      return false;
    }

    if (selectedShippingMethod.type === "pickupPoint" && !selectedPickupPoint) {
      setStatus(c.pickupRequired);
      return false;
    }

    if (selectedShippingMethod.type === "courier") {
      const required = [
        shippingAddress.streetAddress,
        shippingAddress.locality,
        shippingAddress.postalCode,
        shippingAddress.country,
        shippingAddress.phoneCountryCode,
        shippingAddress.phoneNumber,
      ];

      if (required.some((value) => !value.trim())) {
        setStatus(c.addressRequired);
        return false;
      }
    }

    return true;
  }

  function payloadShippingAddress(shipping: ShippingMethodOption) {
    const contact = {
      name: session?.name,
      companyName: session?.company,
      email: session?.email,
    };

    if (shipping.type === "courier") {
      return {
        ...shippingAddress,
        ...contact,
      };
    }

    if (shipping.type === "pickupPoint" && selectedPickupPoint) {
      return {
        ...shippingAddress,
        ...contact,
        streetAddress: selectedPickupPoint.streetAddress || selectedPickupPoint.name,
        locality: selectedPickupPoint.locality || shippingAddress.locality,
        postalCode: selectedPickupPoint.postalCode || shippingAddress.postalCode,
        country: selectedPickupPoint.countryCode || activeShippingCountry,
      };
    }

    return undefined;
  }

  function checkoutPayload() {
    const shipping = selectedShippingMethod;
    const shippingAddressPayload = payloadShippingAddress(shipping);

    return {
      customer: {
        name: session?.name,
        email: session?.email,
        company: session?.company,
      },
      shippingCarrier: shipping.carrierCode,
      shippingMethod: selectedPickupPoint?.id || shipping.serviceId || shipping.id,
      shippingMethodName: selectedPickupPoint?.name || shipping.name,
      shippingType: shipping.shippingType,
      pickupPointId: selectedPickupPoint?.id,
      pickupPointName: selectedPickupPoint?.name,
      shippingAddress: shippingAddressPayload,
      shippingPrice,
      paymentMethod: payment,
      language,
      lines: lines.map((line) => ({
        productId: line.product.id,
        variationId: line.variation.id,
        quantity: line.qty,
      })),
      noVat: false,
      totals: {
        subtotal,
        vat,
        total,
      },
      shipping: {
        carrier: shipping.carrier,
        carrierCode: shipping.carrierCode,
        method: shipping.serviceId || shipping.id,
        methodName: selectedPickupPoint?.name || shipping.name,
        type: shipping.type,
        shippingType: shipping.shippingType,
        pickupPointId: selectedPickupPoint?.id,
        pickupPointName: selectedPickupPoint?.name,
        address: shippingAddressPayload,
        price: shippingPrice,
      },
    };
  }

  async function submitOrder() {
    if (!session) {
      setStatus(c.needLogin);
      return;
    }

    if (!lines.length) {
      setStatus(c.cartEmpty);
      return;
    }

    if (!validateShipping()) {
      return;
    }

    if ((payment === "invoice" || payment === "defer15") && !canUseB2B) {
      setStatus(c.b2bOnly);
      return;
    }

    if (!acceptedTerms) {
      setStatus(c.termsRequired);
      return;
    }

    setIsSubmitting(true);
    setStatus(payment === "card" ? c.cardStatus : c.invoiceStatus);

    try {
      const body = JSON.stringify(checkoutPayload());

      if (payment !== "card") {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          order?: { id?: string };
        };

        if (!response.ok || !data.order?.id) {
          throw new Error(data.error || c.paymentError);
        }

        writeCartLines([]);
        setCart([]);
        setStatus(
          `${payment === "defer15" ? c.deferStatus : c.invoiceStatus} ${data.order.id}`,
        );
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/montonio/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        orderId?: string;
        merchantReference?: string;
        paymentUrl?: string;
      };

      if (!response.ok || !data.paymentUrl) {
        throw new Error(data.error || c.paymentError);
      }

      setStatus(c.redirecting);
      if (data.orderId && data.merchantReference) {
        window.sessionStorage.setItem(
          pendingMontonioOrderKey,
          JSON.stringify({
            orderId: data.orderId,
            merchantReference: data.merchantReference,
          }),
        );
      }
      window.location.assign(data.paymentUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : c.paymentError);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="checkout-page checkout-page-v3">
      <section className="checkout-list checkout-list-v3">
        <div className="checkout-heading-v3">
          <span className="kicker-v3">{c.goods}</span>
          <h1>{c.title}</h1>
          <p>{lines.length} {c.readyGroups}</p>
        </div>
        {lines.length ? (
          <div className="cart-item-list-v3">
            {lines.map((line) => {
              const [photo] = productImages(line.product, productImageMap);
              const photoStyle = photo
                ? ({ backgroundImage: `url("${photo}")` } as CSSProperties)
                : ({
                    "--sheet-x": line.product.sheetX,
                    "--sheet-y": line.product.sheetY,
                  } as CSSProperties);

              return (
                <div className="cart-line cart-item-v3" key={line.variation.id}>
                  <span
                    className={photo ? "cart-item-photo-v3 real-photo" : "cart-item-photo-v3"}
                    style={photoStyle}
                  />
                  <div className="cart-item-copy-v3">
                    <strong>{productTitle(line.product, language)}</strong>
                    <span>{line.variation.name} / {line.variation.sku}</span>
                    <small>{line.availability} {c.inStock}</small>
                  </div>
                  <label className="cart-qty-v3">
                    {c.qty}
                    <input
                      min={0}
                      onChange={(event) => updateQty(line.variation.id, Number(event.target.value))}
                      type="number"
                      value={line.qty}
                    />
                  </label>
                  <strong className="cart-line-total-v3">{cartMoney(line.total, language)}</strong>
                  <button
                    aria-label={c.removeItem}
                    className="cart-line-remove-v3"
                    onClick={() => updateQty(line.variation.id, 0)}
                    title={c.removeItem}
                    type="button"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-state checkout-empty-v3">{c.empty}</p>
        )}
      </section>

      <aside className="checkout-panel checkout-panel-v3">
        <div className="checkout-summary-head-v3">
          <span className="kicker-v3">{c.checkout}</span>
          <h2>{cartMoney(total, language)}</h2>
        </div>

        <div className="checkout-step-v3 checkout-block">
          <div className="checkout-step-title-v3">
            <span>01</span>
            <h3>{c.shipping}</h3>
          </div>
          <label className="country-select-shell-v3">
            {!shippingCountry ? (
              <span className="select-placeholder-label-v3">{c.country}</span>
            ) : null}
            <select
              aria-label={c.country}
              className={shippingCountry ? "" : "select-placeholder-v3"}
              value={shippingCountry}
              onChange={(event) =>
                updateShippingCountry(event.target.value as SelectedDeliveryCountry)
              }
            >
              <option value="" />
              {deliveryCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {countryLabel(country.code, language)}
                </option>
              ))}
            </select>
          </label>
          {oversizedLine ? (
            <p className="oversized-shipping-note">{oversizedMessage}</p>
          ) : null}
          <div className="shipping-options">
            {shippingMethods.map((method) => {
              const icon = carrierIcon(method);
              const disabledByOversize = Boolean(
                oversizedLine && !isSelfPickupShippingType(method.shippingType),
              );

              return (
                <button
                  aria-disabled={disabledByOversize}
                  className={[
                    "shipping-option",
                    method.id === shippingId ? "active" : "",
                    disabledByOversize ? "disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={disabledByOversize}
                  key={method.id}
                  onClick={() => {
                    if (!disabledByOversize) {
                      setShippingId(method.id);
                    }
                  }}
                  type="button"
                >
                  <span className={`carrier-icon ${icon.className}`}>
                    <Image
                      alt={icon.alt}
                      className="carrier-logo"
                      height={52}
                      src={icon.src}
                      unoptimized
                      width={82}
                    />
                  </span>
                  <span className="shipping-option-copy">
                    <strong>{methodName(method, language)}</strong>
                    <span>
                      {methodDetails(method, language)} / {cartMoney(method.price, language)}
                    </span>
                    {disabledByOversize ? (
                      <span className="shipping-option-lock">{c.oversizedDisabled}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedShippingMethod?.type === "pickupPoint" ? (
            <div className="pickup-selector">
              <input
                placeholder={c.pickupSearch}
                value={pickupQuery}
                onChange={(event) => {
                  setPickupQuery(event.target.value);
                  setPickupPointId("");
                }}
              />
              <select
                value={pickupPointId}
                onChange={(event) => setPickupPointId(event.target.value)}
              >
                <option value="">{c.pickupSelect}</option>
                {filteredPickupPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {[point.name, point.locality, point.streetAddress]
                      .filter(Boolean)
                      .join(" - ")}
                  </option>
                ))}
              </select>
              {pickupLoading ? <span className="quiet">{c.pickupLoading}</span> : null}
              {!pickupLoading && !filteredPickupPoints.length ? (
                <span className="quiet">{c.noPickupPoints}</span>
              ) : null}
            </div>
          ) : null}

          {selectedShippingMethod?.type === "courier" ? (
            <div className="courier-address courier-address-v2">
              <div className="courier-address-head-v2">
                <strong>{c.courierAddress}</strong>
              </div>
              <div className="courier-address-grid-v2">
                <input
                  className="courier-field-wide-v2"
                  placeholder={c.street}
                  value={shippingAddress.streetAddress}
                  onChange={(event) => updateAddress({ streetAddress: event.target.value })}
                />
                <input
                  placeholder={c.city}
                  value={shippingAddress.locality}
                  onChange={(event) => updateAddress({ locality: event.target.value })}
                />
                <input
                  placeholder={c.postalCode}
                  value={shippingAddress.postalCode}
                  onChange={(event) => updateAddress({ postalCode: event.target.value })}
                />
                <input
                  placeholder={c.region}
                  value={shippingAddress.region}
                  onChange={(event) => updateAddress({ region: event.target.value })}
                />
                <label className="country-select-shell-v3 courier-country-shell-v3">
                  {!shippingAddress.country ? (
                    <span className="select-placeholder-label-v3">{c.country}</span>
                  ) : null}
                  <select
                    aria-label={c.country}
                    className={shippingAddress.country ? "" : "select-placeholder-v3"}
                    value={shippingAddress.country}
                    onChange={(event) => updateAddress({ country: event.target.value })}
                  >
                    <option value="" />
                    {deliveryCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {countryLabel(country.code, language)}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  placeholder={c.phoneCountry}
                  value={shippingAddress.phoneCountryCode}
                  onChange={(event) =>
                    updateAddress({ phoneCountryCode: event.target.value.replace(/\D/g, "") })
                  }
                />
                <input
                  className="courier-field-wide-v2"
                  placeholder={c.phone}
                  value={shippingAddress.phoneNumber}
                  onChange={(event) =>
                    updateAddress({ phoneNumber: event.target.value.replace(/[^\d+\s]/g, "") })
                  }
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="checkout-step-v3 checkout-block">
          <div className="checkout-step-title-v3">
            <span>02</span>
            <h3>{c.payment}</h3>
          </div>
          <div className="segmented-control">
            <button
              className={payment === "card" ? "active" : ""}
              onClick={() => setPayment("card")}
              type="button"
            >
              {c.card}
            </button>
            <button
              className={payment === "invoice" ? "active" : ""}
              disabled={!canUseB2B}
              onClick={() => setPayment("invoice")}
              type="button"
            >
              {c.invoice}
            </button>
            <button
              className={payment === "defer15" ? "active" : ""}
              disabled={!canUseB2B}
              onClick={() => setPayment("defer15")}
              type="button"
            >
              {c.defer15}
            </button>
          </div>
          <div className="payment-logos">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>3D Secure</span>
            <span>Apple Pay</span>
            <span>Google Pay</span>
          </div>
        </div>

        <label className="check-row terms-row-v3">
          <input
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            type="checkbox"
          />
          <span>
            {c.termsPrefix}
            <Link href="/privacy-policy">{c.termsLink}</Link>
            {c.termsSuffix}
            <span className="required-mark-v3">*</span>
          </span>
        </label>

        <div className="totals totals-v3">
          <span>{c.goods}</span>
          <strong>{cartMoney(subtotal, language)}</strong>
          <span>PVN</span>
          <strong>{cartMoney(vat, language)}</strong>
          <span>{c.shipping}</span>
          <strong>{cartMoney(shippingPrice, language)}</strong>
          <span>{totalsLabels.withoutVat}</span>
          <strong>{cartMoney(totalWithoutVat, language)}</strong>
          <span>{c.total}</span>
          <strong>{cartMoney(total, language)}</strong>
        </div>

        <button
          className="button-v3 primary checkout-submit-v3 wide-button"
          disabled={isSubmitting}
          onClick={submitOrder}
          type="button"
        >
          {isSubmitting ? c.redirecting : c.placeOrder}
        </button>
        {status ? <p className="status-box">{status}</p> : null}
      </aside>
    </div>
  );
}
