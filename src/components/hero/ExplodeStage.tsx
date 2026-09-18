"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { ACESFilmicToneMapping, Group, Vector3 } from "three";

import { WatchModel } from "./WatchModel";
import {
  CASE_REST,
  PART_BY_ID,
  calloutOpacity,
  type PartId,
} from "@/lib/watch/parts";
import {
  calloutNodes,
  calloutSurface,
  damp,
  partAnchors,
  stage,
  type StageQuality,
} from "@/lib/watch/stage";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/*                                                                     */
/* Polished steel has no colour of its own — it is entirely what it    */
/* reflects. So the scene is lit the way a watch is photographed: one  */
/* large soft source overhead, a narrow strip to draw a single long    */
/* highlight down the case flank, and a warm bounce to keep the        */
/* shadow side from going dead.                                        */
/* ------------------------------------------------------------------ */

/*
  Lightformer children only. Do not add a `preset` or `files` prop to
  the Environment below: drei fetches those HDRIs from raw.githack.com,
  which is a third-party request the Content-Security-Policy blocks, and
  the lighting then fails with a console error most people miss.
*/
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#080706"]} />

      {/* The warm haze that sits upper-left in the reference shots. */}
      <Lightformer
        form="circle"
        intensity={1.3}
        color="#c69a5c"
        position={[-5.5, 3.5, -4.5]}
        scale={7}
        target={[0, 0, 0]}
      />

      {/* Key: a broad softbox above and slightly in front. */}
      <Lightformer
        form="rect"
        intensity={4.4}
        color="#fffdfa"
        position={[0, 5, 3]}
        scale={[10, 5, 1]}
        target={[0, 0, 0]}
      />

      {/* The specular streak down the polished flank. */}
      <Lightformer
        form="rect"
        intensity={4.5}
        color="#ffffff"
        position={[5, 3.2, 1.6]}
        scale={[0.4, 7, 1]}
        target={[0, 0, 0]}
      />

      {/* Warm brass bounce from the opposite side, kept low. */}
      <Lightformer
        form="rect"
        intensity={1.15}
        color="#c9c3b8"
        position={[-4.5, -0.5, 2.5]}
        scale={[0.8, 6, 1]}
        target={[0, 0, 0]}
      />

      {/* A hard, narrow source raking in from upper left. Broad soft
          light alone flattens a movement; this is what puts an edge on
          every bridge and wheel that stands off the plate. */}
      <Lightformer
        form="rect"
        intensity={3.6}
        color="#fffaf0"
        position={[-3.4, 4.2, 3.2]}
        scale={[0.35, 2.4, 1]}
        target={[0, 0, 0]}
      />

      {/* A ring behind, for the catchlight that rides the crystal dome. */}
      <Lightformer
        form="ring"
        intensity={2.4}
        color="#9fb4c8"
        position={[-1.5, 2.5, -4]}
        scale={5}
        target={[0, 0, 0]}
      />

      {/* Fill from the camera side. Flat, dial-facing surfaces have
          nothing else to reflect, and this is what makes applied
          markers and polished hands read as metal. */}
      <Lightformer
        form="rect"
        intensity={1.5}
        color="#f6f8fa"
        position={[0.6, 1.8, 7]}
        scale={[5, 4, 1]}
        target={[0, 0, 0]}
      />

      {/* A low bounce from the front, so the lower half of the strap
          reads as leather rather than as a hole in the frame. */}
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#e8e2d8"
        position={[-0.5, -3.4, 5]}
        scale={[6, 2.6, 1]}
        target={[0, 0, 0]}
      />

      {/* Floor bounce so the case-back is never pitch black. */}
      <Lightformer
        form="rect"
        intensity={0.7}
        color="#6d6357"
        position={[0, -5, 1]}
        scale={[8, 3, 1]}
        target={[0, 0, 0]}
      />
    </Environment>
  );
}

/* ------------------------------------------------------------------ */
/* Camera and rotation rig                                             */
/* ------------------------------------------------------------------ */

function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const { camera } = useThree();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    // Ease the scrub so a flicked scroll wheel does not snap the parts.
    stage.progress = damp(stage.progress, stage.rawProgress, 7, dt);
    const p = stage.progress;

    const g = group.current;
    if (!g) return;

    // At rest the watch sways rather than spins: just enough for the
    // highlight to travel the length of the case and back. As the
    // explode takes hold the sway is weighted out and it squares up.
    const ambient = 1 - smoothstep(0, 0.16, p);
    const opened = smoothstep(0, 0.8, p);
    // The last stretch of the pin is a push into the empty case.
    const closeUp = smoothstep(0.84, 1, p);
    const clock = state.clock.elapsedTime;
    const swayY = Math.sin(clock * 0.21) * 0.3 + 0.16;
    const swayX = Math.sin(clock * 0.16 + 1.1) * 0.05;

    // A turn the visitor put there outlasts the sway, then unwinds.
    if (!stage.dragging) {
      stage.dragX = damp(stage.dragX, 0, 0.55, dt);
      stage.dragY = damp(stage.dragY, 0, 0.55, dt);
    }

    const targetY = swayY * ambient + stage.pointerX * 0.2 + stage.dragX;
    const targetX =
      (-0.26 + swayX) * ambient -
      0.05 * (1 - ambient) -
      p * p * 0.16 -
      stage.pointerY * 0.12 +
      stage.dragY -
      closeUp * 0.12;

    const follow = stage.dragging ? 12 : 4;
    g.rotation.y = damp(g.rotation.y, targetY, follow, dt);
    g.rotation.x = damp(g.rotation.x, targetX, follow, dt);

    // While the opening copy holds the left of the frame the watch sits
    // off-axis; as it comes apart it takes the centre back, and as the
    // camera closes in the case slides to the middle of the frame.
    const offsetX =
      (stage.compact ? 0 : 0.62 * ambient) - CASE_REST[0] * closeUp;
    g.position.x = damp(g.position.x, offsetX, 3.2, dt);
    // Leave the bottom of the compact frame clear for the caption.
    g.position.y = damp(
      g.position.y,
      (stage.compact ? 0.3 : 0) - CASE_REST[1] * closeUp,
      3.2,
      dt,
    );

    // On a phone the parts are shrunk as they separate rather than the
    // camera being pulled back, which keeps the assembled watch large.
    const scale = stage.compact ? 1 - 0.28 * opened : 1;
    g.scale.setScalar(damp(g.scale.x, scale, 3.2, dt));

    // A portrait viewport is far narrower than it is tall, so the same
    // framing that suits a desktop crops the watch on a phone.
    const base = stage.compact ? 8.6 : 7.75;
    const open = base + opened * (stage.compact ? 0.5 : 1.1);
    const macro = stage.compact ? 5.2 : 3.35;
    const dolly = open + (macro - open) * closeUp;

    camera.position.set(
      damp(camera.position.x, stage.pointerX * 0.28, 3, dt),
      damp(camera.position.y, 0.3 * ambient + 0.05, 3, dt),
      damp(camera.position.z, dolly, 3, dt),
    );
    camera.lookAt(0, 0, 0);
  });

  return <group ref={group}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/* Screen-space projection for the DOM callouts                        */
/* ------------------------------------------------------------------ */

const LEADER_STUB = 34;

function CalloutProjector() {
  const { camera, size } = useThree();
  const vec = useMemo(() => new Vector3(), []);
  const rects = useRef(new Map<PartId, { x: number; y: number; side: number }>());

  // Label boxes only move on resize, so measure them then, not per frame.
  useEffect(() => {
    const measure = () => {
      const next = new Map<PartId, { x: number; y: number; side: number }>();
      const origin = calloutSurface.el?.getBoundingClientRect();
      const ox = origin?.left ?? 0;
      const oy = origin?.top ?? 0;
      calloutNodes.forEach((nodes, id) => {
        const box = nodes.label.getBoundingClientRect();
        const anchoredLeft = PART_BY_ID[id].anchor === "left";
        next.set(id, {
          x: (anchoredLeft ? box.right : box.left) - ox,
          y: box.top + box.height / 2 - oy,
          side: anchoredLeft ? 1 : -1,
        });
      });
      rects.current = next;
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [size.width, size.height]);

  useFrame(() => {
    if (stage.mode === "auto" || calloutNodes.size === 0) return;

    calloutNodes.forEach((nodes, id) => {
      const anchor = partAnchors.get(id);
      if (!anchor) return;

      const fadeForCloseUp = 1 - smoothstep(0.85, 0.94, stage.progress);
      const opacity =
        calloutOpacity(PART_BY_ID[id], stage.progress) * fadeForCloseUp;
      nodes.label.style.opacity = opacity.toFixed(3);
      nodes.label.style.transform = `translateX(${((1 - opacity) * 14 * (PART_BY_ID[id].anchor === "left" ? -1 : 1)).toFixed(2)}px)`;

      if (opacity <= 0.001) {
        if (nodes.leader) nodes.leader.style.opacity = "0";
        if (nodes.dot) nodes.dot.style.opacity = "0";
        return;
      }

      vec.setFromMatrixPosition(anchor.matrixWorld);
      vec.project(camera);
      const px = (vec.x * 0.5 + 0.5) * size.width;
      const py = (-vec.y * 0.5 + 0.5) * size.height;

      const from = rects.current.get(id);
      if (nodes.leader && from) {
        const bend = from.x + LEADER_STUB * from.side;
        nodes.leader.setAttribute(
          "points",
          `${from.x.toFixed(1)},${from.y.toFixed(1)} ${bend.toFixed(1)},${from.y.toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}`,
        );
        nodes.leader.style.opacity = (opacity * 0.55).toFixed(3);
      }
      if (nodes.dot) {
        nodes.dot.setAttribute("cx", px.toFixed(1));
        nodes.dot.setAttribute("cy", py.toFixed(1));
        nodes.dot.style.opacity = opacity.toFixed(3);
      }
    });
  });

  return null;
}

/* ------------------------------------------------------------------ */

export interface ExplodeStageProps {
  quality: StageQuality;
  /** True once the hero has scrolled out of view. */
  paused: boolean;
}

/*
  Shadows stay switched on at the canvas whatever the quality. Toggling
  `shadows` at runtime leaves already-compiled materials sampling a
  shadow map that has stopped updating, and they are left with a frozen
  shadow baked on until reload. The quality difference is expressed on
  the light instead, which three.js does support changing.
*/
export function ExplodeStage({ quality, paused }: ExplodeStageProps) {
  return (
    <Canvas
      shadows="soft"
      frameloop={paused ? "never" : "always"}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.1]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.28,
      }}
      camera={{ fov: 32, near: 0.1, far: 60, position: [0, 0.3, 7.75] }}
    >
      <StudioEnvironment />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#fffaf2" />
      <directionalLight position={[-4, -2, 2]} intensity={0.35} color="#8fa6bd" />
      <Rig>
        <WatchModel quality={quality} />
      </Rig>
      <CalloutProjector />

    </Canvas>
  );
}
