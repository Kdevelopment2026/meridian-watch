import { Plate } from "@/components/ui/Plate";
import assembled from "@/images/hero-assembled.jpg";
import movementApart from "@/images/movement-apart.jpg";
import styles from "./Craftsmanship.module.css";

export function Craftsmanship() {
  return (
    <section
      id="craft"
      className={`${styles.section} section`}
      aria-labelledby="craft-title"
    >
      <div className="shell">
        <div className={styles.grid}>
          <Plate
            image={assembled}
            alt="The watch case and bezel, lit from one side against a dark ground."
            caption="The case, closed"
            focus="62% 44%"
            zoom={1.5}
            origin="64% 42%"
            sizes="(max-width: 900px) 92vw, 40vw"
            className={styles.tall}
          />

          <div className={styles.words}>
            <blockquote className={styles.quote}>
              <p id="craft-title" style={{ margin: 0 }}>
                A movement is finished on surfaces the owner will never see.
                That is the entire argument for doing it well.
              </p>
            </blockquote>
            <p className={styles.attribution}>
              Meridian, on why the case-back is made of sapphire
            </p>

            <div className={styles.body}>
              <p>
                None of the finishing on this watch is decoration. A grained
                surface holds oil where a polished one lets it run. An edge
                broken by hand does not raise a burr that will later shed into
                the train. The work is functional first and beautiful as a
                consequence, which is the order those two things belong in.
              </p>
              <p>
                It is also slow. Bridges are grained one at a time, in one
                direction, and the chamfers are cut with a steel point rather
                than a wheel, because a wheel rounds what should stay crisp. A
                single movement takes a person a working week to finish, and
                there is no version of that week that can be shortened.
              </p>
            </div>
          </div>

          <div className={styles.pair}>
            <Plate
              image={movementApart}
              alt="Caliber M.01 taken apart: balance cock, barrel bridge, wheels, click spring and winding stem lifted clear of the main plate."
              caption="Caliber M.01, taken apart"
              focus="50% 42%"
              sizes="(max-width: 900px) 92vw, 44vw"
              className={styles.wide}
            />
            <Plate
              image={assembled}
              alt="The alligator strap, squared scales running away from the lug."
              caption="Alligator, squared and stitched"
              focus="50% 94%"
              sizes="(max-width: 900px) 92vw, 44vw"
              className={`${styles.wide} ${styles.offset}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
