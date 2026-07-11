"use client";
// app/admin/products/page.tsx
// Halaman kelola produk (route: "/admin/products")
// "use client" karena ada interaksi: klik tombol, buka form, hapus data, dst.

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, Product } from "@/lib/supabase";
import ProductForm from "@/components/ProductForm";

export default function ProductsAdminPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAddForm() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  async function handleToggleActive(product: Product) {
    await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);
    loadProducts();
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Hapus produk "${product.name}"? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    await supabase.from("products").delete().eq("id", product.id);
    loadProducts();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl text-ink">Kelola Produk</h1>
        <button
          onClick={openAddForm}
          className="bg-frost-600 text-white rounded-shard px-4 py-2 text-sm hover:bg-frost-700"
        >
          + Tambah Produk
        </button>
      </div>
      <Link href="/admin" className="text-sm text-frost-500 hover:underline">
        ← Kembali ke dashboard
      </Link>

      <div className="mt-8 border border-frost-200 rounded-shard bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-frost-500">Memuat produk...</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-frost-500">
            Belum ada produk. Klik &quot;Tambah Produk&quot; buat mulai.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-frost-50 text-frost-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Harga</th>
                <th className="px-4 py-3 font-medium">Satuan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-frost-100">
                  <td className="px-4 py-3 text-ink">{product.name}</td>
                  <td className="px-4 py-3 text-frost-700">
                    Rp{product.price.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-frost-700">{product.unit}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`text-xs px-2 py-1 rounded-full ${
                        product.is_active
                          ? "bg-frost-100 text-frost-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => openEditForm(product)}
                      className="text-frost-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-red-500 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => setShowForm(false)}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
}
