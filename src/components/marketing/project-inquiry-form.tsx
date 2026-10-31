"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

type InquiryFields = {
  fullName: string;
  companyName: string;
  email: string;
  whatsappNumber: string;
  serviceRequired: string;
  preferredPackage: string;
  projectDescription: string;
  requiredFeatures: string;
  expectedBudget: string;
  desiredDeadline: string;
  referenceWebsite: string;
  preferredContactMethod: "WHATSAPP" | "EMAIL" | "PHONE";
  consent: boolean;
  briefFile: FileList;
};

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100";

export function ProjectInquiryForm({ packageNames = [] }: { packageNames?: string[] }) {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InquiryFields>();

  const submit = handleSubmit(async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "briefFile") {
        if (value instanceof FileList && value[0]) formData.set(key, value[0]);
      } else if (key === "consent") {
        formData.set(key, value ? "true" : "false");
      } else {
        formData.set(key, String(value ?? ""));
      }
    });
    const response = await fetch("/api/project-inquiries", { method: "POST", body: formData });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Your project brief has been received. PPDS will contact you shortly." : payload.error ?? "Could not submit your request.");
    if (response.ok) reset();
  });

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:grid-cols-2 md:p-8">
      <label className="text-sm font-semibold">Full name<input {...register("fullName", { required: true, minLength: 2 })} className={`${inputClass} mt-2`} />{errors.fullName ? <span className="text-xs text-rose-600">Your name is required.</span> : null}</label>
      <label className="text-sm font-semibold">Company<input {...register("companyName")} className={`${inputClass} mt-2`} /></label>
      <label className="text-sm font-semibold">Email<input type="email" {...register("email", { required: true })} className={`${inputClass} mt-2`} /></label>
      <label className="text-sm font-semibold">WhatsApp number<input {...register("whatsappNumber", { required: true })} className={`${inputClass} mt-2`} placeholder="+923001234567" /></label>
      <label className="text-sm font-semibold">Service required<select {...register("serviceRequired", { required: true })} className={`${inputClass} mt-2`}><option value="">Choose service</option><option>Website Development</option><option>Web Application Development</option><option>AI Automation Development</option><option>Mobile Application Development</option><option>Custom Enterprise Software</option></select></label>
      <label className="text-sm font-semibold">Preferred package<select {...register("preferredPackage")} className={`${inputClass} mt-2`}><option value="">Not sure yet</option>{packageNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label className="text-sm font-semibold md:col-span-2">Project description<textarea {...register("projectDescription", { required: true, minLength: 30 })} className={`${inputClass} mt-2 min-h-32`} placeholder="Describe the business problem, users, and expected outcome." />{errors.projectDescription ? <span className="text-xs text-rose-600">Please provide at least 30 characters.</span> : null}</label>
      <label className="text-sm font-semibold md:col-span-2">Required features<textarea {...register("requiredFeatures")} className={`${inputClass} mt-2 min-h-24`} /></label>
      <label className="text-sm font-semibold">Expected budget<input {...register("expectedBudget")} className={`${inputClass} mt-2`} placeholder="Example: PKR 150,000–250,000" /></label>
      <label className="text-sm font-semibold">Desired deadline<input type="date" {...register("desiredDeadline")} className={`${inputClass} mt-2`} /></label>
      <label className="text-sm font-semibold">Reference website<input type="url" {...register("referenceWebsite")} className={`${inputClass} mt-2`} placeholder="https://" /></label>
      <label className="text-sm font-semibold">Preferred contact<select {...register("preferredContactMethod", { required: true })} className={`${inputClass} mt-2`}><option value="WHATSAPP">WhatsApp</option><option value="EMAIL">Email</option><option value="PHONE">Phone</option></select></label>
      <label className="text-sm font-semibold md:col-span-2">Project brief (PDF, DOCX, JPG or PNG; max 10 MB)<input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" {...register("briefFile")} className={`${inputClass} mt-2`} /></label>
      <label className="flex items-start gap-3 text-sm text-slate-600 md:col-span-2"><input type="checkbox" {...register("consent", { required: true })} className="mt-1 size-4" />I consent to PPDS using these details to assess and respond to my project request.</label>
      <div className="md:col-span-2"><button disabled={isSubmitting} className="rounded-full bg-[#0878b9] px-6 py-3 font-bold text-white transition hover:bg-[#075f93] disabled:opacity-60">{isSubmitting ? "Sending…" : "Submit project request"}</button>{message ? <p className="mt-3 text-sm text-slate-600" role="status">{message}</p> : null}</div>
    </form>
  );
}
