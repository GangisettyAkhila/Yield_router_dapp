import { motion } from "framer-motion";
import * as React from "react";

interface ParticleProps {
  size?: number;
  color?: string;
  delay?: number;
}

const Particle: React.FC<ParticleProps> = ({ size = 2, color = "#ffffff", delay = 0 }) => {
  const randomX = Math.random() * 100; // Random starting position
  const randomDuration = 15 + Math.random() * 15; // Random animation duration

  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity: 0.4,
      }}
      initial={{ x: `${randomX}%`, y: "100%", opacity: 0 }}
      animate={{
        y: "-100%",
        opacity: [0, 1, 1, 0],
        x: [`${randomX}%`, `${randomX + (Math.random() - 0.5) * 20}%`, `${randomX + (Math.random() - 0.5) * 20}%`, `${randomX}%`],
      }}
      transition={{
        duration: randomDuration,
        repeat: Infinity,
        delay: delay,
        ease: "linear",
      }}
    />
  );
};

export const ParticleField: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <Particle key={i} size={1 + Math.random() * 2} color={i % 2 === 0 ? "#1E90FF" : "#FFD700"} delay={i * 0.5} />
      ))}
    </div>
  );
};
