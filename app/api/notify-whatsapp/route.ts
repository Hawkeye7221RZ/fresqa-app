// app/api/notify-whatsapp/route.ts
// Route API ini jalan di SERVER (bukan browser), jadi token rahasia
// Fonnte aman, nggak kebuka ke publik lewat kode frontend.
//
// Cara pakai dari frontend: panggil lib/notify.ts -> sendWhatsAppNotification()
// jangan panggil Fonnte langsung dari komponen React.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "phone dan message wajib diisi" },
        { status: 400 }
      );
    }

    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      // Kalau token belum di-setup, jangan bikin app crash —
      // cukup gagal diam-diam, transaksi/order tetap jalan normal.
      console.warn("FONNTE_TOKEN belum di-setup di .env.local");
      return NextResponse.json(
        { skipped: true, reason: "FONNTE_TOKEN belum di-setup" },
        { status: 200 }
      );
    }

    // Rapiin nomor: buang spasi/strip, ganti awalan "0" jadi "62"
    const cleanPhone = phone
      .replace(/[\s-]/g, "")
      .replace(/^0/, "62")
      .replace(/^\+/, "");

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: cleanPhone,
        message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Fonnte gagal kirim:", result);
      return NextResponse.json(
        { error: "Gagal kirim WhatsApp", detail: result },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("Error notify-whatsapp:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
