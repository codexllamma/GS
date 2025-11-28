import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* REMOVE this if it exists: <link rel="icon" href="/favicon.ico" /> */}
        
        {/* ADD THIS: Link to your new PNG in the public folder */}
        <link rel="icon" href="/icon.png" type="image/png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}