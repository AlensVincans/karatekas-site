"use client";

import { useEffect, useMemo, useState } from "react";
import {
  findVariation,
  pricedVariation,
  type PaymentMethod,
} from "../lib/store-data";
import { applyPromoPrice, usePromoPrices } from "../lib/promotions";
import { money } from "../lib/i18n";
import { useLanguage } from "./language";
import { useDemoSession } from "./session";

type CartLine = {
  productId: string;
  variationId: string;
  qty: number;
};

type ShippingType = "parcel_machine" | "parcel_shop" | "post_office" | "courier";

type ShippingMethodOption = {
  id: string;
  carrier: string;
  carrierCode: string;
  carrierName: string;
  name: string;
  type: "pickupPoint" | "courier";
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

const fallbackShippingMethods: ShippingMethodOption[] = [
  {
    id: "omniva-parcel-machine",
    carrier: "omniva",
    carrierCode: "omniva",
    carrierName: "Omniva",
    name: "Omniva parcel machine",
    type: "pickupPoint",
    shippingType: "parcel_machine",
    subtype: "parcelMachine",
    price: 3.49,
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
    price: 4.9,
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
    price: 2.99,
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
    price: 5.6,
    currency: "EUR",
    available: true,
  },
  {
    id: "omniva-courier-standard",
    carrier: "omniva",
    carrierCode: "omniva",
    carrierName: "Courier",
    name: "Courier delivery",
    type: "courier",
    shippingType: "courier",
    subtype: "standard",
    price: 8.5,
    currency: "EUR",
    available: true,
  },
];

const copy = {
  ru: {
    title: "Корзина и оплата",
    empty: "Корзина пустая. Добавьте товары из каталога.",
    checkout: "Checkout",
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
    goods: "Товары",
    total: "Итого",
    placeOrder: "Оформить заказ",
    needLogin: "Сначала войдите или зарегистрируйтесь.",
    cartEmpty: "Корзина пустая.",
    b2bOnly: "Оплата по счёту и отсрочка доступны только B2B.",
    shippingRequired: "Сначала выберите способ доставки.",
    pickupRequired: "Выберите пункт выдачи.",
    addressRequired: "Заполните адрес и телефон для курьера.",
    cardStatus: "Переходим к оплате Montonio.",
    redirecting: "Открываем Montonio...",
    paymentError: "Не удалось открыть оплату Montonio. Попробуйте ещё раз.",
    invoiceStatus: "Заказ создан. Счёт будет подготовлен администратором.",
    deferStatus: "Заказ создан. Отсрочка 15 дней будет проверена администратором.",
  },
  lv: {
    title: "Grozs un apmaksa",
    empty: "Grozs ir tukšs. Pievienojiet preces no kataloga.",
    checkout: "Checkout",
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
    goods: "Preces",
    total: "Kopā",
    placeOrder: "Noformēt pasūtījumu",
    needLogin: "Vispirms ieejiet vai reģistrējieties.",
    cartEmpty: "Grozs ir tukšs.",
    b2bOnly: "Rēķins un atliktais maksājums pieejams tikai B2B.",
    shippingRequired: "Vispirms izvēlieties piegādes veidu.",
    pickupRequired: "Izvēlieties saņemšanas punktu.",
    addressRequired: "Aizpildiet adresi un tālruni kurjeram.",
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
    goods: "Products",
    total: "Total",
    placeOrder: "Place order",
    needLogin: "Please sign in or register first.",
    cartEmpty: "The cart is empty.",
    b2bOnly: "Invoice and deferred payment are available only for B2B.",
    shippingRequired: "Choose a delivery method first.",
    pickupRequired: "Choose a pickup point.",
    addressRequired: "Fill courier address and phone.",
    cardStatus: "Redirecting to Montonio.",
    redirecting: "Opening Montonio...",
    paymentError: "Could not open Montonio payment. Please try again.",
    invoiceStatus: "Order created. The invoice will be prepared by admin.",
    deferStatus: "Order created. 15-day deferred payment will be checked by admin.",
  },
} as const;

function readCart() {
  try {
    return JSON.parse(window.localStorage.getItem("bc_cart") ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function methodDetails(method: ShippingMethodOption, language: "ru" | "lv" | "en") {
  const typeLabel =
    method.shippingType === "courier"
      ? language === "en"
        ? "address"
        : "address"
      : method.shippingType === "post_office"
        ? "post office"
        : "parcel machine";

  return `${method.carrierName} - ${typeLabel}`;
}

export function CartCheckout() {
  const { session, role } = useDemoSession();
  const { language } = useLanguage();
  const promoPrices = usePromoPrices();
  const c = copy[language];
  const [cart, setCart] = useState<CartLine[]>(() => readCart());
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>(
    fallbackShippingMethods,
  );
  const [shippingId, setShippingId] = useState(fallbackShippingMethods[0].id);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupPointId, setPickupPointId] = useState("");
  const [pickupQuery, setPickupQuery] = useState("");
  const [pickupLoading, setPickupLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    streetAddress: "",
    locality: "Riga",
    region: "Riga",
    postalCode: "",
    country: "LV",
    phoneCountryCode: "371",
    phoneNumber: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [noVat, setNoVat] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/shipping/montonio/methods?country=LV")
      .then((response) => response.json())
      .then((data: { methods?: ShippingMethodOption[] }) => {
        if (cancelled || !data.methods?.length) {
          return;
        }

        const activeMethods = data.methods.filter((method) => method.available);

        if (!activeMethods.length) {
          return;
        }

        setShippingMethods(activeMethods);
        setShippingId(activeMethods[0].id);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedShippingMethod =
    shippingMethods.find((method) => method.id === shippingId) ??
    shippingMethods[0] ??
    fallbackShippingMethods[0];

  useEffect(() => {
    if (!selectedShippingMethod || selectedShippingMethod.type === "courier") {
      setPickupPoints([]);
      setPickupPointId("");
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      carrier: selectedShippingMethod.carrierCode,
      country: "LV",
      type: selectedShippingMethod.subtype || "parcelMachine",
    });

    setPickupLoading(true);
    fetch(`/api/shipping/montonio/pickup-points?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { pickupPoints?: PickupPoint[] }) => {
        if (cancelled) {
          return;
        }

        const points = data.pickupPoints ?? [];

        setPickupPoints(points);
        setPickupPointId(points[0]?.id ?? "");
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
    };
  }, [selectedShippingMethod?.carrierCode, selectedShippingMethod?.id, selectedShippingMethod?.subtype, selectedShippingMethod?.type]);

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const found = findVariation(line.variationId);

          if (!found) {
            return null;
          }

          const price = applyPromoPrice(
            pricedVariation(found.product, found.variation, role),
            found.variation.id,
            role,
            promoPrices,
          );
          return {
            ...line,
            ...found,
            price,
            total: price.final * line.qty,
          };
        })
        .filter(isPresent),
    [cart, promoPrices, role],
  );

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
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const vat = noVat ? 0 : subtotal * 0.21;
  const shippingPrice = selectedShippingMethod?.price ?? 0;
  const total = subtotal + vat + shippingPrice;
  const canUseB2B = role === "b2b" || role === "admin";

  function updateQty(variationId: string, qty: number) {
    const next =
      qty <= 0
        ? cart.filter((line) => line.variationId !== variationId)
        : cart.map((line) =>
            line.variationId === variationId ? { ...line, qty } : line,
          );

    setCart(next);
    window.localStorage.setItem("bc_cart", JSON.stringify(next));
  }

  function updateAddress(patch: Partial<ShippingAddress>) {
    setShippingAddress((address) => ({ ...address, ...patch }));
  }

  function validateShipping() {
    if (!selectedShippingMethod) {
      setStatus(c.shippingRequired);
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

  function checkoutPayload() {
    const shipping = selectedShippingMethod;

    return {
      customer: {
        name: session?.name,
        email: session?.email,
        company: session?.company,
        role: session?.role,
      },
      shippingCarrier: shipping.carrierCode,
      shippingMethod: selectedPickupPoint?.id || shipping.serviceId || shipping.id,
      shippingMethodName: selectedPickupPoint?.name || shipping.name,
      shippingType: shipping.shippingType,
      pickupPointId: selectedPickupPoint?.id,
      pickupPointName: selectedPickupPoint?.name,
      shippingAddress:
        shipping.type === "courier"
          ? {
              ...shippingAddress,
              name: session?.name,
              companyName: session?.company,
              email: session?.email,
            }
          : undefined,
      shippingPrice,
      paymentMethod: payment,
      language,
      lines: lines.map((line) => ({
        productId: line.product.id,
        variationId: line.variation.id,
        productName: line.product.name,
        variationName: line.variation.name,
        sku: line.variation.sku,
        quantity: line.qty,
        unitPrice: line.price.final,
      })),
      noVat,
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
        address:
          shipping.type === "courier"
            ? {
                ...shippingAddress,
                name: session?.name,
                companyName: session?.company,
                email: session?.email,
              }
            : undefined,
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

        window.localStorage.setItem("bc_cart", "[]");
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
        paymentUrl?: string;
      };

      if (!response.ok || !data.paymentUrl) {
        throw new Error(data.error || c.paymentError);
      }

      setStatus(c.redirecting);
      window.location.assign(data.paymentUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : c.paymentError);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      <section className="checkout-list">
        <h1>{c.title}</h1>
        {lines.length ? (
          lines.map((line) => (
            <div className="cart-line" key={line.variation.id}>
              <div>
                <strong>{line.product.name}</strong>
                <span>
                  {line.variation.name} - {line.variation.sku}
                </span>
              </div>
              <input
                min={0}
                onChange={(event) => updateQty(line.variation.id, Number(event.target.value))}
                type="number"
                value={line.qty}
              />
              <strong>{money(line.total, language)}</strong>
            </div>
          ))
        ) : (
          <p className="empty-state">{c.empty}</p>
        )}
      </section>

      <aside className="checkout-panel">
        <h2>{c.checkout}</h2>

        <div className="checkout-block">
          <h3>{c.shipping}</h3>
          <div className="shipping-options">
            {shippingMethods.map((method) => (
              <button
                className={method.id === shippingId ? "shipping-option active" : "shipping-option"}
                key={method.id}
                onClick={() => setShippingId(method.id)}
                type="button"
              >
                <strong>{method.name}</strong>
                <span>
                  {methodDetails(method, language)} - {money(method.price, language)}
                </span>
              </button>
            ))}
          </div>

          {selectedShippingMethod?.type === "pickupPoint" ? (
            <div className="pickup-selector">
              <input
                placeholder={c.pickupSearch}
                value={pickupQuery}
                onChange={(event) => setPickupQuery(event.target.value)}
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
              {!pickupLoading && !pickupPoints.length ? (
                <span className="quiet">{c.noPickupPoints}</span>
              ) : null}
            </div>
          ) : null}

          {selectedShippingMethod?.type === "courier" ? (
            <div className="courier-address">
              <strong>{c.courierAddress}</strong>
              <input
                placeholder={c.street}
                value={shippingAddress.streetAddress}
                onChange={(event) => updateAddress({ streetAddress: event.target.value })}
              />
              <div className="address-grid">
                <input
                  placeholder={c.city}
                  value={shippingAddress.locality}
                  onChange={(event) => updateAddress({ locality: event.target.value })}
                />
                <input
                  placeholder={c.region}
                  value={shippingAddress.region}
                  onChange={(event) => updateAddress({ region: event.target.value })}
                />
              </div>
              <div className="address-grid">
                <input
                  placeholder={c.postalCode}
                  value={shippingAddress.postalCode}
                  onChange={(event) => updateAddress({ postalCode: event.target.value })}
                />
                <input
                  placeholder={c.country}
                  value={shippingAddress.country}
                  onChange={(event) => updateAddress({ country: event.target.value.toUpperCase() })}
                />
              </div>
              <div className="address-grid phone-grid">
                <input
                  placeholder={c.phoneCountry}
                  value={shippingAddress.phoneCountryCode}
                  onChange={(event) =>
                    updateAddress({ phoneCountryCode: event.target.value.replace(/\D/g, "") })
                  }
                />
                <input
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

        <div className="checkout-block">
          <h3>{c.payment}</h3>
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

        <label className="check-row">
          <input checked={noVat} onChange={(event) => setNoVat(event.target.checked)} type="checkbox" />
          {c.noVat}
        </label>

        <div className="totals">
          <span>{c.goods}</span>
          <strong>{money(subtotal, language)}</strong>
          <span>PVN</span>
          <strong>{money(vat, language)}</strong>
          <span>{c.shipping}</span>
          <strong>{money(shippingPrice, language)}</strong>
          <span>{c.total}</span>
          <strong>{money(total, language)}</strong>
        </div>

        <button
          className="wide-button"
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
