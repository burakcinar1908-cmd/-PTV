"use client";

import { useEffect, useState } from "react";

export type DeviceProfile = {
  reducedMotion: boolean;
  mobile: boolean;
  ready: boolean;
};

// Eski tarayıcılarda (TV vb.) matchMedia/addEventListener eksik olabilir; çökmeden varsayılana düşer.
function dinle(q: MediaQueryList, fn: () => void) {
  if (typeof q.addEventListener === "function") {
    q.addEventListener("change", fn);
    return () => q.removeEventListener("change", fn);
  }
  if (typeof q.addListener === "function") {
    q.addListener(fn);
    return () => q.removeListener(fn);
  }
  return () => {};
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>({
    reducedMotion: false,
    mobile: false,
    ready: false,
  });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setProfile({ reducedMotion: true, mobile: false, ready: true });
      return;
    }
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const update = () =>
      setProfile({
        reducedMotion: motionQuery.matches,
        mobile: mobileQuery.matches,
        ready: true,
      });

    update();
    const a = dinle(motionQuery, update);
    const b = dinle(mobileQuery, update);
    return () => {
      a();
      b();
    };
  }, []);

  return profile;
}
