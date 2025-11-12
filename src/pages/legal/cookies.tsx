
import LegalLayout from "@/components/legalLayout";

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <section>
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files used to enhance user experience by remembering
          preferences and enabling secure sessions.
        </p>

        <h2>2. Types of Cookies</h2>
        <ul>
          <li>Necessary — core site functionality</li>
          <li>Analytics — performance measurement via Google Analytics</li>
          <li>Functional — user preferences and UI settings</li>
        </ul>

        <h2>3. Managing Cookies</h2>
        <p>
          You can manage preferences anytime through your browser or the on-site Cookie
          Manager.
        </p>

        <h2>4. Contact</h2>
        <p>
          For privacy inquiries:{" "}
          <a href="mailto:privacy@hier.in">privacy@hier.in</a>
        </p>
      </section>
    </LegalLayout>
  );
}
