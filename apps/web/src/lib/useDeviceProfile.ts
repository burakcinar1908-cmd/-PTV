"use client";

import { useEffect, useState } from "react";

export type DeviceProfile = {
  reducedMotion: boolean;
  mobile: boolean;
  ready: boolean;
};

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>({
    reducedMotion: false,
    mobile: false,
    ready: false,
  });

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const update = () =>
      setProfile({
        reducedMotion: motionQuery.matches,
        mobile: mobileQuery.matches,
        ready: true,
      });

    update();
    motionQuery.addEventListener("change", update);
    mobileQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      mobileQuery.removeEventListener("change", update);
    };
  }, []);

  return profile;
}
