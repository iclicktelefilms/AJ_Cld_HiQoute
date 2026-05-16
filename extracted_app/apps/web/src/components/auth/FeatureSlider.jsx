import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

const variants = {
  enter: (direction) => {
    return {
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    };
  }
};

const FeatureSlider = ({ features }) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isHovered, setIsHovered] = useState(false);

  const currentIndex = Math.abs(page % features.length);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    if (isHovered || !features || features.length === 0) return;

    const timer = setInterval(() => {
      paginate(1);
    }, 12000);

    return () => clearInterval(timer);
  }, [isHovered, features, page]);

  if (!features || features.length === 0) return null;

  return (
    <div 
      className="relative w-full overflow-hidden bg-[hsl(var(--hero-bg))] pt-6 pb-10 md:pt-8 md:pb-12 flex flex-col items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="auth-hero-glow" />
      
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 flex flex-col items-center text-center">
        <div className="relative w-full h-[150px] md:h-[180px] flex items-center justify-center overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 flex flex-col items-center justify-center w-full max-w-xl mx-auto bg-white border border-primary/20 rounded-2xl p-6 shadow-[0_4px_20px_rgba(255,49,50,0.08)] cursor-grab active:cursor-grabbing"
            >
              {features[currentIndex].icon && (
                <div className="w-12 h-12 mb-3 rounded-xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                  {React.createElement(features[currentIndex].icon, { className: "w-6 h-6" })}
                </div>
              )}
              <h3 className="text-lg md:text-xl font-extrabold text-foreground mb-2 tracking-tight">
                {features[currentIndex].title}
              </h3>
              <p className="text-sm md:text-sm text-muted-foreground leading-relaxed max-w-md">
                {features[currentIndex].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const newDirection = index > currentIndex ? 1 : -1;
                setPage([page + (index - currentIndex), newDirection]);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                index === currentIndex 
                  ? 'w-8 bg-primary shadow-[0_0_8px_rgba(255,49,50,0.4)]' 
                  : 'w-2 bg-primary/20 hover:bg-primary/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureSlider;