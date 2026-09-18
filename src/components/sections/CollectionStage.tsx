"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  CircleGeometry,
  Group,
  LatheGeometry,
  MeshPhysicalMaterial,
  Vector2,
} from "three";

import { createDialTexture } from "@/lib/watch/dialTexture";

/**
 * The collection is the same watch four times over, so it is shown the
 * same way the hero is: as the real object, turning slowly, rather than
 * as a drawing of it.
 *
 * One canvas covers the whole row and each watch is placed at the
 * centre of its card, measured from the DOM. That keeps the row aligned
 * through every breakpoint without four separate WebGL contexts.
 */

export interface CollectionModel {
  ref: string;
  name: string;
  dial: string;
  marker: string;
  hand: string;
}

const CASE_R = 1;
const DIAL_R = 0.84;

function useShared() {
  return useMemo(() => {
    const bandProfile: [number, number][] = [
      [DIAL_R - 0.01, -0.16],
      [CASE_R - 0.03, -0.16],
      [CASE_R, -0.12],
      [CASE_R + 0.015, -0.02],
      [CASE_R, 0.05],
      [CASE_R - 0.02, 0.11],
      [CASE_R - 0.09, 0.16],
      [DIAL_R - 0.01, 0.125],
      [DIAL_R - 0.01, -0.16],
    ];
    const caseBand = new LatheGeometry(
      bandProfile.map(([x, y]) => new Vector2(x, y)),
      96,
    );
    caseBand.rotateX(Math.PI / 2);

    const steel = new MeshPhysicalMaterial({
      color: "#d5d8da",
      metalness: 1,
      roughness: 0.08,
      envMapIntensity: 1.5,
    });

    return {
      caseBand,
      dial: new CircleGeometry(DIAL_R, 72),
      steel,
      dialTexture: createDialTexture(),
    };
  }, []);
}

type Shared = ReturnType<typeof useShared>;

function MiniWatch({
  model,
  shared,
  index,
  slots,
  hovered,
}: {
  model: CollectionModel;
  shared: Shared;
  index: number;
  slots: RefObject<(HTMLElement | null)[]>;
  hovered: RefObject<number>;
}) {
  const group = useRef<Group>(null);
  const hourHand = useRef<Group>(null);
  const minuteHand = useRef<Group>(null);
  const { size, camera } = useThree();

  const materials = useMemo(() => {
    const dial = new MeshPhysicalMaterial({
      map: shared.dialTexture,
      color: model.dial,
      metalness: 0.5,
      roughness: 0.34,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.9,
    });
    const marker = new MeshPhysicalMaterial({
      color: model.marker,
      metalness: 1,
      roughness: 0.22,
      envMapIntensity: 2.2,
    });
    const hand = new MeshPhysicalMaterial({
      color: model.hand,
      metalness: 1,
      roughness: 0.15,
      envMapIntensity: 2.4,
    });
    return { dial, marker, hand };
  }, [model, shared.dialTexture]);

  const markers = useMemo(() => {
    const out: { x: number; y: number; a: number }[] = [];
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const r = DIAL_R * 0.655;
      out.push({ x: Math.sin(a) * r, y: Math.cos(a) * r, a });
    }
    return out;
  }, []);

  useFrame((state, delta) => {
    const node = group.current;
    const slot = slots.current?.[index];
    if (!node || !slot) return;

    // Place the watch over its own card, in world units.
    const box = slot.getBoundingClientRect();
    const canvasBox = state.gl.domElement.getBoundingClientRect();
    const visibleHeight =
      2 * Math.tan((((camera as { fov: number }).fov * Math.PI) / 180) / 2) *
      camera.position.z;
    const unitsPerPixel = visibleHeight / size.height;

    node.position.x =
      (box.left + box.width / 2 - (canvasBox.left + canvasBox.width / 2)) *
      unitsPerPixel;
    node.position.y =
      -(box.top + box.height / 2 - (canvasBox.top + canvasBox.height / 2)) *
      unitsPerPixel;
    node.scale.setScalar((box.width * 0.46 * unitsPerPixel) / CASE_R);

    const now = new Date();
    const minuteOf = now.getMinutes() + now.getSeconds() / 60;
    const hourOf = (now.getHours() % 12) + minuteOf / 60;
    if (hourHand.current) {
      hourHand.current.rotation.z = -(hourOf / 12) * Math.PI * 2;
    }
    if (minuteHand.current) {
      minuteHand.current.rotation.z = -(minuteOf / 60) * Math.PI * 2;
    }

    const isHovered = hovered.current === index;
    const clock = state.clock.elapsedTime;
    const amplitude = isHovered ? 0.62 : 0.34;
    const targetY = Math.sin(clock * 0.34 + index * 1.3) * amplitude;
    const targetX = isHovered ? -0.26 : -0.12;
    const ease = Math.min(1, delta * (isHovered ? 5 : 3));
    node.rotation.y += (targetY - node.rotation.y) * ease;
    node.rotation.x += (targetX - node.rotation.x) * ease;
  });

  return (
    <group ref={group}>
      <mesh geometry={shared.caseBand} material={shared.steel} />
      <mesh
        geometry={shared.dial}
        material={materials.dial}
        position={[0, 0, 0.02]}
      />
      {markers.map((marker, i) => (
        <mesh
          key={i}
          position={[marker.x, marker.y, 0.035]}
          rotation={[0, 0, -marker.a]}
          material={materials.marker}
        >
          <boxGeometry args={[i % 3 === 0 ? 0.04 : 0.028, 0.2, 0.016]} />
        </mesh>
      ))}
      {/* Every dial in the row keeps the visitor's own time. Each hand
          is offset inside its group so it has a short tail rather than
          reading as a double-ended needle. */}
      <group ref={hourHand}>
        <mesh position={[0, 0.22, 0.055]} material={materials.hand}>
          <boxGeometry args={[0.048, 0.58, 0.014]} />
        </mesh>
      </group>
      <group ref={minuteHand}>
        <mesh position={[0, 0.3, 0.07]} material={materials.hand}>
          <boxGeometry args={[0.034, 0.84, 0.012]} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.082]} material={shared.steel}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
      </mesh>
      <mesh
        position={[CASE_R + 0.05, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={shared.steel}
      >
        <cylinderGeometry args={[0.075, 0.085, 0.1, 18]} />
      </mesh>
      {[0.52, -0.52, Math.PI - 0.52, Math.PI + 0.52].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.sin(angle) * 0.99, Math.cos(angle) * 0.99, -0.01]}
          rotation={[0, 0, -angle]}
          material={shared.steel}
        >
          <cylinderGeometry args={[0.075, 0.13, 0.34, 4, 1, false]} />
        </mesh>
      ))}
    </group>
  );
}

export function CollectionStage({
  models,
  slots,
  hovered,
}: {
  models: CollectionModel[];
  slots: RefObject<(HTMLElement | null)[]>;
  hovered: RefObject<number>;
}) {
  const shared = useShared();
  const [live, setLive] = useState(false);
  const host = useRef<HTMLDivElement>(null);

  // Only render while the row is on screen.
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={live ? "always" : "never"}
        dpr={[1, 1.6]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
        camera={{ fov: 24, near: 0.1, far: 40, position: [0, 0, 9] }}
      >
        <Environment resolution={128} frames={1}>
          <color attach="background" args={["#0a0908"]} />
          <Lightformer
            form="rect"
            intensity={4}
            color="#fffdfa"
            position={[0, 5, 4]}
            scale={[10, 5, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={4}
            color="#ffffff"
            position={[5, 2, 3]}
            scale={[0.5, 7, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            color="#f2f4f6"
            position={[0, 1, 8]}
            scale={[6, 5, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="circle"
            intensity={1.1}
            color="#c69a5c"
            position={[-5, 2, -4]}
            scale={6}
            target={[0, 0, 0]}
          />
        </Environment>
        <directionalLight position={[2, 4, 5]} intensity={0.8} color="#fffaf2" />
        {models.map((model, index) => (
          <MiniWatch
            key={model.ref}
            model={model}
            shared={shared}
            index={index}
            slots={slots}
            hovered={hovered}
          />
        ))}
      </Canvas>
    </div>
  );
}
