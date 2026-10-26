import Link from "next/link";
import { Boxes, FileText, HelpCircle, Inbox, Layers3, PackagePlus, Search, UsersRound } from "lucide-react";

import { ProductManager } from "@/components/dashboard/product-manager";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { requireSession } from "@/modules/auth/session";

import { createCategoryAction, createFaqAction, createPackageAction, createTestimonialAction, installPpdsCatalogueAction, savePageContentAction, setCmsStatusAction, updateInquiryStatusAction } from "./actions";

const field = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500";
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const sections = [
  { id: "products", label: "Products", icon: Boxes },
  { id: "software", label: "Packages & FAQs", icon: Layers3 },
  { id: "content", label: "Website content", icon: FileText },
  { id: "leads", label: "Enquiries", icon: Inbox },
] as const;

function StatusControl({ id, entity, status }: { id: string; entity: string; status: string }) {
  return <form action={setCmsStatusAction} className="flex shrink-0 gap-2"><input type="hidden" name="id" value={id} /><input type="hidden" name="entity" value={entity} /><select name="status" defaultValue={status} className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs">{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-white">Save</button></form>;
}

export default async function CmsPage({ searchParams }: { searchParams: Promise<{ section?: string; q?: string }> }) {
  const { section = "products", q = "" } = await searchParams;
  const activeSection = sections.some((item) => item.id === section) ? section : "products";
  const session = await requireSession();
  const businessId = session.user.businessId;
  const [categories, products, packages, faqs, testimonials, pages, inquiries, subscribers] = await Promise.all([
    prisma.productCategory.findMany({ where: { businessId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({ where: { businessId }, include: { category: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.developmentPackage.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.faq.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.testimonial.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
    prisma.cmsPage.findMany({ where: { businessId }, orderBy: { updatedAt: "desc" } }),
    prisma.projectInquiry.findMany({ where: { businessId }, include: { briefFile: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.newsletterSubscriber.count({ where: { businessId, isActive: true } }),
  ]);
  const query = q.trim().toLowerCase();
  const visibleProducts = query ? products.filter((product) => `${product.name} ${product.category.name}`.toLowerCase().includes(query)) : products;
  const publishedProducts = products.filter((product) => product.status === "PUBLISHED").length;
  const newInquiries = inquiries.filter((inquiry) => inquiry.status === "NEW").length;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] bg-zinc-950 p-5 text-white sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Website CMS</p>
        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-semibold">Manage your website</h1><p className="mt-2 max-w-2xl text-sm text-zinc-400">Choose one area below. Published products, packages, and FAQs are also available to the WhatsApp bot.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl bg-white/8 px-3 py-2"><strong className="block text-lg">{publishedProducts}</strong><span className="text-[11px] text-zinc-400">Live products</span></div><div className="rounded-xl bg-white/8 px-3 py-2"><strong className="block text-lg">{packages.length}</strong><span className="text-[11px] text-zinc-400">Packages</span></div><div className="rounded-xl bg-white/8 px-3 py-2"><strong className="block text-lg">{newInquiries}</strong><span className="text-[11px] text-zinc-400">New enquiries</span></div><div className="rounded-xl bg-white/8 px-3 py-2"><strong className="block text-lg">{subscribers}</strong><span className="text-[11px] text-zinc-400">Subscribers</span></div></div></div>
      </section>

      <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm lg:grid-cols-4" aria-label="CMS sections">
        {sections.map(({ id, label, icon: Icon }) => <Link key={id} href={`/dashboard/cms?section=${id}`} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${activeSection === id ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50"}`}><Icon className="size-4" /> {label}</Link>)}
      </nav>

      {activeSection === "products" ? <div className="space-y-5">
        <Card className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-semibold">Product catalogue</h2><p className="mt-1 text-sm text-zinc-500">Search products, edit a row, or add a new product. Imported starter products remain drafts until you set a real price and publish them.</p></div><div className="flex flex-col gap-2 sm:flex-row"><form action="/dashboard/cms" className="flex min-w-0 items-center rounded-xl border border-zinc-300 bg-white px-3"><input type="hidden" name="section" value="products" /><Search className="size-4 text-zinc-400" /><input name="q" defaultValue={q} className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" placeholder="Search products" /></form><form action={installPpdsCatalogueAction}><button className="w-full rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-800 hover:bg-cyan-100">Import missing starter products</button></form></div></div></Card>

        <details className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><span><strong className="block">Categories</strong><span className="mt-1 block text-sm text-zinc-500">{categories.length} categories · open to manage</span></span><Badge>{categories.length}</Badge></summary>
          <div className="grid gap-5 border-t border-zinc-200 p-5 lg:grid-cols-[minmax(260px,.7fr)_1.3fr]"><form action={createCategoryAction} className="grid content-start gap-3 rounded-2xl bg-zinc-50 p-4"><h3 className="font-semibold">New category</h3><input name="name" className={field} placeholder="Category name" required /><input name="slug" className={field} placeholder="category-slug" required /><input name="icon" className={field} placeholder="Short icon label" /><textarea name="description" className={field} placeholder="Description" /><select name="status" className={field}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white">Create category</button></form><div className="grid content-start gap-2">{categories.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium">{item.name}</span><StatusControl id={item.id} entity="category" status={item.status} /></div>)}</div></div>
        </details>

        <ProductManager categories={categories} products={visibleProducts} />
      </div> : null}

      {activeSection === "software" ? <section className="grid items-start gap-5 xl:grid-cols-2">
        <Card><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Development packages</h2><p className="mt-1 text-sm text-zinc-500">{packages.length} packages</p></div><PackagePlus className="size-5 text-cyan-700" /></div><details className="mt-5 rounded-2xl border border-zinc-200"><summary className="cursor-pointer list-none p-4 text-sm font-bold">+ Add package</summary><form action={createPackageAction} className="grid gap-3 border-t border-zinc-200 p-4"><input name="name" className={field} placeholder="Package name" required /><input name="slug" className={field} placeholder="package-slug" required /><input name="serviceType" className={field} placeholder="Service type" required /><input name="audience" className={field} placeholder="Who it is for" required /><textarea name="summary" className={field} placeholder="Summary" required /><textarea name="features" className={field} placeholder="One feature per line" required /><input name="startingPrice" type="number" min="1" className={field} placeholder="Starting price (optional)" /><div className="grid gap-2 sm:grid-cols-3"><input name="timeline" className={field} placeholder="Timeline" required /><input name="revisions" className={field} placeholder="Revisions" required /><input name="supportPeriod" className={field} placeholder="Support" required /></div><label className="text-sm"><input type="checkbox" name="isFeatured" /> Featured package</label><select name="status" className={field}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-xl bg-zinc-950 px-4 py-2.5 font-bold text-white">Create package</button></form></details><div className="mt-4 grid gap-2">{packages.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium">{item.name}</span><StatusControl id={item.id} entity="package" status={item.status} /></div>)}</div></Card>

        <Card><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Bot-ready FAQs</h2><p className="mt-1 text-sm text-zinc-500">{faqs.length} approved answers</p></div><HelpCircle className="size-5 text-cyan-700" /></div><details className="mt-5 rounded-2xl border border-zinc-200"><summary className="cursor-pointer list-none p-4 text-sm font-bold">+ Add FAQ</summary><form action={createFaqAction} className="grid gap-3 border-t border-zinc-200 p-4"><input name="category" className={field} placeholder="Category" required /><input name="question" className={field} placeholder="Question" required /><textarea name="answer" className={`${field} min-h-28`} placeholder="Approved answer" required /><input name="keywords" className={field} placeholder="keywords, comma separated" required /><select name="status" className={field}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-xl bg-zinc-950 px-4 py-2.5 font-bold text-white">Create FAQ</button></form></details><div className="mt-4 grid gap-2">{faqs.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium">{item.question}</span><StatusControl id={item.id} entity="faq" status={item.status} /></div>)}</div></Card>
      </section> : null}

      {activeSection === "content" ? <section className="grid items-start gap-5 xl:grid-cols-2">
        <Card><h2 className="text-xl font-semibold">Page content</h2><p className="mt-1 text-sm text-zinc-500">Update homepage and information-page copy.</p><details className="mt-5 rounded-2xl border border-zinc-200"><summary className="cursor-pointer list-none p-4 text-sm font-bold">+ Add or update page content</summary><form action={savePageContentAction} className="grid gap-3 border-t border-zinc-200 p-4"><input name="key" className={field} placeholder="Unique key, e.g. homepage-intro" required /><input name="title" className={field} placeholder="Title" required /><input name="summary" className={field} placeholder="Summary" /><textarea name="body" className={`${field} min-h-32`} placeholder="Body content" required /><select name="status" className={field}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-xl bg-zinc-950 px-4 py-2.5 font-bold text-white">Save content</button></form></details><div className="mt-4 grid gap-2">{pages.map((item) => <div key={item.id} className="rounded-xl bg-zinc-50 p-3"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-zinc-500">{item.key} · {item.status}</p></div>)}</div></Card>

        <Card><h2 className="text-xl font-semibold">Testimonials</h2><p className="mt-1 text-sm text-zinc-500">Publish only verified customer statements.</p><details className="mt-5 rounded-2xl border border-zinc-200"><summary className="cursor-pointer list-none p-4 text-sm font-bold">+ Add testimonial</summary><form action={createTestimonialAction} className="grid gap-3 border-t border-zinc-200 p-4"><input name="customerName" className={field} placeholder="Customer name" required /><input name="customerRole" className={field} placeholder="Role or context" /><textarea name="quote" className={`${field} min-h-28`} placeholder="Testimonial" required /><input name="rating" type="number" min="1" max="5" defaultValue="5" className={field} /><label className="text-sm"><input type="checkbox" name="isVerified" /> Verified customer statement</label><select name="status" className={field}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="rounded-xl bg-zinc-950 px-4 py-2.5 font-bold text-white">Create testimonial</button></form></details><div className="mt-4 grid gap-2">{testimonials.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium">{item.customerName}</span><StatusControl id={item.id} entity="testimonial" status={item.status} /></div>)}</div></Card>
      </section> : null}

      {activeSection === "leads" ? <Card><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Project enquiries</h2><p className="mt-1 text-sm text-zinc-500">{inquiries.length} recent · {newInquiries} new</p></div><UsersRound className="size-5 text-cyan-700" /></div><div className="mt-5 grid gap-3">{inquiries.map((item) => <article key={item.id} className="rounded-2xl border border-zinc-200 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.fullName}</p><Badge tone={item.status === "NEW" ? "warning" : "neutral"}>{item.status}</Badge></div><p className="mt-1 text-sm text-zinc-500">{item.serviceRequired} · {formatDate(item.createdAt)}</p><p className="mt-3 text-sm leading-6">{item.projectDescription}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500"><span>{item.email}</span><span>{item.whatsappNumber}</span>{item.briefFile ? <span>Brief: {item.briefFile.originalName}</span> : null}</div></div><form action={updateInquiryStatusAction} className="flex shrink-0 gap-2"><input type="hidden" name="id" value={item.id} /><select name="status" defaultValue={item.status} className={field}>{["NEW", "REVIEWING", "QUOTED", "WON", "LOST", "CLOSED"].map((status) => <option key={status}>{status}</option>)}</select><button className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-bold text-white">Update</button></form></div></article>)}{!inquiries.length ? <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">No project enquiries yet.</p> : null}</div></Card> : null}
    </div>
  );
}
