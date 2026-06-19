"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Line } from "@react-three/drei";
import * as THREE from "three";

const NODE_COUNT = 5;
const NODE_RADIUS = 2.2;

type HudCardProps = {
  label: string;
  value: string;
  accent: string;
  position: [number, number, number];
};

function HudCard({ label, value, accent, position }: HudCardProps) {
  return (
    <Html position={position} center transform occlude={false} zIndexRange={[0, 0]}>
      <div className="pointer-events-none select-none w-36 rounded-lg border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-md shadow-lg">
        <p className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</p>
        <p className="text-sm font-semibold" style={{ color: accent }}>
          {value}
        </p>
      </div>
    </Html>
  );
}

function OrbitingNodes({
  animate,
  mouse,
}: {
  animate: boolean;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const parallaxRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);

  const nodeColors = useMemo(
    () => ["#a78bfa", "#38bdf8", "#8b5cf6", "#6366f1", "#22d3ee"],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (orbitRef.current && animate) {
      orbitRef.current.rotation.y = t * 0.15;
    }

    nodesRef.current.forEach((node, i) => {
      if (!node) return;
      const angle = (i / NODE_COUNT) * Math.PI * 2 + (animate ? t * 0.4 : 0);
      node.position.x = Math.cos(angle) * NODE_RADIUS;
      node.position.z = Math.sin(angle) * NODE_RADIUS;
      node.position.y = animate ? Math.sin(t * 0.8 + i) * 0.25 : 0;
    });

    if (parallaxRef.current) {
      parallaxRef.current.rotation.x = THREE.MathUtils.lerp(
        parallaxRef.current.rotation.x,
        mouse.current.y * 0.12,
        0.05
      );
      parallaxRef.current.rotation.y = THREE.MathUtils.lerp(
        parallaxRef.current.rotation.y,
        mouse.current.x * 0.15,
        0.05
      );
    }
  });

  const hubLines = useMemo(() => {
    return Array.from({ length: NODE_COUNT }, (_, i) => {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      return [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(angle) * NODE_RADIUS,
          0,
          Math.sin(angle) * NODE_RADIUS
        ),
      ] as [THREE.Vector3, THREE.Vector3];
    });
  }, []);

  return (
    <group ref={parallaxRef}>
      <group ref={orbitRef}>
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
          <mesh>
            <icosahedronGeometry args={[0.75, 1]} />
            <meshStandardMaterial
              color="#8b5cf6"
              emissive="#6366f1"
              emissiveIntensity={0.6}
              metalness={0.4}
              roughness={0.2}
            />
          </mesh>
        </Float>

        {hubLines.map((points, i) => (
          <Line
            key={`line-${i}`}
            points={points}
            color="#a78bfa"
            opacity={0.35}
            transparent
            lineWidth={1}
          />
        ))}

        {Array.from({ length: NODE_COUNT }).map((_, i) => (
          <mesh
            key={`node-${i}`}
            ref={(el) => {
              if (el) nodesRef.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              color={nodeColors[i]}
              emissive={nodeColors[i]}
              emissiveIntensity={0.5}
              metalness={0.3}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      <HudCard
        label="Yield Scout"
        value="+12.4% APY"
        accent="#a78bfa"
        position={[-2.8, 1.6, 0.5]}
      />
      <HudCard
        label="Active Agents"
        value="3 running"
        accent="#38bdf8"
        position={[2.6, 0.8, -0.8]}
      />
      <HudCard
        label="Escrow"
        value="450 HBAR"
        accent="#22d3ee"
        position={[0.2, -2.2, 1.2]}
      />
    </group>
  );
}

function ParticleField({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current || !animate) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={200}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#a78bfa"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function SceneContent({
  animate,
  mouse,
}: {
  animate: boolean;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#a78bfa" />
      <pointLight position={[-4, -2, 2]} intensity={0.8} color="#38bdf8" />
      <ParticleField animate={animate} />
      <OrbitingNodes animate={animate} mouse={mouse} />
    </>
  );
}

function HeroSceneInner() {
  const mouse = useRef({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAnimate(!reduced.matches);
    const onChange = () => setAnimate(!reduced.matches);
    reduced.addEventListener("change", onChange);
    return () => reduced.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouse.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={onPointerMove}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop={visible && animate ? "always" : "demand"}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <SceneContent animate={animate} mouse={mouse} />
      </Canvas>
    </div>
  );
}

export function HeroSceneCanvas() {
  return <HeroSceneInner />;
}
