import { CatalogBrowser } from "../../components/catalog-browser";

export default function CatalogPage() {
  return (
    <section className="section-shell">
      <div className="section-heading">
        <span className="eyebrow">Каталог</span>
        <h1>Кимоно, пояса, защита и инвентарь для карате</h1>
      </div>
      <CatalogBrowser />
    </section>
  );
}
