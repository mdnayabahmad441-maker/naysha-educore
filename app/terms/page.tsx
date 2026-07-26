import Link from "next/link"

export const metadata = {
  title: "Terms of Service – NaySha EduCore",
  description: "Terms of Service for NaySha EduCore School Management Platform",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-300">
      <div className="mx-auto max-w-3xl px-6 py-16">

        <div className="mb-10">
          <Link href="/" className="text-sm text-slate-500 hover:text-white transition">← Back</Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: April 27, 2025</p>

        <div className="space-y-10 text-sm leading-7">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using NaySha EduCore (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
              If you are using the Platform on behalf of a school or organisation, you represent that you have the
              authority to bind that organisation to these terms.
            </p>
            <p className="mt-2">
              If you do not agree to these terms, you must not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              NaySha EduCore is a school management platform that provides tools for managing student records,
              attendance, examinations, fee collection, notices, and parent communication via WhatsApp and email.
              The Platform is offered as a software-as-a-service (SaaS) product to educational institutions.
              NaySha EduCore is a product of Groenics.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Account Registration and Responsibilities</h2>
            <p className="mb-2">To use the Platform, schools must register an account. You agree to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Provide accurate and complete information during registration</li>
              <li>Keep your login credentials confidential and not share them with unauthorised users</li>
              <li>Notify us immediately of any unauthorised access to your account</li>
              <li>Ensure all staff (admins, teachers) using the Platform comply with these terms</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="mb-2">You agree to use the Platform only for lawful school administration purposes. You must not:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Use the Platform to send spam, unsolicited, or misleading messages to parents</li>
              <li>Enter false, fabricated, or misleading student or parent data</li>
              <li>Attempt to access data belonging to other schools or users</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Platform</li>
              <li>Use the Platform in any way that violates applicable Indian or international laws</li>
              <li>Misuse the WhatsApp communication feature for purposes other than school notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Ownership</h2>
            <p>
              All student, parent, and school data you enter into the Platform remains your property.
              Groenics does not claim ownership of your data.
            </p>
            <p className="mt-2">
              You grant us a limited licence to store, process, and transmit your data solely for the purpose
              of operating and providing the Platform&apos;s features. We do not use your data for any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. WhatsApp Integration</h2>
            <p>
              The WhatsApp messaging feature uses the Meta WhatsApp Cloud API. By connecting your WhatsApp
              Business Account, you agree to Meta&apos;s Business Terms of Service and WhatsApp Business Policy.
              You are responsible for ensuring that your use of WhatsApp messaging complies with applicable
              regulations, including obtaining necessary consent from parents to receive WhatsApp messages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Service Availability</h2>
            <p>
              We aim to keep the Platform available at all times but do not guarantee uninterrupted access.
              Scheduled maintenance, third-party outages (Supabase, Vercel, Meta), or unforeseen technical issues
              may cause temporary downtime. We are not liable for losses arising from unavailability of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Groenics shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Platform, including but
              not limited to loss of data, loss of revenue, or reputational damage.
            </p>
            <p className="mt-2">
              Our total liability in any circumstance shall not exceed the amount you paid us in the 3 months
              preceding the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
            <p>
              Either party may terminate the account at any time. Upon termination, your access to the Platform
              will be revoked. We will retain your data for 30 days after termination, after which it will be
              permanently deleted. You may request an export of your data before termination.
            </p>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these terms without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Modifications to the Platform</h2>
            <p>
              We reserve the right to modify, update, or discontinue any feature of the Platform at any time.
              We will make reasonable efforts to notify users of significant changes. Continued use of the Platform
              after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms of Service are governed by the laws of India. Any disputes arising out of or in
              connection with these terms shall be subject to the exclusive jurisdiction of the courts of India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to These Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify you by updating the date
              at the top of this page. If changes are material, we will make reasonable efforts to inform
              account administrators. Continued use of the Platform after updates constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Contact Us</h2>
            <p>
              For any questions about these Terms, please contact:
            </p>
            <p className="mt-2">
              Groenics<br />
              Email:{" "}
              <a href="mailto:nayabshahin1914@gmail.com" className="text-cyan-400 hover:underline">
                nayabshahin1914@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
          <p>
            NaySha EduCore is a product of <span className="font-semibold text-white">Groenics</span>.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex gap-6 text-xs text-slate-600">
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
        </div>

      </div>
    </main>
  )
}
