// app/admin/page.tsx
// Dashboard buat admin & karyawan (route: "/admin")
// Versi ini baru kerangka awal — nanti di step berikutnya kita isi
// dengan data asli (jumlah order hari ini, stok rendah, dll)

export default function AdminDashboard() {
  const summaryCards = [
    { label: "Order hari ini", value: "—" },
    { label: "Menunggu konfirmasi", value: "—" },
    { label: "Stok rendah", value: "—" },
    { label: "Pendapatan hari ini", value: "—" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl text-ink mb-1">
        Dashboard Fresqa
      </h1>
      <p className="text-sm text-frost-500 mb-8">
        Ringkasan operasional harian.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="border border-frost-200 rounded-shard bg-white p-4"
          >
            <p className="text-xs text-frost-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="font-display text-2xl text-ink mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 border border-dashed border-frost-300 rounded-shard p-8 text-center text-frost-500 text-sm">
        Tabel order, kelola produk, dan kelola stok akan ditambahkan di
        langkah berikutnya.
      </div>
    </div>
  );
}
