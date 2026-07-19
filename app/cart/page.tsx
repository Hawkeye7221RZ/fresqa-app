"use client";
// app/cart/page.tsx
// Halaman keranjang & checkout (route: "/cart")
// Pelanggan atur jumlah barang, isi alamat, lalu submit -> bikin order baru.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase";
import { sendWhatsAppNotification, orderConfirmationMessage } from "@/lib/notify";

// Kasih tau TypeScript kalau bakal ada "window.snap" (dari script Midtrans
// yang di-load di app/layout.tsx), biar nggak dianggap error.
declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const DELIVERY_FEE = 10000; // ongkir flat, bisa diubah/dibuat dinamis nanti

function generateOrderCode() {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `FRQ-${datePart}-${randomPart}`;
}

export default function CartPage() {
  const router = useRouter();
  const supabase = createClient();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } =
    useCart();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentInfo, setPaymentInfo] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = totalPrice + (items.length > 0 ? DELIVERY_FEE : 0);

  async function handleCheckout() {
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!address.trim()) {
      setError("Alamat pengiriman wajib diisi.");
      return;
    }

    if (!phone.trim()) {
      setError("Nomor WhatsApp wajib diisi buat notifikasi pesanan.");
      return;
    }

    setSubmitting(true);

    // Simpan/update nomor WA ke profil, biar kepakai lagi buat notifikasi
    // status pesanan berikutnya tanpa perlu isi ulang.
    await supabase.from("profiles").update({ phone }).eq("id", user.id);

    // 1. Buat order utama
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_code: generateOrderCode(),
        customer_id: user.id,
        source: "online",
        status: "menunggu_konfirmasi",
        payment_status: "belum_bayar",
        payment_method: paymentMethod,
        delivery_address: address,
        subtotal: totalPrice,
        delivery_fee: DELIVERY_FEE,
        total,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      setError(orderError?.message ?? "Gagal membuat order.");
      setSubmitting(false);
      return;
    }

    // 2. Simpan barang yang dipesan
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      line_total: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    setSubmitting(false);

    if (itemsError) {
      setError(itemsError.message);
      return;
    }

    // 3. Kirim notifikasi WhatsApp konfirmasi pesanan (nggak blocking —
    // kalau gagal kirim, order tetap dianggap sukses)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    sendWhatsAppNotification(
      phone,
      orderConfirmationMessage({
        customerName: profileData?.full_name ?? "Pelanggan",
        orderCode: order.order_code,
        total,
      })
    );

    clearCart();

    // 4. Kalau metode bayar "online", munculin popup pembayaran Midtrans.
    // Kalau COD, langsung ke halaman konfirmasi pesanan.
    if (paymentMethod === "online") {
      try {
        const res = await fetch("/api/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderCode: order.order_code,
            amount: total,
            customerName: profileData?.full_name,
            customerPhone: phone,
          }),
        });
        const data = await res.json();

        if (data.skipped) {
          // Midtrans belum di-setup admin — tetap lanjut ke halaman order,
          // pembayaran online belum bisa dipakai buat sementara.
          setPaymentInfo(
            "Pembayaran online belum tersedia saat ini. Silakan hubungi kami buat konfirmasi pembayaran."
          );
          router.push(`/orders/${order.id}`);
          return;
        }

        if (data.token && window.snap) {
          window.snap.pay(data.token, {
            onSuccess: () => router.push(`/orders/${order.id}`),
            onPending: () => router.push(`/orders/${order.id}`),
            onError: () => router.push(`/orders/${order.id}`),
            onClose: () => router.push(`/orders/${order.id}`),
          });
          return;
        }
      } catch (err) {
        console.error("Gagal buka pembayaran online:", err);
      }
    }

    router.push(`/orders/${order.id}`);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="font-display text-2xl text-ink mb-2">
          Keranjang masih kosong
        </p>
        <p className="text-sm text-frost-500 mb-6">
          Yuk pilih es batu kristal favoritmu dulu.
        </p>
        <Link
          href="/"
          className="inline-block bg-frost-600 text-white rounded-shard px-5 py-2.5 text-sm hover:bg-frost-700"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl text-ink mb-6">Keranjang</h1>

      {/* List item */}
      <div className="border border-frost-200 rounded-shard bg-white divide-y divide-frost-100 mb-6">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-ink text-sm font-medium">
                {item.product.name}
              </p>
              <p className="text-xs text-frost-500">
                Rp{item.product.price.toLocaleString("id-ID")} /{" "}
                {item.product.unit}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-frost-300 rounded-shard">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="w-7 h-7 text-frost-600 hover:bg-frost-50"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  className="w-7 h-7 text-frost-600 hover:bg-frost-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.product.id)}
                className="text-red-500 text-xs hover:underline"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alamat & pembayaran */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm text-frost-700 block mb-1">
            Alamat pengiriman
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
            placeholder="Jl. Contoh No. 123, Pontianak"
          />
        </div>
        <div>
          <label className="text-sm text-frost-700 block mb-1">
            Nomor WhatsApp
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-frost-300 rounded-shard px-3 py-2 focus:outline-none focus:ring-2 focus:ring-frost-500"
            placeholder="08123456789"
          />
          <p className="text-xs text-frost-400 mt-1">
            Buat kirim notifikasi status pesanan.
          </p>
        </div>
        <div>
          <label className="text-sm text-frost-700 block mb-1">
            Metode pembayaran
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border border-frost-300 rounded-shard px-3 py-2"
          >
            <option value="cod">Bayar di tempat (COD)</option>
            <option value="online">
              Bayar Online (Transfer / QRIS / E-wallet)
            </option>
          </select>
        </div>
        <div>
          <label className="text-sm text-frost-700 block mb-1">
            Catatan (opsional)
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-frost-300 rounded-shard px-3 py-2"
            placeholder="misal: titip di depan pagar"
          />
        </div>
      </div>

      {/* Ringkasan total */}
      <div className="border border-frost-200 rounded-shard bg-white p-4 mb-6 text-sm space-y-1">
        <div className="flex justify-between text-frost-600">
          <span>Subtotal</span>
          <span>Rp{totalPrice.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-frost-600">
          <span>Ongkir</span>
          <span>Rp{DELIVERY_FEE.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-ink font-semibold pt-1 border-t border-frost-100">
          <span>Total</span>
          <span>Rp{total.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {paymentInfo && (
        <p className="text-sm text-amber-600 mb-3">{paymentInfo}</p>
      )}

      <button
        onClick={handleCheckout}
        disabled={submitting}
        className="w-full bg-frost-600 text-white rounded-shard py-3 hover:bg-frost-700 disabled:opacity-50"
      >
        {submitting ? "Memproses..." : "Buat Pesanan"}
      </button>
    </div>
  );
}
