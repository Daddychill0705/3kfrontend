import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Using 3K Kitchen',
    paragraphs: [
      'These Terms and Conditions apply when you create an account or use the 3K Kitchen website to browse, order, or communicate about an order. By creating an account, you confirm that the information you provide is accurate and that you will keep your sign-in details private.',
      'You must be able to enter into this agreement under applicable law. If you use an account on behalf of another person, you must have permission to do so.'
    ]
  },
  {
    title: '2. Orders and availability',
    paragraphs: [
      'Menu items, prices, participating branches, and availability may change. An order request is subject to branch confirmation. Please review your items, selected branch, order type, delivery details, and total before submitting.',
      'For delivery or pick-up, provide a reachable phone number and accurate order details. Delivery timing is an estimate and may be affected by preparation time, weather, traffic, or other circumstances.'
    ]
  },
  {
    title: '3. Payment',
    paragraphs: [
      'Available online order methods are shown during checkout and may include GCash and cash on delivery. GCash orders may require an uploaded payment receipt for verification. Do not upload payment information that is unrelated to the order.',
      'Cash on delivery is payable when the order is received. An order is considered paid only after the payment has been received or verified by 3K Kitchen.'
    ]
  },
  {
    title: '4. Changes, cancellations, and support',
    paragraphs: [
      'If you need to correct or cancel an order, contact the selected branch as soon as possible using the details on our Contact page. A request may no longer be possible once preparation or dispatch has started. Any refund or remedy will be handled in accordance with applicable law and the circumstances of the order.'
    ]
  },
  {
    title: '5. Acceptable use',
    paragraphs: [
      'Do not misuse the website, interfere with its operation, submit false orders, impersonate another person, or use another customer’s account without permission. We may restrict or suspend access when reasonably necessary to protect customers, staff, or the service.'
    ]
  },
  {
    title: '6. Website content and service changes',
    paragraphs: [
      '3K Kitchen names, logos, menu descriptions, and website content belong to 3K Kitchen or their respective owners. Do not copy or use them commercially without permission.',
      'We may update the website or these Terms. The current version and its effective date will be posted here. Changes apply going forward; your rights under applicable law are not limited by these Terms.'
    ]
  },
  {
    title: '7. Contact',
    paragraphs: [
      'Questions about these Terms? Contact 3K Kitchen at harlyngrace@3kkitchen.com or +63 929 789 9902, or visit the GMA Cavite San Pedro Jeepney Terminal, 4117 Congressional Road, GMA, Cavite.'
    ]
  }
];

export default function Terms() {
  return (
    <main className="min-h-screen bg-3k-bg px-4 py-10 sm:px-6 md:py-16">
      <article className="mx-auto max-w-4xl rounded-2xl border border-[#C9A77C]/30 bg-[#FBFAF4] p-5 shadow-xl shadow-[#4A3422]/10 sm:p-8 md:p-10">
        <Link to="/register" className="mb-6 inline-flex text-sm font-bold text-[#815633] hover:underline">← Back to registration</Link>
        <header className="mb-8 border-b border-[#C9A77C]/25 pb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#A77A50]">3K Kitchen</p>
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Terms and Conditions</h1>
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
          Please also read our <Link to="/privacy" className="font-bold text-[#815633] underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </article>
    </main>
  );
}
