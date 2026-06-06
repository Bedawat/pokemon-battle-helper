import type { ReactNode } from "react";
import styles from "./Button.module.css";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** "primary" = Akzent-CTA, "secondary" = dezenter Sekundär-Button. */
  variant?: "primary" | "secondary";
  disabled?: boolean;
  type?: "button" | "submit";
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      className={styles.button}
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
