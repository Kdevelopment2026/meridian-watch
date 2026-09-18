export type IndexStyle = "baton" | "sector" | "dot";

export interface DialMarkProps {
  dial: string;
  accent: string;
  indices: IndexStyle;
  title: string;
}

/**
 * A drawn, unbranded dial. Line art rather than a photograph, so the
 * collection can be shown before there is anything to photograph — and
 * so no dial carries a name it has not earned.
 */
export function DialMark({
  dial,
  accent,
  indices,
  title,
}: DialMarkProps) {
  const marks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const sin = Math.sin(angle);
    const cos = -Math.cos(angle);
    const outer = 41;
    const inner = indices === "sector" ? 30 : i % 3 === 0 ? 33 : 35.5;
    return {
      i,
      x1: 60 + sin * outer,
      y1: 60 + cos * outer,
      x2: 60 + sin * inner,
      y2: 60 + cos * inner,
      cx: 60 + sin * 38,
      cy: 60 + cos * 38,
      quarter: i % 3 === 0,
    };
  });

  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title}>
      {/* Lugs */}
      {[
        [48, 8, 44, 2],
        [72, 8, 76, 2],
        [48, 112, 44, 118],
        [72, 112, 76, 118],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={accent}
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.55"
        />
      ))}

      {/* Crown */}
      <rect x="108" y="56" width="6" height="8" rx="1.5" fill={accent} opacity="0.7" />

      {/* Case and bezel */}
      <circle cx="60" cy="60" r="52" fill="none" stroke={accent} strokeWidth="2" />
      <circle cx="60" cy="60" r="47" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.5" />
      <circle cx="60" cy="60" r="45" fill={dial} />

      {/* Indices */}
      {marks.map((mark) =>
        indices === "dot" ? (
          <circle
            key={mark.i}
            cx={mark.cx}
            cy={mark.cy}
            r={mark.quarter ? 2 : 1.2}
            fill={accent}
          />
        ) : (
          <line
            key={mark.i}
            x1={mark.x1}
            y1={mark.y1}
            x2={mark.x2}
            y2={mark.y2}
            stroke={accent}
            strokeWidth={mark.quarter ? 2.2 : 1.1}
            strokeLinecap="butt"
          />
        ),
      )}

      {indices === "sector" ? (
        <circle
          cx="60"
          cy="60"
          r="29"
          fill="none"
          stroke={accent}
          strokeWidth="0.6"
          opacity="0.7"
        />
      ) : null}


      {/* Hands at ten past ten */}
      <line x1="60" y1="60" x2="40" y2="43" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
      <line x1="60" y1="60" x2="82" y2="41" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="60" cy="60" r="2.2" fill={accent} />
    </svg>
  );
}
