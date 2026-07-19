// app/api/create-payment/route.ts
// Jalan di SERVER — bikin "transaksi pembayaran" baru ke Midtrans,
// balikin token yang dipakai buat munculin popup pembayaran (Snap)
// di sisi pelanggan. Server Key Midtrans nggak pernah kebuka ke browser.

import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error - midtrans-client belum punya tipe TypeScript resmi
import midtransClient from "midtrans-client";

export async function POST(req: NextRequest) {
  try {
    const { orderCode, amount, customerName, customerEmail, customerPhone } =
      await req.json();

    if (!orderCode || !amount) {
      return NextResponse.json(
        { error: "orderCode dan amount wajib diisi" },
        { status: 400 }
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      // Kalau Midtrans belum di-setup, jangan bikin checkout gagal total —
      // biar pelanggan tetap bisa order pakai metode COD.
      console.warn("MIDTRANS_SERVER_KEY belum di-setup di .env.local");
      return NextResponse.json(
        { skipped: true, reason: "MIDTRANS_SERVER_KEY belum di-setup" },
        { status: 200 }
      );
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    const snap = new midtransClient.Snap({
      isProduction,
      serverKey,
    });

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderCode,
        gross_amount: Math.round(amount),
      },
      customer_details: {
        first_name: customerName || "Pelanggan",
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
      },
      // Aktifin beberapa metode populer di Indonesia. Bisa ditambah/kurangi
      // sesuai kebutuhan — daftar lengkap ada di dokumentasi Midtrans Snap.
      enabled_payments: [
        "gopay",
        "shopeepay",
        "qris",
        "bank_transfer",
        "other_qris",
      ],
    });

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (err) {
    console.error("Gagal bikin transaksi Midtrans:", err);
    return NextResponse.json(
      { error: "Gagal membuat transaksi pembayaran" },
      { status: 500 }
    );
  }
}
