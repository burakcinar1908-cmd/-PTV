"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  mobile: boolean;
  reducedMotion: boolean;
};

// DESIGN.md paleti: tek vurgu (accent) ve nötr tonlar. Ham renk yalnızca burada tanımlanır.
const ACCENT = "#22d3ee";
const ACCENT_SOLUK = "#0e7490";
const NOTR = "#334155";
const GOVDE = "#0f172a";
const KANAL_RENKLERI = [ACCENT, NOTR, ACCENT_SOLUK];

// Ekranında yayın gösteren bir televizyon.
function TvSet({ reducedMotion }: { reducedMotion: boolean }) {
  const grup = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!grup.current || reducedMotion) return;
    const t = state.clock.getElapsedTime();
    grup.current.rotation.y = THREE.MathUtils.lerp(grup.current.rotation.y, pointer.x * 0.25, 0.05);
    grup.current.rotation.x = THREE.MathUtils.lerp(grup.current.rotation.x, -pointer.y * 0.15, 0.05);
    grup.current.position.y = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group ref={grup}>
      <mesh>
        <boxGeometry args={[3.6, 2.1, 0.22]} />
        <meshStandardMaterial color={GOVDE} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.05, 0.12]}>
        <planeGeometry args={[3.1, 1.75]} />
        <meshStandardMaterial color="#082f3a" emissive={ACCENT} emissiveIntensity={0.25} />
      </mesh>
      {[-0.9, 0, 0.9].map((x, i) => (
        <mesh key={x} position={[x, -0.15 + i * 0.12, 0.13]}>
          <planeGeometry args={[0.6, 0.12]} />
          <meshStandardMaterial color={KANAL_RENKLERI[i]} emissive={KANAL_RENKLERI[i]} emissiveIntensity={0.7} />
        </mesh>
      ))}
      <mesh position={[0, -1.3, -0.1]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 16]} />
        <meshStandardMaterial color={NOTR} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.75, -0.1]}>
        <cylinderGeometry args={[0.55, 0.6, 0.08, 32]} />
        <meshStandardMaterial color={NOTR} metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Televizyon etrafında dönen kanal kutuları.
function KanalKutulari({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const konumlar = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        acı: (i / count) * Math.PI * 2,
        yari: 2.6 + (i % 2) * 0.5,
        yukseklik: ((i % 3) - 1) * 0.7,
        renk: KANAL_RENKLERI[i % KANAL_RENKLERI.length],
      })),
    [count]
  );

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    konumlar.forEach((k, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const a = k.acı + t * 0.12;
      mesh.position.set(Math.cos(a) * k.yari, k.yukseklik + Math.sin(t + i) * 0.08, Math.sin(a) * k.yari * 0.5);
      mesh.rotation.y = -a;
    });
  });

  return (
    <>
      {konumlar.map((k, i) => (
        <mesh
          key={i}
          ref={(el: THREE.Mesh | null) => {
            refs.current[i] = el;
          }}
        >
          <boxGeometry args={[0.55, 0.36, 0.06]} />
          <meshStandardMaterial color={k.renk} emissive={k.renk} emissiveIntensity={0.25} roughness={0.25} />
        </mesh>
      ))}
    </>
  );
}

function Parcaciklar({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const konumlar = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[konumlar, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color={ACCENT} transparent opacity={0.35} />
    </points>
  );
}

function KameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, pointer } = useThree();
  useFrame(() => {
    if (reducedMotion) return;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.4, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.25, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Sahne ekrandan çıktığında render döngüsünü durdurur; pil ve CPU tasarrufu.
export default function HeroScene({ mobile, reducedMotion }: Props) {
  const kap = useRef<HTMLDivElement>(null);
  const [gorunur, setGorunur] = useState(true);

  useEffect(() => {
    const el = kap.current;
    if (!el) return;
    const gozlemci = new IntersectionObserver(([giris]) => setGorunur(giris.isIntersecting), { threshold: 0 });
    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, []);

  return (
    <div ref={kap} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={mobile ? [1, 1.25] : [1, 2]}
        frameloop={gorunur ? "always" : "never"}
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: !mobile, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#e0f2fe" />
        <pointLight position={[-4, -2, 2]} intensity={1.2} color={ACCENT} />
        <TvSet reducedMotion={reducedMotion} />
        <KanalKutulari count={mobile ? 4 : 6} reducedMotion={reducedMotion} />
        <Parcaciklar count={mobile ? 200 : 500} />
        <KameraRig reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
