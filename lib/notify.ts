// lib/notify.ts
// Helper buat kirim notifikasi WhatsApp dari komponen React.
// Nggak manggil Fonnte langsung — lewat API route internal (/api/notify-whatsapp)
// biar token rahasia tetap aman di server.

export async function sendWhatsAppNotification(phone: string, message: string) {
  if (!phone) return; // kalau pelanggan nggak punya nomor tersimpan, skip aja

  try {
    await fetch("/api/notify-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
  } catch (err) {
    // Notifikasi gagal kirim JANGAN sampai bikin proses order/checkout gagal.
    // Cukup dicatat di console buat debug.
    console.error("Gagal kirim notifikasi WhatsApp:", err);
  }
}

// ---------------------------------------------------------
// Template pesan — dikumpulin di sini biar gampang diubah nanti
// tanpa perlu cari-cari di banyak file.
// ---------------------------------------------------------

export function orderConfirmationMessage(params: {
  customerName: string;
  orderCode: string;
  total: number;
}) {
  const { customerName, orderCode, total } = params;
  return `Halo ${customerName}! 🧊

Pesanan kamu di *Fresqa* sudah kami terima.

Kode pesanan: ${orderCode}
Total: Rp${total.toLocaleString("id-ID")}

Kami akan proses secepatnya. Terima kasih sudah order di Fresqa!`;
}

export function orderStatusUpdateMessage(params: {
  customerName: string;
  orderCode: string;
  status: string;
}) {
  const { customerName, orderCode, status } = params;

  const statusText: Record<string, string> = {
    diproses: "sedang *diproses*",
    dikirim: "sedang *dalam perjalanan* dikirim ke alamat kamu",
    selesai: "sudah *selesai*. Terima kasih sudah order di Fresqa! 🧊",
    dibatalkan: "*dibatalkan*. Hubungi kami kalau ada pertanyaan.",
  };

  return `Halo ${customerName}, update buat pesanan kamu di *Fresqa*:

Kode pesanan: ${orderCode}
Status: ${statusText[status] ?? status}`;
}
