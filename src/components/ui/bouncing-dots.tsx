"use client";

import React from "react";
import { cva } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const bouncingDotsVariant = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
});

export interface BouncingDotsProps {
  dots?: number;
  message?: string;
  messagePlacement?: "bottom" | "left" | "right";
  color?: string;
}

export function BouncingDots({
  dots = 3,
  message,
  messagePlacement = "bottom",
  color,
  className,
  ...props
}: HTMLMotionProps<"div"> & BouncingDotsProps) {
  return (
    <div className={cn(bouncingDotsVariant({ messagePlacement }))}>
      <div className="flex gap-2 items-center justify-center">
        {Array(dots)
          .fill(undefined)
          .map((_, index) => (
            <motion.div
              key={index}
              className={cn("w-2.5 h-2.5 rounded-full", className)}
              style={{ background: color || "#C8522A" }}
              animate={{ y: [0, -16, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.18,
                ease: "easeInOut",
              }}
              {...props}
            />
          ))}
      </div>
      {message && <div className="text-sm opacity-70">{message}</div>}
    </div>
  );
}
