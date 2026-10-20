import Link from "next/link";

const sections = [
  {
    title: "General usage and account rules",
    intro: "These rules protect the security and longevity of shared and private accounts.",
    items: [
      ["No credential changes", "Do not change the email address, password, or account settings unless PPDS authorizes it in writing."],
      ["Device limits", "Use only the number of devices included in your plan, such as one device, two devices, or a maximum of three devices."],
      ["No session tampering", "Do not remove, log out, or delete other users' devices, sessions, or chats, especially on shared ChatGPT accounts."],
      ["No unauthorized features", "Do not use restricted tools. For example, Codex use on a supplied ChatGPT account is prohibited unless PPDS explicitly authorizes it."],
      ["Violation", "Violating these rules may result in immediate and permanent access revocation without a refund or replacement."],
    ],
  },
  {
    title: "Warranty policy",
    items: [
      ["Warranty duration", "The warranty period matches the purchased subscription duration: 30 days for one month, 180 days for six months, and 365 days for one year."],
      ["What is covered", "PPDS provides replacement access if an account is blocked, banned, or stops working because of a service-provider issue, subject to these terms."],
      ["What is not covered", "Warranty is void when access is restricted because the customer changed credentials, exceeded device limits, shared access with unauthorized people, or violated the provider's terms."],
      ["Shared-account disclaimer", "Shared services such as Adobe CC Shared or Netflix Shared may occasionally log out or time out. PPDS will manage supported incidents, and customers may request an upgrade to a private or individual plan for the applicable fee."],
    ],
  },
  {
    title: "Payment and order processing",
    items: [
      ["Advance payment", "Most services require payment before activation."],
      ["Pay after login", "Where PPDS explicitly offers this option, the customer must verify access and pay within 24 hours. Unpaid access may be deactivated."],
      ["Payment proof", "Orders requiring manual payment verification are processed only after a clear screenshot showing the transaction ID, amount, and date is submitted through the website."],
      ["Tax invoices", "Payments above PKR 5,000 are eligible for an invoice for tax records upon request."],
      ["Third-party integrations", "For services activated against a customer email, the customer must provide the correct address. PPDS is not responsible for delays caused by incorrect information."],
    ],
  },
  {
    title: "Refunds and cancellations",
    items: [
      ["Refund eligibility", "Refunds are not offered after account details have been delivered and accessed, except when PPDS is completely unable to provide the purchased service."],
      ["Delivery delays", "Vendor outages, electricity shortages, provider enforcement, or mass account bans may delay delivery. PPDS will provide an update and work to resolve the issue."],
      ["Refund timeline", "Approved refunds are processed within 24 to 48 business hours."],
    ],
  },
  {
    title: "Service-specific disclaimers",
    items: [
      ["IPTV and SIM packages", "IPTV trials are for testing only and include no warranty. Jazz, Zong, Ufone, and other SIM packages apply to one specified number and cannot be shared."],
      ["Social media marketing", "PPDS does not guarantee algorithmic results beyond the advertised service. Do not change an account password while an SMM order is processing."],
      ["Web design and marketing", "Custom projects require a 50% upfront deposit unless the written quotation states otherwise. Deliverables, revision limits, and timelines follow the selected package and approved scope."],
    ],
  },
  {
    title: "Limitation of liability",
    items: [
      ["Independent reseller", "PPDS Subscriptions is an independent reseller and is not officially affiliated with Netflix, Adobe, Microsoft, OpenAI, LinkedIn, Spotify, or other referenced providers."],
      ["Customer risk", "To the extent permitted by applicable law, PPDS is not liable for data loss or indirect personal, professional, or financial loss arising from use of supplied accounts or services."],
      ["Provider actions", "PPDS is not responsible for actions taken by an original service provider, including account bans, policy changes, regional restrictions, or IP blocks."],
    ],
  },
  {
    title: "Privacy and security",
    items: [
      ["Customer information", "Names, email addresses, phone numbers, and payment screenshots are used for order processing, support, fraud prevention, and warranty tracking."],
      ["Credential security", "Customers are responsible for protecting purchased credentials. PPDS does not track or log personal chats, files, or browsing history."],
      ["Website delivery", "Order status and credentials are delivered through the authenticated PPDS customer portal, not through WhatsApp."],
    ],
  },
] as const;

export const metadata = { title: "Terms of Service | PPDS Subscriptions", description: "Terms governing PPDS digital subscriptions, payments, warranties, refunds, and account usage." };

export default function TermsPage() {
  return <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8"><header className="rounded-[2.5rem] bg-[#07111f] p-7 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">PPDS Subscriptions</p><h1 className="mt-4 text-4xl font-black tracking-[-.04em] sm:text-6xl">Terms of Service</h1><p className="mt-5 max-w-3xl leading-7 text-slate-300">Pixel Pinnacle Digital Solutions. By purchasing a product or service from PPDS, you acknowledge that you have read, understood, and agreed to these terms.</p><p className="mt-6 text-sm font-bold text-cyan-200">Last updated: October 21, 2026</p></header>
  <div className="mt-8 grid gap-5">{sections.map((section, index) => <article key={section.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan-100 text-sm font-black text-cyan-800">{index + 1}</span><div className="min-w-0 flex-1"><h2 className="text-2xl font-black tracking-tight">{section.title}</h2>{"intro" in section ? <p className="mt-2 text-sm leading-6 text-slate-600">{section.intro}</p> : null}<dl className="mt-6 grid gap-5">{section.items.map(([label, description]) => <div key={label} className="border-l-2 border-cyan-200 pl-4"><dt className="font-bold text-slate-950">{label}</dt><dd className="mt-1 text-sm leading-6 text-slate-600">{description}</dd></div>)}</dl></div></div></article>)}</div>
  <footer className="mt-8 rounded-[2rem] border border-cyan-200 bg-cyan-50 p-7"><h2 className="text-xl font-black">Questions about these terms?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Contact the PPDS Subscriptions team on WhatsApp at 0345 819 7950.</p><Link className="mt-5 inline-block rounded-full bg-[#07111f] px-6 py-3 text-sm font-bold text-white" href="https://wa.me/923458197950">Contact PPDS</Link></footer></section>;
}
