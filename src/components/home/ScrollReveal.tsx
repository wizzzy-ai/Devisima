"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function ScrollReveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="scroll-reveal"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
