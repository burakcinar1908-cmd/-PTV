"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import SceneFallback from "./SceneFallback";
import { useDeviceProfile } from "@/lib/useDeviceProfile";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

// 3D sahne herhangi bir sebeple çökerse (WebGL yok, eski TV tarayıcısı vb.) tüm sayfa yerine sadece arka plan düşer.
class SahneKoruma extends Component<{ children: ReactNode }, { hata: boolean }> {
  state = { hata: false };
  static getDerivedStateFromError() {
    return { hata: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.hata ? <SceneFallback /> : this.props.children;
  }
}

function webglVar(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export default function HeroSceneLoader() {
  const { mobile, reducedMotion, ready } = useDeviceProfile();
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    setWebgl(webglVar());
  }, []);

  if (!ready || reducedMotion || !webgl) return <SceneFallback />;

  return (
    <div className="absolute inset-0">
      <SahneKoruma>
        <HeroScene mobile={mobile} reducedMotion={reducedMotion} />
      </SahneKoruma>
    </div>
  );
}
