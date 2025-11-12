
import LegalLayout from "@/components/legalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <section>
        <h2>2.1 Introduction</h2>
        <p>
          This Privacy Policy describes how THKR Futuretech Pvt. Ltd. (OPC) (“we”, “us”,
          or “our”) collects, uses, stores, and protects personal information through its
          brand hier™ and related digital platforms. By using our Website, you consent to
          this Policy.
        </p>

        <h2>2.2 Data Collection</h2>
        <ul>
          <li>Personal details (name, email, address, phone number).</li>
          <li>Transactional data (orders, payments, timestamps).</li>
          <li>Device and browser data (IP address, cookies, session data).</li>
          <li>Authentication data via NextAuth.</li>
          <li>Communication data (email verification via Resend).</li>
          <li>Analytical data via Google Analytics.</li>
        </ul>

        <h2>2.3 Use of Data</h2>
        <p>
          Data is used for account management, order processing, payments via Razorpay,
          analytics, and communication purposes.
        </p>

        <h2>2.4 Data Storage & Security</h2>
        <p>
          Data is securely stored via Supabase, Prisma, and PostgreSQL, with
          industry-standard encryption.
        </p>

        <h2>2.5 Data Sharing</h2>
        <p>
          We may share limited data with trusted partners: Razorpay, Google, Resend, and
          logistics providers.
        </p>

        <h2>2.6 Legal Basis & User Rights</h2>
        <p>
          Users can request access, correction, or deletion of their data via{" "}
          <a href="mailto:privacy@hier.in">privacy@hier.in</a>.
        </p>

        <h2>2.7 Retention & Updates</h2>
        <p>
          Data is retained as required by law and updated periodically. Continued use of
          the Website implies consent.
        </p>
      </section>
    </LegalLayout>
  );
}
