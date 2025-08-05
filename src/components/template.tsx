
'use client';

import { motion } from 'framer-motion';
import { useTransition } from '@/context/TransitionContext';
import { useEffect } from 'react';

const Template = ({ children }: { children: React.ReactNode }) => {
  const { duration, setAnimationDuration } = useTransition();

  // Reset duration after animation completes so subsequent navigations are fast by default
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDuration(0.5); // Reset to default fast duration
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [duration, setAnimationDuration]);


  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ ease: 'easeInOut', duration: duration }}
    >
      {children}
    </motion.div>
  );
};

export default Template;
