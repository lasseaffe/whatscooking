"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Tab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  /** Controlled active tab. When provided, pairs with onTabChange. */
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

export const AnimatedTabs = ({ tabs, defaultTab, className, activeTab: controlledTab, onTabChange }: AnimatedTabsProps) => {
  const [internalTab, setInternalTab] = useState<string>(defaultTab || tabs[0]?.id);
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (id: string) => {
    if (controlledTab === undefined) setInternalTab(id);
    onTabChange?.(id);
  };

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full flex flex-col gap-y-1", className)}>
      <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white outline-none transition-colors text-center"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-[var(--bg-tertiary)] shadow-md !rounded-lg"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] min-h-20">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.97, x: -8, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </div>
    </div>
  );
};
