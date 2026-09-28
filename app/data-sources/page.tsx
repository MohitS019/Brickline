import { PublicDocument } from "@/components/brickline/public-document";

export default function DataSourcesPage() {
  return (
    <PublicDocument
      eyebrow="DATA SOURCES · TRANSPARENCY NOTE"
      title="Every record should say where it came from."
      lead="Brickline currently combines clearly labelled demo records, approved user submissions, and manually entered area signals."
    >
      <section>
        <h2>Project and builder records</h2>
        <p>
          Approved Builders submit project, locality, status, RERA, pricing,
          inventory, and completion information. Account and project
          verification states are shown separately. Demo records are
          illustrative and remain labelled throughout the product.
        </p>
      </section>
      <section>
        <h2>Area intelligence</h2>
        <p>
          Area scores are calculated from the project volume and recorded
          development stages in the shared workspace. They are product
          indicators, not official valuations or independent market forecasts.
        </p>
      </section>
      <section>
        <h2>Map and geocoding</h2>
        <p>
          Interactive maps use MapLibre with basemap data © OpenStreetMap
          contributors. New India project addresses are geocoded through an
          OpenStreetMap-compatible geocoder. Map positions should be checked
          before making site or investment decisions.
        </p>
      </section>
      <section>
        <h2>Manual signals</h2>
        <p>
          Administrators can publish checked area signals with a source note and
          event date. Brickline does not currently claim automated,
          comprehensive ingestion from every RERA authority, municipal body, or
          builder.
        </p>
      </section>
      <section>
        <h2>Corrections</h2>
        <p>
          Users can request correction or deletion through the Privacy page.
          Administrators can update or remove records when their source, status,
          or ownership cannot be supported.
        </p>
      </section>
    </PublicDocument>
  );
}
