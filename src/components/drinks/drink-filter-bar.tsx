"use client";

import { FilterGroup } from "@/lib/drinks";

interface Props {
  groups: FilterGroup[];
  active: string[];
  onToggle: (option: string) => void;
  accentColor: string;
}

export function DrinkFilterBar({ groups, active, onToggle, accentColor }: Props) {
  return (
    <div
      className="drink-filter-bar"
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      {groups.map((group) => (
        <div key={group.label} className="drink-filter-group">
          <span className="drink-filter-group__label">{group.label}</span>
          <div className="drink-filter-group__chips">
            {group.options.map((option) => {
              const isActive = active.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => onToggle(option)}
                  className={`drink-filter-chip${isActive ? " drink-filter-chip--active" : ""}`}
                  aria-pressed={isActive}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
