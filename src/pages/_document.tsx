import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="google-site-verification" content="dt_8Ys82IHR3jaj2Niv4s4K1bkEXV8yG2o_viodWdUs" />
        <link rel="icon" href="/icon.png" type="image/png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}