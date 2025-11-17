import Head from "next/head";
import Header from "@/components/header";
import ProductsGrid from "@/components/productGrid";
import AnimatedLogoFinal from "@/components/animatedLogo";

export default function ProductsPage() {
  return (
    <>
      <Head>
        <title>Products | YourStore</title>
        <meta name="description" content="Browse our curated collection of clothing — polos, shirts, and trousers crafted with premium fabrics." />
      </Head>

      <Header />

          {/* Product grid section */}
          <ProductsGrid />
          
          
    </>
  );
}














