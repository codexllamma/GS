import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, url: string) {
  try {
    await resend.emails.send({
      from: "no-reply@yourdomain.com",
      to: email,
      subject: "Verify your email - Golden Style",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Welcome to Golden Style</h2>
          <p>Click below to verify your email:</p>
          <a href="${url}" 
             style="display:inline-block;padding:10px 20px;background:#f59e0b;color:white;text-decoration:none;border-radius:8px;">
            Verify Email
          </a>
          <p>This link expires in 1 hour.</p>
        </div>
      `,
    });
    console.log(`Verification email sent to ${email}`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
