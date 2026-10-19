import { ProjectInquiryForm } from "@/components/marketing/project-inquiry-form";
import { getStorefrontContent } from "@/modules/cms/service";

export const metadata = { title: "Request a Software Project | PPDS" };
export const dynamic = "force-dynamic";

export default async function ProjectRequestPage() {
  const { packages } = await getStorefrontContent();
  return <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8"><p className="text-sm font-bold uppercase tracking-[.2em] text-amber-700">Project request</p><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Give us the problem, context, and constraints.</h1><p className="mt-5 max-w-2xl leading-7 text-slate-600">PPDS will review the brief and respond through your preferred contact method. Submission does not create a binding quote.</p><div className="mt-10"><ProjectInquiryForm packageNames={packages.map((item) => item.name)} /></div></section>;
}
