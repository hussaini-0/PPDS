import { getStorefrontContent } from "@/modules/cms/service";

export const metadata = { title: "Frequently Asked Questions | PPDS" };
export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const { faqs } = await getStorefrontContent();
  return <section className="mx-auto max-w-4xl px-4 py-20 lg:px-8"><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">Answers from the PPDS CMS</p><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Frequently asked questions</h1><div className="mt-10 grid gap-3">{faqs.map((faq) => <details key={faq.id} className="group rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer list-none font-bold">{faq.question}<span className="float-right text-amber-600 group-open:rotate-45">+</span></summary><p className="mt-4 leading-7 text-slate-600">{faq.answer}</p></details>)}{faqs.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500">No FAQs are published yet.</p> : null}</div></section>;
}
