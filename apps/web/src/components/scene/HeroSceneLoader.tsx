"use client";

import dynamic from "next/dynamic";
import SceneFallback from "./SceneFallback";
import { useDeviceProfile } from "@/lib/useDeviceProfile";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

export default function HeroSceneLoader() {
  const { mobile, reducedMotion, ready } = useDeviceProfile();

  if (!ready || reducedMotion) return <SceneFallback />;

  return (
    <div className="absolute inset-0">
      <HeroScene mobile={mobile} reducedMotion={reducedMotion} />
    </div>
  );
}
