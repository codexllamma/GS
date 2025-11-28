// pages/index.tsx
import LandingPage from "@/components/landing";
import dynamic from "next/dynamic";

const ComingSoonLanding = dynamic(
  () => import("@/components/coming"),
  { ssr: false }
);

export default function Home() {
  return (
    <>
    <LandingPage/>
    </>
  );
}
