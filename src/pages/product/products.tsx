import Head from "next/head";
import Header from "@/components/header";
import ProductsGrid from "@/components/productGrid";

export default function ProductsPage() {
  return (
    <>
      <Head>
        <title>Products | YourStore</title>
        <meta name="description" content="Browse our curated collection of clothing — polos, shirts, and trousers crafted with premium fabrics." />
      </Head>

      <Header />

      <main className="max-w-9xl mx-auto px-4 py-12">
        <section className="flex flex-col items-start justify-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
            Our Products
          </h1>

          {/* Product grid section */}
          <ProductsGrid />
        </section>
      </main>
    </>
  );
}
