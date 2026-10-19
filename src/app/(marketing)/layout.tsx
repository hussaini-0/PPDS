import { connection } from "next/server";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // CMS data belongs to the deployment's runtime database, not the image build.
  await connection();

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-[#07111f]">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
