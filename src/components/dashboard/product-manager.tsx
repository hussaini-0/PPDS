import type { Prisma, ProductCategory } from "@prisma/client";

import { ProductMedia } from "@/components/marketing/product-media";
import { Card } from "@/components/ui/card";
import { createProductAction, deleteProductAction, updateProductAction } from "@/app/(app)/dashboard/cms/actions";

const field = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm";
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

function ProductFields({ categories, product }: { categories: ProductCategory[]; product?: ProductWithCategory }) {
  return <>
    <select name="categoryId" className={field} defaultValue={product?.categoryId ?? ""} required><option value="">Category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <div className="grid gap-3 sm:grid-cols-2"><input name="name" className={field} defaultValue={product?.name} placeholder="Product name" required/><input name="slug" className={field} defaultValue={product?.slug} placeholder="product-slug" required/></div>
    <input name="shortDescription" className={field} defaultValue={product?.shortDescription} placeholder="Short description" required/>
    <textarea name="description" className={`${field} min-h-24`} defaultValue={product?.description} placeholder="Full description" required/>
    <div className="grid gap-3 sm:grid-cols-3"><input name="price" className={field} type="number" min="1" step="0.01" defaultValue={product?.price.toString()} placeholder="Price" required/><input name="compareAtPrice" className={field} type="number" min="1" step="0.01" defaultValue={product?.compareAtPrice?.toString()} placeholder="Compare price"/><input name="sortOrder" className={field} type="number" min="0" max="9999" defaultValue={product?.sortOrder ?? 0} placeholder="Display order"/></div>
    <div className="grid gap-3 2xl:grid-cols-2"><div className="rounded-xl border border-zinc-200 p-4"><p className="text-sm font-semibold">Tool logo</p><p className="mt-1 text-xs text-zinc-500">Upload a compact PNG, JPEG, or WebP logo, or enter an existing URL/path.</p><input name="logoFile" className="mt-3 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp"/><input name="logoUrl" className={`${field} mt-3`} defaultValue={product?.logoUrl ?? ""} placeholder="Logo URL or /path/logo.png"/>{product?.logoUrl ? <label className="mt-2 flex items-center gap-2 text-xs text-red-700"><input type="checkbox" name="removeLogo"/> Remove current logo</label> : null}</div>
    <div className="rounded-xl border border-zinc-200 p-4"><p className="text-sm font-semibold">Product card image</p><p className="mt-1 text-xs text-zinc-500">Upload a landscape product image, or enter an existing URL/path.</p><input name="imageFile" className="mt-3 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp"/><input name="imageUrl" className={`${field} mt-3`} defaultValue={product?.imageUrl ?? ""} placeholder="Image URL or /path/image.png"/>{product?.imageUrl ? <label className="mt-2 flex items-center gap-2 text-xs text-red-700"><input type="checkbox" name="removeImage"/> Remove current image</label> : null}</div></div>
    <input name="badge" className={field} defaultValue={product?.badge ?? ""} placeholder="Badge, e.g. New or Preview"/>
    <textarea name="features" className={`${field} min-h-24`} defaultValue={product?.features.join("\n")} placeholder="One feature per line" required/>
    <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured}/> Show in homepage hero</label><label className="flex items-center gap-2"><input type="checkbox" name="isBestSeller" defaultChecked={product?.isBestSeller}/> Best seller</label></div>
    <select name="status" className={field} defaultValue={product?.status ?? "DRAFT"}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
  </>;
}

export function ProductManager({ categories, products }: { categories: ProductCategory[]; products: ProductWithCategory[] }) {
  return <Card>
    <h2 className="text-xl font-semibold">Products, logos and homepage tools</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-600">Published products appear in the store. Up to five published products marked “Show in homepage hero” appear at the top of the landing page, ordered by display order.</p>
    <form action={createProductAction} className="mt-5 grid gap-3" encType="multipart/form-data"><ProductFields categories={categories}/><button className="rounded-xl bg-zinc-950 px-4 py-2 font-bold text-white">Create product</button></form>
    <div className="mt-8 grid gap-3">{products.map((product) => <details key={product.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"><summary className="flex cursor-pointer list-none items-center gap-3"><span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-200 text-xs font-black">{product.logoUrl ? <ProductMedia src={product.logoUrl} alt={`${product.name} logo`} fit="contain" sizes="48px"/> : product.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-sm">{product.name}</strong><span className="text-xs text-zinc-500">{product.category.name} · {product.status} · order {product.sortOrder}{product.isFeatured ? " · homepage" : ""}</span></span><span className="ml-auto text-xs font-bold">Edit</span></summary><form action={updateProductAction} className="mt-5 grid gap-3 border-t border-zinc-200 pt-5" encType="multipart/form-data"><input type="hidden" name="id" value={product.id}/><ProductFields categories={categories} product={product}/><button className="rounded-xl bg-zinc-950 px-4 py-2 font-bold text-white">Save product</button></form><form action={deleteProductAction} className="mt-3"><input type="hidden" name="id" value={product.id}/><button className="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-800">Delete product permanently</button></form></details>)}{products.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">No products yet.</p> : null}</div>
  </Card>;
}
