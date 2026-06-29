import Link from "next/link"

export const metadata = {
  title: "Data Deletion Instructions – NaySha EduCore",
  description: "How to request deletion of your personal data from NaySha EduCore",
}

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-300">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-white">
          Data Deletion Instructions
        </h1>
        <p className="mb-10 text-sm text-slate-500">
          Last updated: May 2026
        </p>

        <div className="space-y-8 text-sm leading-7">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Your Right to Data Deletion
            </h2>
            <p>
              NaySha EduCore respects your privacy and your right to have your
              personal data deleted from our systems. If you would like us to
              delete all personal data associated with your account, please
              follow the steps below.
            </p>
            <p className="mt-3">
              NaySha EduCore is a product of <span className="font-semibold text-white">Groenics</span>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              How to Request Data Deletion
            </h2>
            <p className="mb-4">
              To request deletion of your personal data, send an email to our
              support team with the subject line{" "}
              <strong className="text-white">"Data Deletion Request"</strong>.
            </p>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-5 py-4">
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Email:</span>{" "}
                <a
                  href="mailto:support@naysha.online"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  support@naysha.online
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              What to Include in Your Request
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
              <li>Your full name</li>
              <li>The email address associated with your account</li>
              <li>The name of the school your account belongs to</li>
              <li>A brief description of what data you want deleted</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              What Happens Next
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
              <li>We will acknowledge your request within <strong className="text-white">3 business days</strong>.</li>
              <li>Your data will be permanently deleted within <strong className="text-white">30 days</strong> of your verified request.</li>
              <li>You will receive a confirmation email once deletion is complete.</li>
              <li>Some data may be retained for legal or regulatory obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Data We May Retain
            </h2>
            <p>
              Even after a deletion request, we may retain certain data as
              required by law, including transaction records, audit logs, and
              any information needed to resolve disputes or comply with legal
              obligations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Contact Us
            </h2>
            <p>
              If you have any questions about this process, contact us at{" "}
              <a
                href="mailto:support@naysha.online"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                support@naysha.online
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
          <p>
            NaySha EduCore is a product of <span className="font-semibold text-white">Groenics</span>.
          </p>
        </div>

        <div className="mt-12 flex gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-300 transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  )
}
