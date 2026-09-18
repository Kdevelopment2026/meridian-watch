"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BackSide,
  CatmullRomCurve3,
  CircleGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Quaternion,
  Shape,
  Vector2,
  Vector3,
} from "three";

import {
  createCrocTexture,
  createDialTexture,
} from "@/lib/watch/dialTexture";
import { PART_BY_ID, partProgress, type PartId } from "@/lib/watch/parts";
import {
  registerAnchor,
  stage,
  type StageQuality,
} from "@/lib/watch/stage";
import { disposeAll } from "@/lib/watch/dispose";
import { Movement } from "./Movement";

/* ------------------------------------------------------------------ */
/* Dimensions. One unit is roughly a third of the case diameter.       */
/* ------------------------------------------------------------------ */

const CASE_R = 1;
const DIAL_R = 0.84;
const BAND_TOP = 0.16;
const BAND_BOTTOM = -0.16;

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

function useWatchMaterials(quality: StageQuality) {
  return useMemo(() => {
    const polishedSteel = new MeshPhysicalMaterial({
      color: "#d5d8da",
      metalness: 1,
      roughness: 0.08,
      envMapIntensity: 1.5,
    });

    const brushedSteel = new MeshPhysicalMaterial({
      color: "#b3b7ba",
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.15,
    });

    const markerSteel = new MeshPhysicalMaterial({
      color: "#e4e8ea",
      metalness: 1,
      roughness: 0.22,
      envMapIntensity: 2.2,
    });



    const handSteel = new MeshPhysicalMaterial({
      color: "#eef1f3",
      metalness: 1,
      roughness: 0.15,
      envMapIntensity: 2.4,
    });

    const fine = quality === "high";
    const croc = createCrocTexture(fine ? 1 : 0.5);
    croc.wrapS = RepeatWrapping;
    croc.wrapT = RepeatWrapping;
    croc.repeat.set(2.2, 9);

    const leather = new MeshPhysicalMaterial({
      map: croc,
      color: "#a8a29c",
      metalness: 0,
      roughness: 0.6,
      clearcoat: 0.35,
      clearcoatRoughness: 0.42,
      envMapIntensity: 0.5,
    });

    /*
      Sapphire is a thin, near-index-matched window, so `transmission`
      buys almost nothing here and costs a full extra scene render every
      frame. A low-opacity specular layer reads as glass over a dark
      ground and keeps what is behind it legible.
    */
    const sapphire = new MeshPhysicalMaterial({
      color: "#d8e3ef",
      metalness: 0,
      roughness: 0.015,
      transparent: true,
      opacity: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.015,
      depthWrite: false,
      envMapIntensity: quality === "high" ? 0.75 : 0.6,
    });



    const dialFace = new MeshPhysicalMaterial({
      map: createDialTexture(fine ? 1024 : 512),
      metalness: 0.5,
      roughness: 0.34,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.85,
    });


    const gasket = new MeshStandardMaterial({
      color: "#151310",
      metalness: 0.1,
      roughness: 0.9,
    });

    return {
      polishedSteel,
      brushedSteel,
      markerSteel,
      handSteel,
      leather,
      sapphire,
      dialFace,
      gasket,
    };
  }, [quality]);
}

type Materials = ReturnType<typeof useWatchMaterials>;

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

function lathePoints(pairs: [number, number][]) {
  return pairs.map(([x, y]) => new Vector2(x, y));
}

function useWatchGeometry() {
  return useMemo(() => {
    /* Case band: a turned profile with a chamfered bezel and a
       slightly proud mid-case, so light catches one edge at a time. */
    const caseBand = new LatheGeometry(
      lathePoints([
        [DIAL_R - 0.01, BAND_BOTTOM],
        [CASE_R - 0.03, BAND_BOTTOM],
        [CASE_R, BAND_BOTTOM + 0.04],
        [CASE_R + 0.015, -0.02],
        [CASE_R, 0.05],
        [CASE_R - 0.02, BAND_TOP - 0.05],
        [CASE_R - 0.09, BAND_TOP],
        [DIAL_R - 0.01, BAND_TOP - 0.035],
        [DIAL_R - 0.01, BAND_BOTTOM],
      ]),
      128,
    );
    caseBand.rotateX(Math.PI / 2);

    /* Crystal: a box sapphire — flat underside, straight flank, domed
       top — turned as one closed solid so it refracts like a lens
       rather than a shell. */
    const CRYSTAL_SEAT = 0.085;
    const crystalProfile: [number, number][] = [
      [0, CRYSTAL_SEAT],
      [DIAL_R, CRYSTAL_SEAT],
      [DIAL_R, CRYSTAL_SEAT + 0.07],
    ];
    const domeSteps = 24;
    for (let i = domeSteps; i >= 0; i -= 1) {
      const t = i / domeSteps;
      crystalProfile.push([
        DIAL_R * t,
        CRYSTAL_SEAT + 0.07 + 0.05 * (1 - t * t),
      ]);
    }
    const crystal = new LatheGeometry(lathePoints(crystalProfile), 96);
    crystal.rotateX(Math.PI / 2);

    /* Case-back: knurled rim, sapphire pane, engraved seat. */
    const caseBackRing = new LatheGeometry(
      lathePoints([
        [0.5, 0],
        [DIAL_R, 0],
        [CASE_R - 0.06, -0.03],
        [CASE_R - 0.06, -0.075],
        [DIAL_R - 0.02, -0.095],
        [0.5, -0.07],
        [0.5, 0],
      ]),
      96,
    );
    caseBackRing.rotateX(Math.PI / 2);

    const dial = new CircleGeometry(DIAL_R, 96);

    /* An applied baton: one piece, chamfered all round, so it carries a
       single bright edge instead of reading as two bars. */
    const batonShape = new Shape();
    {
      const w = 0.017;
      const h = 0.1;
      batonShape.moveTo(-w, -h);
      batonShape.lineTo(w, -h);
      batonShape.lineTo(w, h);
      batonShape.lineTo(-w, h);
      batonShape.closePath();
    }
    const baton = new ExtrudeGeometry(batonShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.009,
      bevelSize: 0.009,
      bevelSegments: 2,
    });

    /* Hands, drawn as flat shapes and given depth. */
    const handShape = (length: number, width: number, tailLength: number) => {
      const s = new Shape();
      const w = width / 2;
      s.moveTo(-w, -tailLength);
      s.lineTo(w, -tailLength);
      s.lineTo(w * 0.8, length * 0.55);
      s.lineTo(w * 0.28, length);
      s.lineTo(-w * 0.28, length);
      s.lineTo(-w * 0.8, length * 0.55);
      s.closePath();
      return new ExtrudeGeometry(s, {
        depth: 0.012,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
    };

    const hourHand = handShape(0.45, 0.062, 0.1);
    const minuteHand = handShape(0.72, 0.044, 0.12);

    /* A centre seconds hand: a hairline with a counterweight, the way
       the photographs show it. */
    const secondsShape = new Shape();
    secondsShape.moveTo(-0.007, -0.2);
    secondsShape.lineTo(0.007, -0.2);
    secondsShape.lineTo(0.0045, 0.76);
    secondsShape.lineTo(-0.0045, 0.76);
    secondsShape.closePath();
    const secondsHand = new ExtrudeGeometry(secondsShape, {
      depth: 0.007,
      bevelEnabled: false,
    });

    /* Strap: a rounded band swept along a curve that falls away from
       each lug the way leather does when the watch is off the wrist. */
    const strapSection = new Shape();
    const sw = 0.53;
    const sh = 0.05;
    const r = 0.02;
    strapSection.moveTo(-sw + r, -sh);
    strapSection.lineTo(sw - r, -sh);
    strapSection.quadraticCurveTo(sw, -sh, sw, -sh + r);
    strapSection.lineTo(sw, sh - r);
    strapSection.quadraticCurveTo(sw, sh, sw - r, sh);
    strapSection.lineTo(-sw + r, sh);
    strapSection.quadraticCurveTo(-sw, sh, -sw, sh - r);
    strapSection.lineTo(-sw, -sh + r);
    strapSection.quadraticCurveTo(-sw, -sh, -sw + r, -sh);

    /* The whole strap, both halves: up over the lug and curling back
       behind the watch on one side, down and coiling away to the left
       on the other, the way a strap falls when the watch is off the
       wrist. Curling the ends keeps the full length inside the frame. */
    const makeStrap = (points: [number, number, number][]) =>
      new ExtrudeGeometry(strapSection, {
        steps: 72,
        bevelEnabled: false,
        extrudePath: new CatmullRomCurve3(
          points.map(([x, y, z]) => new Vector3(x, y, z)),
        ),
      });

    /* The two halves now meet behind the case and buckle together, so
       the strap is a closed loop rather than two loose ends. Each half
       rises over its lug, arcs back, and comes to the fastening at
       roughly the height of the case centre. */
    const upperPath: [number, number, number][] = [
      [0, 1.0, -0.02],
      [0, 1.46, -0.18],
      [0, 1.8, -0.6],
      [0, 1.82, -1.08],
      [0, 1.5, -1.44],
      [0, 1.0, -1.58],
      [0, 0.42, -1.6],
    ];

    const lowerPath: [number, number, number][] = [
      [0, -1.0, -0.02],
      [0, -1.46, -0.18],
      [0, -1.82, -0.6],
      [0, -1.84, -1.08],
      [0, -1.5, -1.44],
      [0, -0.95, -1.58],
      [0, -0.3, -1.6],
    ];

    /* ExtrudeGeometry maps UVs from world position, which on a band
       swept along a curve collapses the scale pattern. Lay them out by
       hand instead: across the width, then along the run. */
    const layStrapUvs = (geometry: ExtrudeGeometry) => {
      const position = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        const run = Math.min(
          1,
          Math.max(0, (Math.hypot(x, y, z) - 0.95) / 1.5),
        );
        uv.setXY(i, (x + sw) / (sw * 2), run);
      }
      uv.needsUpdate = true;
    };

    const strapTop = makeStrap(upperPath);
    const strapBottom = makeStrap(lowerPath);
    layStrapUvs(strapTop);
    layStrapUvs(strapBottom);

    const seatOn = (path: [number, number, number][], along: number) => {
      const tip = new Vector3(...path[path.length - 1]);
      const before = new Vector3(...path[path.length - 2]);
      const heading = tip.clone().sub(before).normalize();
      return {
        position: tip.clone().add(heading.clone().multiplyScalar(along)),
        quaternion: new Quaternion().setFromUnitVectors(
          new Vector3(0, 1, 0),
          heading,
        ),
      };
    };

    const buckle = seatOn(upperPath, 0.16);
    const keeper = seatOn(lowerPath, 0.1);

    return {
      caseBand,
      crystal,
      caseBackRing,
      dial,
      hourHand,
      minuteHand,
      secondsHand,
      baton,
      strapTop,
      strapBottom,
      buckle,
      keeper,
    };
  }, []);
}

/* ------------------------------------------------------------------ */
/* Explode wrapper                                                     */
/* ------------------------------------------------------------------ */

function PartGroup({
  id,
  children,
}: {
  id: PartId;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  const anchor = useRef<Group>(null);
  const part = PART_BY_ID[id];

  useEffect(() => {
    registerAnchor(id, anchor.current);
    return () => registerAnchor(id, null);
  }, [id]);

  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    const t = partProgress(part, stage.progress);
    const [ax, ay, az] = part.assembled;
    const [ex, ey, ez] = part.exploded;
    // A phone cannot hold a seven-part diagram and a headline at once, so
    // there the parts separate only enough to read as opening, and the
    // caption underneath names whichever one has just settled.
    const spreadX = stage.compact ? 0.75 : 1;
    const spreadY = stage.compact ? 1 : 1;
    group.position.set(
      ax + (ex * spreadX - ax) * t,
      ay + (ey * spreadY - ay) * t,
      az + (ez - az) * t,
    );
    group.rotation.set(
      part.tumble[0] * t,
      part.tumble[1] * t,
      part.tumble[2] * t,
    );
    if (part.scaleTo) {
      const scale = 1 + (part.scaleTo - 1) * t;
      group.scale.setScalar(scale);
    }
  });

  return (
    <group ref={ref}>
      <group ref={anchor} position={part.anchorAt} />
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-assemblies                                                      */
/* ------------------------------------------------------------------ */

/** Lugs are set on the case radius and point away from its centre. */
const LUG_ANGLES = [0.52, -0.52, Math.PI - 0.52, Math.PI + 0.52];

function Lugs({ materials }: { materials: Materials }) {
  return (
    <group>
      {LUG_ANGLES.map((angle, i) => {
        const radius = 0.99;
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius;
        return (
          <mesh
            key={i}
            position={[x, y, -0.01]}
            rotation={[0, 0, -angle]}
            material={materials.polishedSteel}
          >
            <cylinderGeometry args={[0.085, 0.15, 0.36, 10, 1, false]} />
          </mesh>
        );
      })}
      {/* Spring bars between each lug pair. */}
      {[1.04, -1.04].map((y) => (
        <mesh
          key={y}
          position={[0, y, -0.01]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.brushedSteel}
        >
          <cylinderGeometry args={[0.028, 0.028, 1.18, 16]} />
        </mesh>
      ))}
    </group>
  );
}

function Crown({ materials }: { materials: Materials }) {
  return (
    <group position={[CASE_R + 0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh material={materials.brushedSteel}>
        {/* Low radial segment count reads as knurling at this scale. */}
        <cylinderGeometry args={[0.095, 0.105, 0.11, 20]} />
      </mesh>
      <mesh position={[0, 0.062, 0]} material={materials.polishedSteel}>
        <cylinderGeometry args={[0.085, 0.085, 0.02, 24]} />
      </mesh>
      <mesh position={[0, -0.075, 0]} material={materials.polishedSteel}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
      </mesh>
    </group>
  );
}

function AppliedIndices({
  materials,
  geometry,
}: {
  materials: Materials;
  geometry: ExtrudeGeometry;
}) {
  const markers: React.ReactElement[] = [];

  const baton = (key: string, angle: number, offset: number) => {
    const r = DIAL_R * 0.655;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    // Shift the doubled marker along the dial's tangent.
    const x = sin * r + cos * offset;
    const y = cos * r - sin * offset;
    markers.push(
      <mesh
        key={key}
        geometry={geometry}
        material={materials.markerSteel}
        position={[x, y, 0.012]}
        rotation={[0, 0, -angle]}
      />,
    );
  };

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    if (i === 0) {
      baton("12a", angle, -0.032);
      baton("12b", angle, 0.032);
    } else {
      baton(String(i), angle, 0);
    }
  }

  return <group>{markers}</group>;
}

/**
 * The keeper: the loop the free end of a strap is threaded back
 * through once the buckle is closed. It is what makes the two halves
 * read as fastened rather than as two pieces that happen to touch.
 */
function Keeper({
  materials,
  seat,
}: {
  materials: Materials;
  seat: { position: Vector3; quaternion: Quaternion };
}) {
  return (
    <group position={seat.position} quaternion={seat.quaternion}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.leather}>
        <torusGeometry args={[0.56, 0.034, 8, 40]} />
      </mesh>
    </group>
  );
}

/** Pin buckle, seated on the end of the strap and aligned to its run. */
function Buckle({
  materials,
  seat,
}: {
  materials: Materials;
  seat: { position: Vector3; quaternion: Quaternion };
}) {
  const outerW = 0.46;
  const outerL = 0.38;
  const bar = 0.055;

  return (
    <group position={seat.position} quaternion={seat.quaternion}>
      {/* Frame */}
      {[
        { pos: [0, outerL / 2, 0], size: [outerW, bar, bar] },
        { pos: [0, -outerL / 2, 0], size: [outerW, bar, bar] },
        { pos: [-outerW / 2, 0, 0], size: [bar, outerL, bar] },
        { pos: [outerW / 2, 0, 0], size: [bar, outerL, bar] },
      ].map((piece, i) => (
        <mesh
          key={i}
          position={piece.pos as [number, number, number]}
          material={materials.polishedSteel}
        >
          <boxGeometry args={piece.size as [number, number, number]} />
        </mesh>
      ))}
      {/* Cross bar and tang */}
      <mesh material={materials.brushedSteel}>
        <boxGeometry args={[outerW - bar, 0.022, 0.022]} />
      </mesh>
      <mesh position={[0, 0.1, 0.012]} material={materials.polishedSteel}>
        <boxGeometry args={[0.02, 0.2, 0.014]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The watch                                                           */
/* ------------------------------------------------------------------ */

const TURN = Math.PI * 2;

export function WatchModel({ quality }: { quality: StageQuality }) {
  const materials = useWatchMaterials(quality);
  const geo = useWatchGeometry();

  // Both sets are rebuilt when the quality changes, so the old ones
  // have to hand their GPU resources back.
  useEffect(() => () => disposeAll(Object.values(materials)), [materials]);
  useEffect(() => () => disposeAll(Object.values(geo)), [geo]);
  const hour = useRef<Mesh>(null);
  const minute = useRef<Mesh>(null);
  const seconds = useRef<Mesh>(null);

  useFrame(() => {
    /*
      The watch keeps the viewer's local time rather than the 10:10 pose
      product photography uses. Each hand carries the fraction of the one
      below it, so the hour hand sits between markers as it should and
      the running seconds sweep instead of stepping.

      Under reduced motion the canvas only renders on demand, so the
      hands are set to the time the page loaded and then hold there.
    */
    const now = new Date();
    const second = now.getSeconds() + now.getMilliseconds() / 1000;
    const minuteOf = now.getMinutes() + second / 60;
    const hourOf = (now.getHours() % 12) + minuteOf / 60;

    if (hour.current) hour.current.rotation.z = -(hourOf / 12) * TURN;
    if (minute.current) minute.current.rotation.z = -(minuteOf / 60) * TURN;
    if (seconds.current) seconds.current.rotation.z = -(second / 60) * TURN;
  });

  return (
    <group>
      <PartGroup id="strap">
        <mesh geometry={geo.strapTop} material={materials.leather} />
        <mesh geometry={geo.strapBottom} material={materials.leather} />
        <Buckle materials={materials} seat={geo.buckle} />
        <Keeper materials={materials} seat={geo.keeper} />
      </PartGroup>

      <PartGroup id="caseback">
        <mesh geometry={geo.caseBackRing} material={materials.brushedSteel} />
        {/* Sapphire pane, seated in its own bezel */}
        <mesh
          position={[0, 0, -0.055]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.sapphire}
        >
          <cylinderGeometry args={[0.5, 0.5, 0.016, 64]} />
        </mesh>
        <mesh position={[0, 0, -0.05]} material={materials.polishedSteel}>
          <torusGeometry args={[0.5, 0.018, 10, 64]} />
        </mesh>
        {/* Engraved band between bezel and rim */}
        <mesh
          position={[0, 0, -0.088]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.brushedSteel}
        >
          <cylinderGeometry args={[0.66, 0.66, 0.012, 48]} />
        </mesh>
        <mesh position={[0, 0, -0.02]} material={materials.gasket}>
          <torusGeometry args={[DIAL_R - 0.02, 0.014, 8, 64]} />
        </mesh>
      </PartGroup>

      <PartGroup id="movement">
        {/* The caliber runs: geared train, stepping escape wheel and an
            oscillating balance on its hairspring. */}
        <group position={[0, 0, -0.26]}>
          <Movement quality={quality} />
        </group>
      </PartGroup>

      <PartGroup id="dial">
        <mesh
          geometry={geo.dial}
          material={materials.dialFace}
          position={[0, 0, 0.02]}
        />
        <group position={[0, 0, 0.02]}>
          <AppliedIndices materials={materials} geometry={geo.baton} />
        </group>
      </PartGroup>

      <PartGroup id="hands">
        <group position={[0, 0, 0.042]}>
          <mesh
            ref={hour}
            geometry={geo.hourHand}
            material={materials.handSteel}
          />
          <mesh
            ref={minute}
            geometry={geo.minuteHand}
            material={materials.handSteel}
            position={[0, 0, 0.016]}
          />
          <mesh
            ref={seconds}
            geometry={geo.secondsHand}
            material={materials.handSteel}
            position={[0, 0, 0.026]}
          />
          <mesh
            position={[0, 0, 0.038]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.polishedSteel}
          >
            <cylinderGeometry args={[0.03, 0.03, 0.022, 24]} />
          </mesh>
        </group>
      </PartGroup>

      <PartGroup id="crystal">
        <mesh geometry={geo.crystal} material={materials.sapphire} />
      </PartGroup>

      <PartGroup id="case">
        <mesh geometry={geo.caseBand} material={materials.polishedSteel} />
        {/* Inner flank, so the case does not read as hollow when open */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[DIAL_R, DIAL_R, 0.3, 64, 1, true]} />
          <meshStandardMaterial
            color="#8f8b84"
            metalness={0.95}
            roughness={0.4}
            side={BackSide}
          />
        </mesh>
        <Lugs materials={materials} />
        <Crown materials={materials} />
      </PartGroup>
    </group>
  );
}

