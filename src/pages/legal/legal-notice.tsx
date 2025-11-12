
import LegalLayout from "@/components/legalLayout";

export default function LegalNotice() {
  return (
    <LegalLayout title="Legal Notices & Disclaimers">
      <section>
        <h2>5.1 Intellectual Property Rights</h2>
        <p>
          All hier™ content, trademarks, and logos are protected under Indian IP laws.
        </p>

        <h2>5.3 Third-Party Services</h2>
        <p>
          hier™ integrates Razorpay, Supabase, Resend, and Google Analytics. We are not
          responsible for their data practices.
        </p>

        <h2>5.6 Contact</h2>
        <p>
          Legal Department, THKR Futuretech Pvt. Ltd. <br />
          Email: <a href="mailto:legal@hier.in">legal@hier.in</a> <br />
          Address: Mumbai, Maharashtra, India.
        </p>
      </section>
    </LegalLayout>
  );
}
