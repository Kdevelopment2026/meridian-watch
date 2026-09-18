import { Marked } from "@/components/ui/Marked";
import styles from "./Assurances.module.css";

const ASSURANCES = [
  { value: "Transferable with the watch, not with the receipt", label: "Warranty" },
  { value: "Case-back number recorded at the bench", label: "Authentication" },
  { value: "Serviced by the watchmaker who signed it", label: "Service" },
  { value: "Returned unworn, no questions asked", label: "Returns" },
];

export function Assurances() {
  return (
    <section className={styles.section} aria-labelledby="assurances-title">
      <div className="shell">
        <h2 id="assurances-title" className={`${styles.head} type-display`}>
          What we will put in writing
        </h2>
        <ul className={styles.list}>
          {ASSURANCES.map((item) => (
            <li key={item.label} className={styles.item}>
              <span className={styles.value}>
                <Marked text={item.value} />
              </span>
              <span className={styles.label}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
