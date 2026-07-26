import Link from "next/link"

export const metadata = {
  title: "Privacy Policy - NaySha EduCore",
  description: "Privacy Policy for NaySha EduCore School Management Platform",
}

const contactEmail = "support@naysha.online"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-300">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/login" className="text-sm text-slate-500 transition hover:text-white">
            Back
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mb-10 text-sm text-slate-500">Last updated: July 3, 2026</p>

        <div className="space-y-10 text-sm leading-7">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Who We Are</h2>
            <p>
              NaySha EduCore is a school management platform developed and operated by Groenics.
              This policy explains how NaySha EduCore collects, uses, shares, protects, retains,
              and deletes data in the web app and Android app.
            </p>
            <p className="mt-2">
              Privacy contact:{" "}
              <a href={`mailto:${contactEmail}`} className="text-cyan-400 hover:underline">
                {contactEmail}
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Data We Collect</h2>
            <p className="mb-2">Schools, admins, teachers, and parents may provide or generate:</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-400">
              <li>Account data such as names, email addresses, roles, login identifiers, and authentication records.</li>
              <li>Student data such as name, date of birth, admission details, class, section, roll number, parent details, address, and photo.</li>
              <li>Academic data such as attendance, homework, exams, marks, results, subjects, notices, and certificates.</li>
              <li>Teacher and staff data such as name, email address, phone number, assigned classes, and attendance records.</li>
              <li>Parent or guardian data such as name, phone number, email address, and student relationship.</li>
              <li>Fee and payment records such as fee heads, amounts due, payment dates, receipt numbers, and payment mode. We do not store full card or bank account details.</li>
              <li>Communication data such as email, WhatsApp, notice, OTP, and notification delivery logs.</li>
              <li>School data such as school name, logo, address, phone number, academic year, classes, sections, and school GPS coordinates for attendance setup.</li>
              <li>Location data when an admin sets school coordinates or when a teacher marks attendance using GPS. Location is collected only after the user taps the location button.</li>
              <li>Files uploaded by authorized users, including student photos, school logos, and document templates.</li>
              <li>Basic technical data needed to operate the service, such as session cookies, device/browser information, IP-derived security logs, and error logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. How We Use Data</h2>
            <ul className="list-disc space-y-1 pl-5 text-slate-400">
              <li>To provide school ERP features including admissions, student records, attendance, fees, exams, documents, notices, and reports.</li>
              <li>To authenticate users, manage roles, protect school workspaces, and prevent unauthorized access.</li>
              <li>To send school-related messages by email or WhatsApp, including OTPs, notices, fee reminders, and attendance updates.</li>
              <li>To verify teacher attendance against the configured school location.</li>
              <li>To generate documents, ID cards, receipts, reports, and AI-assisted school content when requested by authorized users.</li>
              <li>To troubleshoot, secure, maintain, and improve the platform.</li>
            </ul>
            <p className="mt-3">
              We do not sell personal or sensitive user data. We do not use student, parent,
              teacher, or school data for advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Sharing and Third Parties</h2>
            <p className="mb-2">
              We share data only as needed to provide the service, comply with law, or protect the
              platform. Service providers may process data for us under their own security and
              privacy terms:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-slate-400">
              <li>Supabase for authentication, database, storage, and backend services.</li>
              <li>Hosting and infrastructure providers used to run the web app and APIs.</li>
              <li>Meta WhatsApp Cloud API for WhatsApp Business messaging requested by schools.</li>
              <li>Resend for authentication email delivery.</li>
              <li>Anthropic when authorized users use AI features for text, insights, or document layout assistance.</li>
              <li>Legal, regulatory, or safety authorities when required by applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Location Data</h2>
            <p>
              NaySha EduCore uses location only for attendance features. Admins may use their
              current location to set school coordinates. Teachers may use their current location
              to check in or check out. We collect latitude, longitude, accuracy, timestamp, and
              distance from the configured school location. We do not collect location in the
              background, and we do not use location for advertising or tracking outside attendance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Security</h2>
            <p>
              We use HTTPS/TLS in transit, provider-managed encryption at rest where available,
              role-based access controls, school-level access checks, and authentication sessions.
              Sensitive operational secrets are stored on the server side. No security method is
              perfect, but we use reasonable technical and organizational safeguards for the data
              handled by the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Cookies and Local Storage</h2>
            <p>
              We use essential cookies and browser storage for login sessions, security checks,
              account routing, user preferences, and short-lived OAuth or verification flows. We do
              not use advertising cookies in the app.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Data Retention and Deletion</h2>
            <p>
              School records are retained while the school account or subscription is active, unless
              deletion is requested earlier by an authorized person. Account deletion requests are
              processed after verification. Associated personal data is deleted within 30 days unless
              we must retain limited records for legal, security, fraud-prevention, accounting, audit,
              or dispute-resolution reasons.
            </p>
            <p className="mt-2">
              You can request deletion from within the app where available, or outside the app through
              our{" "}
              <Link href="/data-deletion" className="text-cyan-400 hover:underline">
                Data Deletion Instructions
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">9. Children and Students</h2>
            <p>
              NaySha EduCore is intended for schools, staff, and parents. Students and children do not
              create public accounts directly. Student data, including data about minors, is provided
              by schools or authorized users for school administration. Parents or guardians may
              contact the school or Groenics to request access, correction, or deletion of their
              child&apos;s data, subject to school records requirements and applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">10. Your Choices and Rights</h2>
            <ul className="list-disc space-y-1 pl-5 text-slate-400">
              <li>Access, correct, or update account and school records through authorized app features.</li>
              <li>Request deletion of account or personal data.</li>
              <li>Withdraw from optional WhatsApp or email communications by contacting the school or Groenics.</li>
              <li>Deny location permission; attendance GPS features will not work without location access.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">11. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will post the updated policy on this
              page with a new effective date. Material changes may also be communicated to school
              administrators through the app or email.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">12. Contact Us</h2>
            <p>
              Groenics
              <br />
              NaySha EduCore privacy contact:{" "}
              <a href={`mailto:${contactEmail}`} className="text-cyan-400 hover:underline">
                {contactEmail}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-16 flex flex-wrap gap-6 border-t border-white/10 pt-8 text-xs text-slate-600">
          <Link href="/privacy" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition hover:text-white">
            Terms of Service
          </Link>
          <Link href="/data-deletion" className="transition hover:text-white">
            Data Deletion
          </Link>
        </div>
      </div>
    </main>
  )
}
