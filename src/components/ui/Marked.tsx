/**
 * Renders copy with any `[PLACEHOLDER]` token visibly marked, so an
 * unverified number cannot reach production looking like a fact.
 */
export function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[PLACEHOLDER\])/g).map((chunk, i) =>
        chunk === "[PLACEHOLDER]" ? (
          <span key={i} className="placeholder">
            [PLACEHOLDER]
          </span>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </>
  );
}
