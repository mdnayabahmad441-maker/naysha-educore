import Link from "next/link"

export const metadata = {
  title: "Privacy Policy – NaySha EduCore",
  description: "Privacy Policy for NaySha EduCore School Management Platform",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-300">
      <div className="mx-auto max-w-3xl px-6 py-16">

        <div className="mb-10">
          <Link href="/" className="text-sm text-slate-500 hover:text-white transition">← Back</Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: April 27, 2025</p>

        <div className="space-y-10 text-sm leading-7">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              NaySha EduCore is a school management platform developed and operated by NaySha Technologies.
              We provide school administration tools including student records, attendance tracking, fee management,
              examination results, notices, and WhatsApp/email communication services.
            </p>
            <p className="mt-2">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:nayabshahin1914@gmail.com" className="text-cyan-400 hover:underline">
                nayabshahin1914@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect the following categories of information when schools use our platform:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><span className="text-slate-300 font-medium">Student data:</span> name, date of birth, class, roll number, admission details, photo</li>
              <li><span className="text-slate-300 font-medium">Parent/guardian data:</span> name, email address, phone number</li>
              <li><span className="text-slate-300 font-medium">Academic data:</span> attendance records, exam marks, results, subjects</li>
              <li><span className="text-slate-300 font-medium">Financial data:</span> fee records, payment history, fee types and amounts</li>
              <li><span className="text-slate-300 font-medium">Communication data:</span> notices sent, WhatsApp and email notification logs</li>
              <li><span className="text-slate-300 font-medium">School data:</span> school name, logo, academic year, class structure</li>
              <li><span className="text-slate-300 font-medium">Account data:</span> admin and teacher email addresses, hashed passwords</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>To operate and maintain school administration features</li>
              <li>To send fee reminders, attendance alerts, and notices to parents via WhatsApp and email</li>
              <li>To generate reports, ID cards, and academic result documents</li>
              <li>To authenticate and authorise school admins, teachers, and parents</li>
              <li>To improve the platform and fix issues</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Storage and Security</h2>
            <p>
              All data is stored securely on <span className="text-white font-medium">Supabase</span> (PostgreSQL),
              hosted on AWS infrastructure. Data is encrypted at rest and in transit (TLS/HTTPS).
              Row-level security policies are enforced so each school can only access its own data.
            </p>
            <p className="mt-2">
              WhatsApp integration uses the Meta WhatsApp Cloud API. Access tokens for WhatsApp Business Accounts
              are stored encrypted in our database and are only used to send messages on behalf of the school that connected them.
            </p>
            <p className="mt-2">
              Email delivery is handled via Resend or Gmail SMTP. No email content is stored by us beyond notification logs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              Data is retained for as long as the school account is active. Schools may request deletion of their
              data at any time by contacting us. Student records, attendance, and fee history are retained
              for the duration of the school's subscription and deleted within 30 days of account closure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. WhatsApp and Meta</h2>
            <p>
              When a school connects their WhatsApp Business Account, we collect and store their WhatsApp Business
              Account ID, Phone Number ID, and access token via Meta's OAuth flow. This information is used solely
              to send WhatsApp messages (fee reminders, attendance alerts, notices) to parents on behalf of that school.
            </p>
            <p className="mt-2">
              We do not access or store the content of any incoming WhatsApp messages beyond what is necessary
              for webhook event logging.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication (session tokens) and short-lived cookies during the
              WhatsApp OAuth connection flow (state verification). We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for WhatsApp/email communications</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:nayabshahin1914@gmail.com" className="text-cyan-400 hover:underline">
                nayabshahin1914@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>
              NaySha EduCore stores student records which may include data about minors. This data is provided
              by the school and is used solely for school administration. We do not allow children to create
              accounts directly on the platform. Parents may contact us to review or delete their child's data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated date. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              NaySha Technologies<br />
              Email:{" "}
              <a href="mailto:nayabshahin1914@gmail.com" className="text-cyan-400 hover:underline">
                nayabshahin1914@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex gap-6 text-xs text-slate-600">
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
        </div>

      </div>
    </main>
  )
}
