import { connection } from "next/server";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // CMS data belongs to the deployment's runtime database, not the image build.
  await connection();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(24,199,216,.08),transparent_24%),#f3f7fb] text-[#07111f] dark:bg-[radial-gradient(circle_at_top_right,rgba(8,120,185,.18),transparent_28%),#07111f] dark:text-slate-50">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
