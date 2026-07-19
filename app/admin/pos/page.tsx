"use client";
// app/admin/pos/page.tsx
// Halaman Kasir/POS buat transaksi walk-in (route: "/admin/pos")
// Beda sama order online: transaksi di sini LANGSUNG selesai & lunas
// (pelanggan bayar di tempat), dan begitu transaksi disimpan,
// stok produk otomatis kepotong (dicatat sebagai "terjual" di stock_movements).

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, Product } from "@/lib/supabase";

type CartLine = { product: Product; quantity: number };

function generateOrderCode() {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `FRQ-POS-${datePart}-${randomPart}`;
}

export default function PosPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setProducts(data ?? []);
      setLoading(false);
    }
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addToCart(product: Product) {
    setSuccessCode(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: l.quantity + 1 }
            : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((l) =>
        l.product.id === productId ? { ...l, quantity } : l
      )
    );
  }

  const subtotal = cart.reduce(
    (sum, l) => sum + l.product.price * l.quantity,
    0
  );

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Buat order dengan status langsung "selesai" & "lunas"
    // (khas transaksi kasir: bayar & terima barang di tempat)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_code: generateOrderCode(),
        customer_id: null,
        source: "pos",
        status: "selesai",
        payment_status: "lunas",
        payment_method: paymentMethod,
        subtotal,
        delivery_fee: 0,
        total: subtotal,
        handled_by: user?.id ?? null,
        notes: customerName ? `Pelanggan: ${customerName}` : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      setError(orderError?.message ?? "Gagal membuat transaksi.");
      setSubmitting(false);
      return;
    }

    // 2. Simpan barang yang dibeli
    const orderItems = cart.map((line) => ({
      order_id: order.id,
      product_id: line.product.id,
      product_name: line.product.name,
      price: line.product.price,
      quantity: line.quantity,
      line_total: line.product.price * line.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      setError(itemsError.message);
      setSubmitting(false);
      return;
    }

    // 3. Potong stok otomatis — dicatat sebagai "terjual" di stock_movements,
    // trigger database yang otomatis ngurangin stock_items
    const stockMovements = cart.map((line) => ({
      product_id: line.product.id,
      type: "terjual" as const,
      quantity: -Math.abs(line.quantity),
      note: `Kasir - ${order.order_code}`,
      created_by: user?.id ?? null,
    }));

    const { error: stockError } = await supabase
      .from("stock_movements")
      .insert(stockMovements);

    setSubmitting(false);

    if (stockError) {
      // Order & item udah kesimpen, tapi stok gagal kepotong.
      // Kasih tau staff biar bisa cek manual di halaman Kelola Stok.
      setError(
        "Transaksi tersimpan, tapi stok gagal otomatis terpotong: " +
          stockError.message
      );
    } else {
      setSuccessCode(order.order_code);
    }

    setCart([]);
    setCustomerName("");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl text-ink mb-1">Kasir / POS</h1>
      <Link href="/admin" className="text-sm text-frost-500 hover:underline">
        ← Kembali ke dashboard
      </Link>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {/* Grid produk */}
        <div className="md:col-span-2">
          {loading ? (
            <p className="text-sm text-frost-500">Memuat produk...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border border-frost-200 rounded-shard bg-white p-4 text-left hover:border-frost-400 transition-colors"
                >
                  <p className="text-sm font-medium text-ink">
                    {product.name}
                  </p>
                  <p className="text-xs text-frost-500 mt-1">
                    Rp{product.price.toLocaleString("id-ID")} /{" "}
                    {product.unit}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Keranjang kasir */}
        <div className="border border-frost-200 rounded-shard bg-white p-4 h-fit sticky top-20">
          <h2 className="font-display text-lg text-ink mb-3">
            Transaksi Ini
          </h2>

          {cart.length === 0 ? (
            <p className="text-sm text-frost-400">
              Klik produk di sebelah kiri buat mulai.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {cart.map((line) => (
                <div
                  key={line.product.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink flex-1">{line.product.name}</span>
                  <div className="flex items-center border border-frost-300 rounded-shard">
                    <button
                      onClick={() =>
                        updateQty(line.product.id, line.quantity - 1)
                      }
                      className="w-6 h-6 text-frost-600 hover:bg-frost-50"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQty(line.product.id, line.quantity + 1)
                      }
                      className="w-6 h-6 text-frost-600 hover:bg-frost-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-frost-100 pt-3 mb-3">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama pelanggan (opsional)"
              className="w-full border border-frost-300 rounded-shard px-3 py-1.5 text-sm mb-2"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-frost-300 rounded-shard px-3 py-1.5 text-sm"
            >
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="flex justify-between text-sm font-semibold text-ink mb-3">
            <span>Total</span>
            <span>Rp{subtotal.toLocaleString("id-ID")}</span>
          </div>

          {error && (
            <p className="text-xs text-red-600 mb-2">{error}</p>
          )}
          {successCode && (
            <p className="text-xs text-green-600 mb-2">
              ✓ Transaksi {successCode} tersimpan & stok terpotong.
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full bg-frost-600 text-white rounded-shard py-2.5 text-sm hover:bg-frost-700 disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Selesaikan Transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}
