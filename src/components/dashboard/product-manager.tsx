import type { Prisma, ProductCategory } from "@prisma/client";
import { ChevronDown, ImageIcon, PackagePlus, Pencil, Trash2 } from "lucide-react";

import { createProductAction, deleteProductAction, updateProductAction } from "@/app/(app)/dashboard/cms/actions";
import { ProductMedia } from "@/components/marketing/product-media";
import { Card } from "@/components/ui/card";

const field = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500";
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

function ProductFields({ categories, product }: { categories: ProductCategory[]; product?: ProductWithCategory }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Product name<input name="name" className={field} defaultValue={product?.name} placeholder="e.g. ChatGPT Plus" required /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">URL slug<input name="slug" className={field} defaultValue={product?.slug} placeholder="chatgpt-plus" required /></label>
      </div>
      <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Category<select name="categoryId" className={field} defaultValue={product?.categoryId ?? ""} required><option value="">Choose a category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Card description<input name="shortDescription" className={field} defaultValue={product?.shortDescription} placeholder="One sentence shown in the store" required /></label>
      <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Full description<textarea name="description" className={`${field} min-h-24`} defaultValue={product?.description} placeholder="Full product details" required /></label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Price<input name="price" className={field} type="number" min="1" step="0.01" defaultValue={product?.price.toString()} required /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Old price <span className="font-normal text-zinc-400">optional</span><input name="compareAtPrice" className={field} type="number" min="1" step="0.01" defaultValue={product?.compareAtPrice?.toString()} /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Display order<input name="sortOrder" className={field} type="number" min="0" max="9999" defaultValue={product?.sortOrder ?? 0} /></label>
      </div>

      <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold"><ImageIcon className="size-4 text-cyan-700" /> Logo and product image <ChevronDown className="ml-auto size-4" /></summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4"><p className="text-sm font-semibold">Tool logo</p><p className="mt-1 text-xs text-zinc-500">PNG, JPEG, WebP, or an existing path.</p><input name="logoFile" className="mt-3 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp" /><input name="logoUrl" className={`${field} mt-3`} defaultValue={product?.logoUrl ?? ""} placeholder="Logo URL or /path/logo.png" />{product?.logoUrl ? <label className="mt-2 flex items-center gap-2 text-xs text-red-700"><input type="checkbox" name="removeLogo" /> Remove current logo</label> : null}</div>
          <div className="rounded-xl bg-white p-4"><p className="text-sm font-semibold">Card image</p><p className="mt-1 text-xs text-zinc-500">Optional landscape image for product pages.</p><input name="imageFile" className="mt-3 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp" /><input name="imageUrl" className={`${field} mt-3`} defaultValue={product?.imageUrl ?? ""} placeholder="Image URL or /path/image.png" />{product?.imageUrl ? <label className="mt-2 flex items-center gap-2 text-xs text-red-700"><input type="checkbox" name="removeImage" /> Remove current image</label> : null}</div>
        </div>
      </details>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Badge <span className="font-normal text-zinc-400">optional</span><input name="badge" className={field} defaultValue={product?.badge ?? ""} placeholder="New, Popular, Sale..." /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Publication status<select name="status" className={field} defaultValue={product?.status ?? "DRAFT"}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label className="grid gap-1.5 text-xs font-semibold text-zinc-600">Features <span className="font-normal text-zinc-400">one per line</span><textarea name="features" className={`${field} min-h-24`} defaultValue={product?.features.join("\n")} required /></label>
      <div className="flex flex-wrap gap-5 rounded-xl bg-zinc-50 p-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} /> Feature on homepage</label><label className="flex items-center gap-2"><input type="checkbox" name="isBestSeller" defaultChecked={product?.isBestSeller} /> Mark as best seller</label></div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-100 text-emerald-700";
  if (status === "ARCHIVED") return "bg-zinc-200 text-zinc-600";
  return "bg-amber-100 text-amber-700";
}

export function ProductManager({ categories, products }: { categories: ProductCategory[]; products: ProductWithCategory[] }) {
  const published = products.filter((product) => product.status === "PUBLISHED").length;

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-semibold">Products</h2><p className="mt-1 text-sm text-zinc-500">{products.length} total · {published} live</p></div>
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white"><PackagePlus className="size-4" /> Add product</summary>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 lg:min-w-[680px]"><h3 className="mb-4 font-semibold">Create a product</h3><form action={createProductAction} className="grid gap-4"><ProductFields categories={categories} /><button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-cyan-400">Create product</button></form></div>
        </details>
      </div>

      <div className="grid gap-2 p-3 sm:p-5">
        {products.map((product) => (
          <details key={product.id} className="group rounded-2xl border border-zinc-200 bg-white open:bg-zinc-50">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3 sm:p-4">
              <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-zinc-200 bg-white text-xs font-black">{product.logoUrl ? <ProductMedia src={product.logoUrl} alt={`${product.name} logo`} fit="contain" sizes="44px" /> : product.name.slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{product.name}</strong><span className="mt-0.5 block truncate text-xs text-zinc-500">{product.category.name} · order {product.sortOrder}{product.isFeatured ? " · homepage" : ""}</span></span>
              <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:block ${statusClass(product.status)}`}>{product.status}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-zinc-500"><Pencil className="size-3.5" /> Edit</span>
            </summary>
            <div className="border-t border-zinc-200 p-4 sm:p-5"><form action={updateProductAction} className="grid gap-4"><input type="hidden" name="id" value={product.id} /><ProductFields categories={categories} product={product} /><button className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white">Save changes</button></form><form action={deleteProductAction} className="mt-3"><input type="hidden" name="id" value={product.id} /><button className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700"><Trash2 className="size-4" /> Delete permanently</button></form></div>
          </details>
        ))}
        {products.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">No products yet.</p> : null}
      </div>
    </Card>
  );
}
