import { PublicDocument } from "@/components/brickline/public-document";

export default function TermsPage() {
  return (
    <PublicDocument
      eyebrow="TERMS OF USE · CURRENT PRODUCT"
      title="Use Brickline as a research and introduction workspace."
      lead="These terms describe the current prototype and should be reviewed by qualified counsel before commercial launch."
    >
      <section>
        <h2>Purpose</h2>
        <p>
          Brickline organizes project, builder, locality, and introduction
          records for professional research. It is not a government registry,
          legal opinion, investment recommendation, brokerage instruction, or
          guarantee of a project&apos;s status.
        </p>
      </section>
      <section>
        <h2>Accounts and verification</h2>
        <p>
          Use accurate identity, role, company, RERA, GST, and project
          information. Admin approval controls product access; it does not
          replace independent due diligence with the relevant authority. Access
          may be suspended when information is inaccurate, duplicated, or
          misused.
        </p>
      </section>
      <section>
        <h2>Demo and user-submitted records</h2>
        <p>
          Illustrative records are labelled “Demo record.” User-submitted
          records retain a verification badge and may still require independent
          confirmation. Do not present demo content as live market evidence.
        </p>
      </section>
      <section>
        <h2>Timed introductions</h2>
        <p>
          Do not forward account-bound links or attempt to bypass expiry,
          revocation, open limits, or device checks. Protected access is logged
          for security and product analytics.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not scrape protected information, impersonate another professional,
          submit fraudulent registrations, interfere with the service, or use
          data in violation of privacy, property, advertising, or real-estate
          law.
        </p>
      </section>
      <section>
        <h2>Availability and changes</h2>
        <p>
          Features, records, and access may change as the product develops.
          Brickline may correct records, update controls, or pause access to
          protect users and the platform.
        </p>
      </section>
    </PublicDocument>
  );
}
