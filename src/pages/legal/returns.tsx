
import LegalLayout from "@/components/legalLayout";

export default function Returns() {
  return (
    <LegalLayout title="Returns & Refunds Policy">
      <section>
        <h2>4.1 Returns</h2>
        <p>
          Eligible within 7 days of delivery, provided items are unused, unwashed, and in
          original packaging.
        </p>

        <h2>4.2 Refunds</h2>
        <p>
          Processed within 7–10 business days after inspection. Timelines depend on bank
          and gateway policies.
        </p>

        <h2>4.3 Exchanges</h2>
        <p>Allowed for identical products of different sizes, subject to stock.</p>

        <h2>4.6 Damaged Products</h2>
        <p>
          Report within 48 hours of delivery to{" "}
          <a href="mailto:support@hier.in">support@hier.in</a> with order details.
        </p>
      </section>
    </LegalLayout>
  );
}
