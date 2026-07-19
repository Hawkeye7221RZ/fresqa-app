// app/api/midtrans-webhook/route.ts
// Route ini dipanggil OTOMATIS oleh server Midtrans (bukan oleh browser
// pelanggan/admin) tiap kali status pembayaran berubah — misal dari
// "pending" jadi "berhasil dibayar". Di sinilah `orders.payment_status`
// di database kita ikut ke-update otomatis.
//
// PENTING: URL route ini ("/api/midtrans-webhook") harus didaftarin di
// dashboard Midtrans -> Settings -> Configuration -> Payment Notification URL
// Waktu masih development di localhost, Midtrans nggak bisa akses
// localhost kamu. Solusinya pakai tool tunnel kayak ngrok dulu (lihat
// README) supaya Midtrans bisa "nembak" ke komputer kamu.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id: orderCode,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "MIDTRANS_SERVER_KEY belum di-setup" },
        { status: 500 }
      );
    }

    // Verifikasi keaslian notifikasi — pastikan beneran dari Midtrans,
    // bukan orang iseng yang nembak endpoint ini langsung.
    const expectedSignature = crypto
      .createHash("sha512")
      .update(orderCode + status_code + gross_amount + serverKey)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      return NextResponse.json(
        { error: "Signature tidak valid" },
        { status: 403 }
      );
    }

    // Terjemahin status dari Midtrans ke status yang dipakai Fresqa
    let paymentStatus = "belum_bayar";
    if (transaction_status === "capture") {
      paymentStatus = fraud_status === "accept" ? "lunas" : "menunggu_verifikasi";
    } else if (transaction_status === "settlement") {
      paymentStatus = "lunas";
    } else if (["deny", "cancel", "expire"].includes(transaction_status)) {
      paymentStatus = "gagal";
    } else if (transaction_status === "pending") {
      paymentStatus = "menunggu_verifikasi";
    }

    // Pakai Service Role Key (bukan anon key) biar bisa update tabel
    // orders TANPA kena batasan RLS — soalnya notifikasi ini datang dari
    // server Midtrans, bukan dari user yang login lewat app.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("order_code", orderCode);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error midtrans-webhook:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
