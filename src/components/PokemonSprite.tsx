import { useState } from "react";
import styles from "./PokemonSprite.module.css";

interface PokemonSpriteProps {
  src: string;
  alt: string;
  /** Kantenlänge in px. */
  size?: number;
}

/** Pokémon-Sprite mit Lazy-Loading und Fallback-Platzhalter bei Ladefehler. */
export function PokemonSprite({ src, alt, size = 56 }: PokemonSpriteProps) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      {failed ? (
        <span className={styles.placeholder} aria-hidden="true">
          ?
        </span>
      ) : (
        <img
          className={styles.img}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
