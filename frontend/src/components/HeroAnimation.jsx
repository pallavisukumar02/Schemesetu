import { motion } from "framer-motion";

// The one deliberate motion moment on the page: a profile point sends out
// three paths that draw themselves toward scheme nodes, each node then
// settling in with its match score. This is the literal mechanic of the
// product (profile -> matched schemes), not decoration.
const targets = [
  { x: 460, y: 60, label: "92%" },
  { x: 500, y: 150, label: "81%" },
  { x: 440, y: 240, label: "76%" },
];

const pathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i) => ({
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 0.9, delay: 0.3 + i * 0.15, ease: "easeInOut" }, opacity: { duration: 0.2, delay: 0.3 + i * 0.15 } },
  }),
};

const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  show: (i) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: 1.0 + i * 0.15, type: "spring", stiffness: 260, damping: 18 },
  }),
};

export default function HeroAnimation() {
  return (
    <svg
      viewBox="0 0 560 300"
      className="w-full h-auto max-w-md"
      role="img"
      aria-label="Illustration of one profile matching to three government schemes with percentage match scores"
    >
      {targets.map((t, i) => (
        <motion.path
          key={`path-${i}`}
          d={`M 90 150 C 220 ${150 + (t.y - 150) * 0.2}, 320 ${t.y}, ${t.x - 26} ${t.y}`}
          fill="none"
          stroke="#E8A93D"
          strokeWidth="2"
          strokeDasharray="1 6"
          strokeLinecap="round"
          custom={i}
          variants={pathVariants}
          initial="hidden"
          animate="show"
        />
      ))}

      {/* profile node */}
      <motion.circle
        cx="90" cy="150" r="26"
        fill="#132C2E"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      />
      <text x="90" y="155" textAnchor="middle" fontSize="11" fill="#F8F4EC" fontFamily="Noto Sans">You</text>

      {targets.map((t, i) => (
        <motion.g key={`node-${i}`} custom={i} variants={nodeVariants} initial="hidden" animate="show">
          <circle cx={t.x} cy={t.y} r="26" fill="#F8F4EC" stroke="#B6532E" strokeWidth="2" />
          <text x={t.x} y={t.y + 5} textAnchor="middle" fontSize="13" fontWeight="600" fill="#132C2E" fontFamily="Noto Sans">
            {t.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
