import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Who is responsible for your information',
    paragraphs: [
      '3K Kitchen, GMA Cavite, is responsible for personal information collected through this website. For privacy questions or requests, contact harlyngrace@3kkitchen.com or +63 929 789 9902.'
    ]
  },
  {
    title: '2. Information we collect',
    paragraphs: [
      'When you create an account, we collect your first name, last name, email address, and password. Passwords are stored as password hashes rather than readable passwords. If you later add profile information, this may include your phone number and date of birth.',
      'When you place an order, we process the items and quantities ordered, order total, selected branch, order type, delivery address and contact number when provided, notes, and payment method. For GCash orders, you may upload a receipt image for payment verification. Order-related chat messages are also stored so the customer, cashier, and rider can coordinate the order.'
    ]
  },
  {
    title: '3. How we use information',
    paragraphs: [
      'We use this information to create and secure your account, accept and prepare orders, verify payments, arrange pick-up or delivery, coordinate with the cashier or rider, respond to support requests, and maintain the operation and security of the service.'
    ]
  },
  {
    title: '4. Who may receive information',
    paragraphs: [
      'Order details are made available to authorized 3K Kitchen staff who need them to prepare, confirm, or deliver the order. Delivery details may be shared with the assigned rider. We also use service providers to host the website and database; uploaded GCash receipt images are handled by Cloudinary. These providers process information to support the service and under their own service terms.'
    ]
  },
  {
    title: '5. Browser storage and security',
    paragraphs: [
      'The website uses browser local storage to keep your sign-in session and cart working. Clearing browser storage may sign you out or clear your saved cart. We use reasonable safeguards to protect information, but no website or internet transmission can be guaranteed completely secure.'
    ]
  },
  {
    title: '6. Retention',
    paragraphs: [
      'We retain account, order, payment-verification, and communication records for as long as reasonably needed to provide the service, resolve order issues, maintain business records, and meet applicable legal requirements. When information is no longer needed for those purposes, we will take steps to delete or anonymize it, subject to applicable requirements.'
    ]
  },
  {
    title: '7. Your privacy rights',
    paragraphs: [
      'Under the Philippine Data Privacy Act of 2012, you may have rights to be informed, access or correct your information, object to certain processing, request erasure or blocking where applicable, and lodge a complaint with the National Privacy Commission. These rights are subject to the conditions and exceptions provided by law. To make a request, contact us using the details above.'
    ]
  },
  {
    title: '8. Updates to this policy',
    paragraphs: [
      'We may update this Privacy Policy when our services or information practices change. The current version and effective date will be posted here.'
    ]
  }
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-3k-bg px-4 py-10 sm:px-6 md:py-16">
      <article className="mx-auto max-w-4xl rounded-2xl border border-[#C9A77C]/30 bg-[#FBFAF4] p-5 shadow-xl shadow-[#4A3422]/10 sm:p-8 md:p-10">
        <Link to="/register" className="mb-6 inline-flex text-sm font-bold text-[#815633] hover:underline">← Back to registration</Link>
        <header className="mb-8 border-b border-[#C9A77C]/25 pb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#A77A50]">3K Kitchen</p>
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-gray-500">Effective date: November 10, 2026</p>
        </header>
        <div className="space-y-7 text-sm leading-7 text-gray-700 sm:text-base">
          {sections.map(section => (
            <section key={section.title}>
              <h2 className="mb-2 text-lg font-extrabold text-gray-900">{section.title}</h2>
              {section.paragraphs.map(paragraph => <p key={paragraph} className="mb-2 last:mb-0">{paragraph}</p>)}
            </section>
          ))}
        </div>
        <p className="mt-8 border-t border-[#C9A77C]/25 pt-5 text-sm text-gray-600">
          This policy is intended to explain our practices under the <a href="https://officialgazette.gov.ph/2012/15/republic-act-no-10173" target="_blank" rel="noreferrer" className="font-bold text-[#815633] underline underline-offset-2">Philippine Data Privacy Act of 2012</a>. Learn more about <a href="https://privacy.gov.ph/data-subject-rights/" target="_blank" rel="noreferrer" className="font-bold text-[#815633] underline underline-offset-2">your data privacy rights</a> from the National Privacy Commission, or read our <Link to="/terms" className="font-bold text-[#815633] underline underline-offset-2">Terms and Conditions</Link>.
        </p>
      </article>
    </main>
  );
}
