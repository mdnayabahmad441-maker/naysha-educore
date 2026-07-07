import Link from "next/link"

export const metadata = {
  title: "Data Deletion Instructions - NaySha EduCore",
  description: "How to request deletion of your account and personal data from NaySha EduCore",
}

const contactEmail = "support@naysha.online"

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-300">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/login" className="text-sm text-cyan-400 transition-colors hover:text-cyan-300">
            Back
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-white">Data Deletion Instructions</h1>
        <p className="mb-10 text-sm text-slate-500">Last updated: July 3, 2026</p>

        <div className="space-y-8 text-sm leading-7">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Your Right to Delete Data</h2>
            <p>
              NaySha EduCore lets eligible users request deletion of their app account and associated
              personal data. NaySha EduCore is a product of Groenics.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Delete From Inside the App</h2>
            <p>
              School admins can sign in, open Settings, and use Delete Account. Teachers and parents
              can request deletion by email if a delete option is not visible in their role.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Request Deletion Outside the App</h2>
            <p className="mb-4">
              Send an email with the subject line{" "}
              <strong className="text-white">Data Deletion Request</strong>.
            </p>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-5 py-4">
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Email:</span>{" "}
                <a href={`mailto:${contactEmail}`} className="text-cyan-400 transition-colors hover:text-cyan-300">
                  {contactEmail}
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">What to Include</h2>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
              <li>Your full name.</li>
              <li>The email address or phone number associated with your account.</li>
              <li>Your role: school admin, teacher, parent, or guardian.</li>
              <li>The school name connected to your account.</li>
              <li>A short description of the data or account you want deleted.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">What Happens Next</h2>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
              <li>We will acknowledge your request within 3 business days.</li>
              <li>We may verify your identity and authority before deleting school or student records.</li>
              <li>Verified deletion requests are completed within 30 days.</li>
              <li>We will send confirmation after deletion is complete.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Data We May Retain</h2>
            <p>
              We may retain limited records when required for legal, accounting, audit, fraud
              prevention, security, dispute resolution, or school record obligations. Retained data is
              limited to what is necessary for those purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Contact Us</h2>
            <p>
              For questions about deletion, contact{" "}
              <a href={`mailto:${contactEmail}`} className="text-cyan-400 transition-colors hover:text-cyan-300">
                {contactEmail}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="transition-colors hover:text-slate-300">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-slate-300">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  )
}
