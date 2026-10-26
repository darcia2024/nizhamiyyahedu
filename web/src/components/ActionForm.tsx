"use client";
import { createContext, useActionState, useContext, useEffect, useRef, useId, useState } from "react";
import { SubmitButton, FieldError } from "@/components/SubmitButton";
import { idle, type ActionResult } from "@/lib/action";

type Snap = { r: ActionResult; values: Record<string, string | string[]> };
const Ctx = createContext<Snap>({ r: idle, values: {} });

type ActionFn = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/**
 * Form dengan pesan error per field. Nilai yang dikirim disimpan ulang sebagai defaultValue
 * agar isian tidak hilang saat React mereset form setelah action (B1).
 */
export function ActionForm({
  action,
  children,
  submit,
  pendingText = "Menyimpan…",
  className,
  submitClass = "btn btn-primary",
  hideSubmit,
  testId,
}: {
  action: ActionFn;
  children: React.ReactNode;
  submit?: string;
  pendingText?: string;
  className?: string;
  submitClass?: string;
  hideSubmit?: boolean;
  testId?: string;
}) {
  const [snap, formAction] = useActionState<Snap, FormData>(
    async (_prev, fd) => {
      const r = await action(idle, fd);
      const values: Record<string, string | string[]> = {};
      fd.forEach((v, k) => { if (typeof v === "string") { const previous=values[k]; values[k]=previous===undefined?v:Array.isArray(previous)?[...previous,v]:[previous,v]; } });
      return { r, values };
    },
    { r: idle, values: {} },
  );
  const r = snap.r;
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty,setDirty]=useState(false);
  useEffect(()=>{setDirty(false);},[snap]);
  useEffect(()=>{
    if(!dirty)return;
    const leave=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};
    window.addEventListener("beforeunload",leave);
    return()=>window.removeEventListener("beforeunload",leave);
  },[dirty]);
  useEffect(() => {
    if (!r.ok) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.focus();
  }, [r]);
  return (
    <form ref={formRef} action={formAction} className={className ?? "form-grid"} noValidate onChange={()=>setDirty(true)}>
      <Ctx.Provider value={snap}>
        {children}
        {!r.ok && r.error && <div className="alert err-box full" role="alert" tabIndex={-1}>{r.error}</div>}
        {r.ok && r.message && <div className="alert ok-box full" role="status">{r.message}</div>}
        {!hideSubmit && (
          <div className="full" style={{ display: "flex", gap: 10 }}>
            <SubmitButton className={submitClass} pendingText={pendingText} testId={testId}>{submit ?? "Simpan"}</SubmitButton>
          </div>
        )}
      </Ctx.Provider>
    </form>
  );
}

type FieldProps = {
  index?: number;
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "email" | "checkbox" | "password";
  defaultValue?: string | number | boolean | null;
  hint?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  full?: boolean;
  placeholder?: string;
  required?: boolean;
  dir?: "rtl" | "ltr";
  lang?: string;
  maxLength?: number;
  min?: number;
  max?: number;
};

export function Field({ name, label, type = "text", defaultValue, hint, options, rows = 4, full, placeholder, dir, lang, maxLength, min, max, index=0 }: FieldProps) {
  const { r, values } = useContext(Ctx);
  const err = !r.ok ? r.fieldErrors?.[name] : undefined;
  const unique=useId();
  const id = `f-${name}-${unique}`;
  const stored=values[name];
  const dv = (Array.isArray(stored)?stored[index]:stored) ?? (defaultValue == null ? "" : String(defaultValue));
  const common = { id, name, "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-err` : hint ? `${id}-hint` : undefined } as const;

  if (type === "checkbox") {
    const checked = Object.keys(values).length ? values[name] === "on" : Boolean(defaultValue);
    return (
      <div className={full ? "full" : undefined}>
        <label className="check"><input type="checkbox" {...common} defaultChecked={checked} /><span>{label}</span></label>
        <FieldError id={`${id}-err`} message={err} />
      </div>
    );
  }
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {type === "textarea" ? (
        <textarea {...common} className="textarea" rows={rows} defaultValue={dv} placeholder={placeholder} dir={dir} lang={lang} maxLength={maxLength} />
      ) : type === "select" ? (
        <select {...common} className="select" defaultValue={dv}>
          {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input {...common} type={type} className="input" defaultValue={dv} placeholder={placeholder} dir={dir} lang={lang} maxLength={maxLength} min={min} max={max} inputMode={type === "number" ? "numeric" : undefined} />
      )}
      {hint && !err && <span id={`${id}-hint`} className="hint">{hint}</span>}
      <FieldError id={`${id}-err`} message={err} />
    </div>
  );
}

/** Tombol kecil satu-aksi (tanpa field), memakai form tersembunyi dan menampilkan pesan hasil di tempat. */
export function InlineAction({
  action,
  fields,
  label,
  className = "btn btn-ghost sm",
  pendingText = "…",
  testId,
}: {
  action: ActionFn;
  fields: Record<string, string>;
  label: React.ReactNode;
  className?: string;
  pendingText?: string;
  testId?: string;
}) {
  const [snap, formAction] = useActionState<Snap, FormData>(async (_p, fd) => ({ r: await action(idle, fd), values: {} }), { r: idle, values: {} });
  const r = snap.r;
  return (
    <form action={formAction} style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <SubmitButton className={className} pendingText={pendingText} testId={testId}>{label}</SubmitButton>
      {!r.ok && r.error && <span className="err" role="alert">{r.error}</span>}
      {r.ok && r.message && <span className="small" style={{ color: "var(--success)" }} role="status">{r.message}</span>}
    </form>
  );
}
