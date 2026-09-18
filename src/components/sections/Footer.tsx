import styles from "./Footer.module.css";

const COLUMNS = [
  {
    title: "The watch",
    links: [
      { href: "#specification", label: "Specification" },
      { href: "#craft", label: "How it is made" },
      { href: "#limited", label: "Edition" },
      { href: "#collection", label: "Collection" },
    ],
  },
  {
    title: "Ownership",
    links: [
      { href: "#limited", label: "Join the list" },
      { href: "#", label: "Service" },
      { href: "#", label: "Warranty" },
      { href: "#", label: "Contact" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { href: "#", label: "Instagram" },
      { href: "#", label: "Journal" },
      { href: "#", label: "Newsletter" },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="shell">
        <div className={styles.top}>
          <div>
            <p className={styles.wordmark}>Meridian</p>
            <p className={styles.line}>
              One watch, made in small numbers, sold directly. Working name —
              the brand mark is not final.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title} className={styles.column}>
              <p className={styles.columnTitle}>{column.title}</p>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.base}>
          <p>© Meridian. All rights reserved.</p>
          <p>Shipped insured, worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
