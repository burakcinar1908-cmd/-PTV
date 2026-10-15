"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  mobile: boolean;
  reducedMotion: boolean;
};

const KANAL_RENKLERI = ["#22d3ee", "#818cf8", "#34d399", "#f472b6", "#fbbf24", "#60a5fa"];

// Ekranında yayın gösteren bir televizyon ve etrafında dönen kanal kutuları.
function TvSet({ reducedMotion }: { reducedMotion: boolean }) {
  const grup = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!grup.current || reducedMotion) return;
    const t = state.clock.getElapsedTime();
    grup.current.rotation.y = THREE.MathUtils.lerp(grup.current.rotation.y, pointer.x * 0.35, 0.05);
    grup.current.rotation.x = THREE.MathUtils.lerp(grup.current.rotation.x, -pointer.y * 0.2, 0.05);
    grup.current.position.y = Math.sin(t * 0.8) * 0.06;
  });

  return (
    <group ref={grup}>
      {/* Gövde */}
      <mesh>
        <boxGeometry args={[3.6, 2.1, 0.22]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Ekran */}
      <mesh position={[0, 0.05, 0.12]}>
        <planeGeometry args={[3.1, 1.75]} />
        <meshStandardMaterial color="#0b2433" emissive="#22d3ee" emissiveIntensity={0.45} />
      </mesh>
      {/* Ekrandaki sahte kanal çubukları */}
      {[-0.9, 0, 0.9].map((x, i) => (
        <mesh key={x} position={[x, -0.15 + i * 0.12, 0.13]}>
          <planeGeometry args={[0.6, 0.12]} />
          <meshStandardMaterial color={KANAL_RENKLERI[i]} emissive={KANAL_RENKLERI[i]} emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Ayak */}
      <mesh position={[0, -1.3, -0.1]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.75, -0.1]}>
        <cylinderGeometry args={[0.55, 0.6, 0.08, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Televizyon etrafında dönen kanal kutuları
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
      const a = k.acı + t * 0.15;
      mesh.position.set(Math.cos(a) * k.yari, k.yukseklik + Math.sin(t + i) * 0.1, Math.sin(a) * k.yari * 0.5);
      mesh.rotation.y = -a;
    });
  });

  return (
    <>
      {konumlar.map((k, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <boxGeometry args={[0.55, 0.36, 0.06]} />
          <meshStandardMaterial color={k.renk} emissive={k.renk} emissiveIntensity={0.35} roughness={0.2} />
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
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[konumlar, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#a5b4fc" transparent opacity={0.6} />
    </points>
  );
}

function KameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, pointer } = useThree();
  useFrame(() => {
    if (reducedMotion) return;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.5, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.3, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene({ mobile, reducedMotion }: Props) {
  return (
    <Canvas
      dpr={mobile ? [1, 1.25] : [1, 2]}
      camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{ antialias: !mobile, alpha: true }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#e0f2fe" />
      <pointLight position={[-4, -2, 2]} intensity={2} color="#818cf8" />
      <TvSet reducedMotion={reducedMotion} />
      <KanalKutulari count={mobile ? 4 : 6} reducedMotion={reducedMotion} />
      <Parcaciklar count={mobile ? 250 : 700} />
      <KameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
