/**
 * A hairline that draws itself when its section arrives. Used as a
 * structural divider only — never as decoration.
 */
export function Rule({ className }: { className?: string }) {
  return (
    <hr
      data-draw
      className={["rule", "draw-rule", className].filter(Boolean).join(" ")}
    />
  );
}
