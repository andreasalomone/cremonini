'use client';

import { motion } from 'motion/react';

export const CenteredHero = (props: {
  banner: React.ReactNode;
  title: React.ReactNode;
  description: string;
  buttons: React.ReactNode;
}) => (
  <div className="flex flex-col items-center text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {props.banner}
    </motion.div>

    <motion.h1
      className="mt-6 bg-gradient-to-br from-slate-900 via-slate-800 to-primary bg-clip-text pb-2 text-5xl font-black tracking-tight text-transparent sm:text-7xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 100,
        delay: 0.1,
      }}
    >
      {props.title}
    </motion.h1>

    <motion.p
      className="mx-auto mt-6 max-w-screen-md text-xl leading-relaxed text-slate-600"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {props.description}
    </motion.p>

    <motion.div
      className="mt-10 flex flex-wrap justify-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {props.buttons}
    </motion.div>
  </div>
);
