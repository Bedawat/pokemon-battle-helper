import type { ReactNode } from "react";
import type { NavTab } from "../types/navigation";
import styles from "./NavBar.module.css";

interface NavBarProps {
  /** Aktiver Tab (abgeleitet aus dem aktuellen Screen). */
  activeTab: NavTab;
  /** Ist der Team-Tab gesperrt (z. B. im Live-Kampf)? */
  teamTabLocked: boolean;
  /** Wird mit dem angetippten Tab aufgerufen. */
  onTabChange: (tab: NavTab) => void;
}

interface TabConfig {
  id: NavTab;
  label: string;
  icon: ReactNode;
}

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 11.5 12 5l8 6.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 10.5V19h13v-8.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 19v-4.5h4V19"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TeamIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3.5 19a5.5 5.5 0 0 1 11 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const TABS: TabConfig[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "team", label: "Team", icon: <TeamIcon /> },
];

export function NavBar({ activeTab, teamTabLocked, onTabChange }: NavBarProps) {
  return (
    <nav className={styles.navbar} aria-label="Hauptnavigation">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const isLocked = tab.id === "team" && teamTabLocked;
        return (
          <button
            key={tab.id}
            type="button"
            className={styles.tab}
            data-active={isActive}
            disabled={isLocked}
            aria-current={isActive ? "page" : undefined}
            onClick={() => !isLocked && onTabChange(tab.id)}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
