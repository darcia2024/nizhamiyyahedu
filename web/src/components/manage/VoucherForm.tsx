"use client";
import { useState } from "react";
import { ActionForm, Field } from "@/components/ActionForm";
import { saveVoucher } from "@/app/actions/admin-vouchers";

const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `NZ-${Array.from(bytes, (b) => CODE_LETTERS[b % CODE_LETTERS.length]).join("")}`;
}

/** Isiannya mengikuti form "Buat Diskon" di Mayar, supaya pengelola tidak perlu belajar ulang. */
export function VoucherForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [discountType, setDiscountType] = useState("PERCENT");
  const [productType, setProductType] = useState("ALL");
  const [couponType, setCouponType] = useState("SINGLE");
  const [customerType, setCustomerType] = useState("ALL");
  const [code, setCode] = useState("");
  return (
    <ActionForm action={saveVoucher} submit="Buat diskon">
      <Field name="name" label="Nama diskon" maxLength={120} placeholder="Contoh: Diskon murid lama" full />
      <div className="field full">
        <label htmlFor="v-product">Untuk produk</label>
        <select id="v-product" name="productType" className="select" value={productType} onChange={(e) => setProductType(e.target.value)}>
          <option value="ALL">Semua kelas</option>
          <option value="SELECTED">Kelas tertentu</option>
        </select>
        {productType === "SELECTED" && (
          <div className="voucher-courses">
            {courses.map((c) => <label className="check" key={c.id}><input type="checkbox" name="courseIds" value={c.id} /><span>{c.title}</span></label>)}
            <span className="hint">Centang satu kelas atau beberapa. Tiap kelas juga boleh punya kupon sendiri.</span>
          </div>
        )}
      </div>
      <div className="field">
        <label htmlFor="v-type">Tipe diskon</label>
        <select id="v-type" name="discountType" className="select" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
          <option value="PERCENT">Persentase</option>
          <option value="NOMINAL">Nominal (rupiah)</option>
        </select>
      </div>
      {discountType === "PERCENT"
        ? <Field key="percent" name="value" label="Besaran (%)" type="number" min={1} max={100} placeholder="50" hint="1 sampai 100. Isi 100 untuk gratis." />
        : <Field key="nominal" name="value" label="Besaran (Rp)" type="number" min={1} placeholder="20000" hint="Kalau lebih besar dari harga, kelasnya jadi gratis." />}
      <Field name="minPurchase" label="Minimum pembelian (Rp)" type="number" min={0} hint="Opsional. Dihitung dari harga kelas." full />
      <div className="field">
        <label htmlFor="v-coupon">Tipe kupon</label>
        <select id="v-coupon" name="couponType" className="select" value={couponType} onChange={(e) => setCouponType(e.target.value)}>
          <option value="SINGLE">Sekali pakai</option>
          <option value="REPEAT">Berulang</option>
        </select>
        <span className="hint">{couponType === "SINGLE" ? "Tiap akun bisa memakai kode ini satu kali." : "Satu akun bisa memakai kode ini berkali-kali, misalnya untuk kelas lain."}</span>
      </div>
      <div className="field">
        <label htmlFor="v-customer">Untuk pelanggan</label>
        <select id="v-customer" name="customerType" className="select" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
          <option value="ALL">Semua pelanggan</option>
          <option value="SELECTED">Pelanggan tertentu</option>
        </select>
      </div>
      {customerType === "SELECTED" && <Field name="allowedEmails" label="Email pelanggan" type="textarea" rows={2} placeholder="murid1@gmail.com, murid2@gmail.com" hint="Pisahkan dengan koma." full />}
      <div className="field full">
        <label htmlFor="v-code">Kode kupon</label>
        <div className="voucher-code-row">
          <input id="v-code" name="code" className="input" value={code} maxLength={30} autoComplete="off" onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Contoh: MURIDLAMA" />
          <button type="button" className="btn btn-ghost" onClick={() => setCode(randomCode())}>Generate</button>
        </div>
      </div>
      <Field name="maxUses" label={couponType === "SINGLE" ? "Untuk berapa orang" : "Batas pemakaian / limit"} type="number" min={1} hint={couponType === "SINGLE" ? "Contoh: isi 10 untuk 10 orang pertama. Kosongkan jika tidak terbatas." : "Total pemakaian dari semua akun. Kosongkan jika tidak terbatas."} full />
      <div className="field">
        <label htmlFor="v-start">Waktu mulai penggunaan</label>
        <input id="v-start" className="input" type="datetime-local" name="startsAt" />
        <span className="hint">Opsional, dalam WIB. Kosongkan untuk langsung berlaku.</span>
      </div>
      <div className="field">
        <label htmlFor="v-end">Berlaku sampai</label>
        <input id="v-end" className="input" type="datetime-local" name="expiresAt" />
        <span className="hint">Opsional, dalam WIB. Kosongkan kalau tidak ada batas.</span>
      </div>
    </ActionForm>
  );
}
