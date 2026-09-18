"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  Group,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  RepeatWrapping,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";

import {
  createCotesTexture,
  createGiltTexture,
  createPerlageTexture,
} from "@/lib/watch/movementTextures";
import { stage } from "@/lib/watch/stage";

/**
 * The caliber, and it runs.
 *
 * The layout follows the movement in the reference photography: barrel
 * and ratchet up at the top, the train running down the right, the
 * balance and its hairspring at the bottom left under a cock, and the
 * winding stem out at three. Nothing here carries a name.
 *
 * The going train turns at geared ratios, the escape wheel steps rather
 * than sweeps, and the pallet fork rocks with the balance, so what you
 * are watching is an escapement rather than a set of spinning discs.
 */

const PLATE_R = 0.78;

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** A toothed, spoked wheel of the kind a going train is built from. */
function gearShape(radius: number, teeth: number, spokes: number): Shape {
  const shape = new Shape();
  const step = (Math.PI * 2) / teeth;
  const tip = radius;
  const root = radius * 0.935;

  for (let i = 0; i < teeth; i += 1) {
    const a = i * step;
    const at = (x: number) => a + step * x;
    const point = (angle: number, r: number): [number, number] => [
      Math.cos(angle) * r,
      Math.sin(angle) * r,
    ];
    if (i === 0) shape.moveTo(...point(a, root));
    else shape.lineTo(...point(a, root));
    shape.lineTo(...point(at(0.22), tip));
    shape.lineTo(...point(at(0.5), tip));
    shape.lineTo(...point(at(0.72), root));
    shape.lineTo(...point(at(1), root));
  }
  shape.closePath();

  // Crossings-out: the openings that leave a wheel as spokes.
  const holeR = radius * 0.3;
  const holeAt = radius * 0.52;
  for (let i = 0; i < spokes; i += 1) {
    const a = (i / spokes) * Math.PI * 2 + Math.PI / spokes;
    const hole = new Path();
    hole.absarc(Math.cos(a) * holeAt, Math.sin(a) * holeAt, holeR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }

  const bore = new Path();
  bore.absarc(0, 0, radius * 0.11, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  return shape;
}

/** An outline with soft corners, for a bridge or a cock. */
function plateShape(input: [number, number][], radius = 0.06): Shape {
  // An outline wound clockwise extrudes with its normals pointing
  // inward, and the part comes out black. Make the winding consistent
  // before anything else happens to it.
  let area = 0;
  for (let i = 0; i < input.length; i += 1) {
    const [x1, y1] = input[i];
    const [x2, y2] = input[(i + 1) % input.length];
    area += x1 * y2 - x2 * y1;
  }
  const points = area < 0 ? [...input].reverse() : input;

  const shape = new Shape();
  const count = points.length;
  for (let i = 0; i < count; i += 1) {
    const prev = points[(i - 1 + count) % count];
    const curr = points[i];
    const next = points[(i + 1) % count];

    const toPrev = [prev[0] - curr[0], prev[1] - curr[1]];
    const toNext = [next[0] - curr[0], next[1] - curr[1]];
    const lenPrev = Math.hypot(toPrev[0], toPrev[1]) || 1;
    const lenNext = Math.hypot(toNext[0], toNext[1]) || 1;
    const cut = Math.min(radius, lenPrev / 2, lenNext / 2);

    const start: [number, number] = [
      curr[0] + (toPrev[0] / lenPrev) * cut,
      curr[1] + (toPrev[1] / lenPrev) * cut,
    ];
    const end: [number, number] = [
      curr[0] + (toNext[0] / lenNext) * cut,
      curr[1] + (toNext[1] / lenNext) * cut,
    ];

    if (i === 0) shape.moveTo(...start);
    else shape.lineTo(...start);
    shape.quadraticCurveTo(curr[0], curr[1], ...end);
  }
  shape.closePath();
  return shape;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

function useMovementMaterials() {
  return useMemo(() => {
    const perlage = createPerlageTexture();
    const cotes = createCotesTexture();
    cotes.repeat.set(1.6, 1.6);
    cotes.wrapS = RepeatWrapping;
    cotes.wrapT = RepeatWrapping;
    const gilt = createGiltTexture();

    return {
      plate: new MeshStandardMaterial({
        map: perlage,
        color: "#b6bbbd",
        metalness: 0.92,
        roughness: 0.44,
        envMapIntensity: 1,
      }),
      bridge: new MeshStandardMaterial({
        map: cotes,
        color: "#b6bbbe",
        metalness: 0.95,
        roughness: 0.4,
        envMapIntensity: 1.15,
      }),
      gilt: new MeshStandardMaterial({
        map: gilt,
        color: "#b39a68",
        metalness: 1,
        roughness: 0.3,
        envMapIntensity: 1.3,
      }),
      // The crown and ratchet wheels are steel, not gold.
      wheelSteel: new MeshStandardMaterial({
        color: "#9aa0a3",
        metalness: 1,
        roughness: 0.32,
        envMapIntensity: 1.2,
      }),
      steel: new MeshPhysicalMaterial({
        color: "#d9dcde",
        metalness: 1,
        roughness: 0.09,
        envMapIntensity: 1.6,
      }),
      blued: new MeshPhysicalMaterial({
        color: "#16315e",
        metalness: 1,
        roughness: 0.07,
        envMapIntensity: 2.6,
      }),
      ruby: new MeshPhysicalMaterial({
        color: "#7d1a20",
        metalness: 0,
        roughness: 0.08,
        transparent: true,
        opacity: 0.94,
        envMapIntensity: 1.8,
      }),
    };
  }, []);
}

type MovementMaterials = ReturnType<typeof useMovementMaterials>;

/* ------------------------------------------------------------------ */
/* Parts                                                               */
/* ------------------------------------------------------------------ */

interface WheelSpec {
  key: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  teeth: number;
  spokes: number;
  /** Radians per second at full speed. */
  rate: number;
}

const WHEELS: WheelSpec[] = [
  { key: "ratchet", x: -0.02, y: 0.36, z: 0.175, radius: 0.28, teeth: 62, spokes: 0, rate: 0.045 },
  { key: "crown", x: -0.38, y: 0.3, z: 0.175, radius: 0.16, teeth: 36, spokes: 0, rate: -0.079 },
  { key: "centre", x: 0.06, y: -0.02, z: 0.05, radius: 0.25, teeth: 56, spokes: 5, rate: -0.09 },
  { key: "third", x: 0.36, y: 0.12, z: 0.05, radius: 0.16, teeth: 36, spokes: 4, rate: 0.14 },
  { key: "fourth", x: 0.38, y: -0.2, z: 0.05, radius: 0.13, teeth: 30, spokes: 4, rate: -0.42 },
];

function Wheels({ materials }: { materials: MovementMaterials }) {
  const refs = useRef<Record<string, Group | null>>({});

  const geometries = useMemo(
    () =>
      Object.fromEntries(
        WHEELS.map((wheel) => [
          wheel.key,
          new ExtrudeGeometry(gearShape(wheel.radius, wheel.teeth, wheel.spokes), {
            depth: 0.022,
            bevelEnabled: true,
            bevelThickness: 0.004,
            bevelSize: 0.004,
            bevelSegments: 1,
          }),
        ]),
      ),
    [],
  );

  useFrame((_, delta) => {
    if (stage.mode === "static") return;
    const dt = Math.min(delta, 0.05);
    WHEELS.forEach((wheel) => {
      const node = refs.current[wheel.key];
      if (node) node.rotation.z += wheel.rate * dt;
    });
  });

  return (
    <group>
      {WHEELS.map((wheel) => (
        <group key={wheel.key} position={[wheel.x, wheel.y, wheel.z]}>
          <group
            ref={(node) => {
              refs.current[wheel.key] = node;
            }}
          >
            <mesh
              castShadow
              geometry={geometries[wheel.key]}
              material={
                wheel.key === "ratchet" || wheel.key === "crown"
                  ? materials.wheelSteel
                  : materials.gilt
              }
            />
          </group>
          {/* Arbor, running in its jewel */}
          <mesh
            position={[0, 0, 0.012]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.steel}
          >
            <cylinderGeometry args={[0.019, 0.019, 0.09, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Escapement({ materials }: { materials: MovementMaterials }) {
  const escape = useRef<Group>(null);
  const fork = useRef<Group>(null);
  const balance = useRef<Group>(null);
  const beat = useRef(0);
  const stepped = useRef(0);

  const escapeGeometry = useMemo(
    () =>
      new ExtrudeGeometry(gearShape(0.1, 20, 0), {
        depth: 0.014,
        bevelEnabled: false,
      }),
    [],
  );

  // Four turns of flat spiral, the way a hairspring is coiled.
  const hairspring = useMemo(() => {
    const points: Vector3[] = [];
    const turns = 4.2;
    const steps = 260;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      const radius = 0.028 + t * 0.155;
      points.push(
        new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0),
      );
    }
    return new TubeGeometry(new CatmullRomCurve3(points), 300, 0.0055, 6, false);
  }, []);

  useFrame((_, delta) => {
    if (stage.mode === "static") return;
    const dt = Math.min(delta, 0.05);
    // Slowed from a real 4Hz to something the eye can follow.
    beat.current += dt * 1.45;
    const swing = Math.sin(beat.current * Math.PI * 2);

    if (balance.current) balance.current.rotation.z = swing * 1.15;
    if (fork.current) fork.current.rotation.z = Math.sign(swing) * 0.1;

    // The escape wheel is released once per beat, so it steps.
    const beats = Math.floor(beat.current * 2);
    if (beats !== stepped.current) {
      stepped.current = beats;
      if (escape.current) escape.current.rotation.z -= (Math.PI * 2) / 20;
    }
  });

  return (
    <group>
      {/* Escape wheel */}
      <group position={[0.3, -0.44, 0.05]}>
        <group ref={escape}>
          <mesh geometry={escapeGeometry} material={materials.gilt} />
        </group>
      </group>

      {/* Pallet fork */}
      <group ref={fork} position={[0.12, -0.5, 0.075]}>
        <mesh material={materials.steel}>
          <boxGeometry args={[0.2, 0.026, 0.012]} />
        </mesh>
        <mesh position={[0.09, 0.03, 0]} rotation={[0, 0, 0.5]} material={materials.steel}>
          <boxGeometry args={[0.07, 0.02, 0.012]} />
        </mesh>
        <mesh position={[0.09, -0.03, 0]} rotation={[0, 0, -0.5]} material={materials.steel}>
          <boxGeometry args={[0.07, 0.02, 0.012]} />
        </mesh>
        <mesh position={[-0.1, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.steel}>
          <cylinderGeometry args={[0.016, 0.016, 0.05, 10]} />
        </mesh>
      </group>

      {/* Balance, its hairspring, and the cock over both */}
      <group position={[-0.2, -0.36, 0.1]}>
        <group ref={balance}>
          <mesh material={materials.gilt}>
            <torusGeometry args={[0.215, 0.016, 12, 56]} />
          </mesh>
          {[0, Math.PI / 2].map((rot) => (
            <mesh key={rot} rotation={[0, 0, rot]} material={materials.gilt}>
              <boxGeometry args={[0.43, 0.02, 0.013]} />
            </mesh>
          ))}
          {/* Timing screws around the rim */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + 0.2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.215, Math.sin(a) * 0.215, 0.014]}
                rotation={[Math.PI / 2, 0, 0]}
                material={materials.steel}
              >
                <cylinderGeometry args={[0.018, 0.018, 0.022, 8]} />
              </mesh>
            );
          })}
          <mesh position={[0, 0, 0.035]} geometry={hairspring} material={materials.blued} />
        </group>
        <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]} material={materials.steel}>
          <cylinderGeometry args={[0.03, 0.03, 0.055, 12]} />
        </mesh>
      </group>
    </group>
  );
}

function Jewels({ materials }: { materials: MovementMaterials }) {
  const seats: [number, number, number][] = [
    [0.06, -0.02, 0.108],
    [0.36, 0.12, 0.108],
    [0.38, -0.2, 0.108],
    [0.3, -0.44, 0.072],
    [0.12, -0.5, 0.095],
    [-0.2, -0.36, 0.155],
    [-0.02, 0.36, 0.215],
    [-0.46, -0.1, 0.08],
    [0.5, 0.36, 0.08],
  ];

  return (
    <group>
      {seats.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh material={materials.steel}>
            <torusGeometry args={[0.036, 0.008, 8, 20]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.ruby}>
            <cylinderGeometry args={[0.031, 0.031, 0.015, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Screws({ materials }: { materials: MovementMaterials }) {
  const seats: [number, number, number][] = [
    [-0.58, 0.44, 0.135],
    [0.42, 0.5, 0.135],
    [0.62, -0.08, 0.135],
    [-0.62, -0.26, 0.1],
    [0.06, 0.62, 0.1],
    [-0.36, -0.58, 0.1],
    [0.34, -0.62, 0.1],
  ];

  return (
    <group>
      {seats.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, 0, i * 0.7]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.blued}>
            <cylinderGeometry args={[0.036, 0.036, 0.018, 18]} />
          </mesh>
          {/* Slot */}
          <mesh position={[0, 0, 0.011]} material={materials.plate}>
            <boxGeometry args={[0.06, 0.009, 0.006]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function Movement() {
  const materials = useMovementMaterials();

  const bridges = useMemo(() => {
    const barrel = plateShape(
      [
        [-0.7, 0.16],
        [-0.54, 0.5],
        [-0.16, 0.62],
        [0.1, 0.5],
        [0.08, 0.28],
        [-0.16, 0.2],
        [-0.38, 0.1],
      ],
      0.09,
    );
    const train = plateShape(
      [
        [0.2, 0.4],
        [0.58, 0.44],
        [0.66, 0.1],
        [0.54, -0.3],
        [0.3, -0.34],
        [0.28, -0.04],
      ],
      0.08,
    );
    const cock = plateShape(
      [
        [-0.62, -0.4],
        [-0.34, -0.2],
        [-0.06, -0.3],
        [-0.1, -0.5],
        [-0.42, -0.58],
      ],
      0.06,
    );
    const options = {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
    } as const;
    return {
      barrel: new ExtrudeGeometry(barrel, options),
      train: new ExtrudeGeometry(train, options),
      cock: new ExtrudeGeometry(cock, options),
    };
  }, []);

  return (
    <group>
      {/*
        One hard source of its own, close in and raking across the
        plate. A movement only reads as layers if the raised parts
        throw something, so this light casts and everything above the
        plate catches it.
      */}
      <directionalLight
        castShadow
        position={[-1.7, 2.1, 2.6]}
        intensity={0.95}
        color="#fff6e6"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={3}
        shadow-bias={-0.0009}
        shadow-normalBias={0.012}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        shadow-camera-left={-1.3}
        shadow-camera-right={1.3}
        shadow-camera-top={1.3}
        shadow-camera-bottom={-1.3}
      />

      {/* Main plate */}
      <mesh material={materials.plate} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[PLATE_R, PLATE_R, 0.05, 96]} />
      </mesh>
      <mesh material={materials.steel}>
        <torusGeometry args={[PLATE_R, 0.014, 10, 80]} />
      </mesh>

      {/* Barrel, under its ratchet wheel */}
      <mesh position={[-0.02, 0.36, 0.045]} rotation={[Math.PI / 2, 0, 0]} material={materials.gilt}>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 56]} />
      </mesh>

      <Wheels materials={materials} />
      <Escapement materials={materials} />

      {/* Bridges, standing proud of the train and throwing real
          shadows down onto the plate and onto each other. */}
      {(
        [
          ["barrel", bridges.barrel, 0.085],
          ["train", bridges.train, 0.085],
          ["cock", bridges.cock, 0.115],
        ] as const
      ).map(([key, geometry, z]) => (
        <mesh
          key={key}
          geometry={geometry}
          material={materials.bridge}
          position={[0, 0, z]}
          castShadow
          receiveShadow
        />
      ))}

      <Jewels materials={materials} />
      <Screws materials={materials} />

      {/* Winding stem, out at three */}
      <mesh
        position={[0.82, 0, 0.02]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.steel}
      >
        <cylinderGeometry args={[0.028, 0.028, 0.3, 14]} />
      </mesh>
      <mesh
        position={[1.04, 0, 0.02]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.steel}
      >
        <cylinderGeometry args={[0.095, 0.105, 0.11, 22]} />
      </mesh>
    </group>
  );
}
