import { AnimatePresence, motion } from 'framer-motion';
import FoodIcon from './FoodIcon';

/**
 * The cutting beat for foods that have no 3D model.
 *
 * A burger, a can or a handful of peanuts cannot be modelled in this project's
 * style without looking worse than nothing — but a child should still get to cut
 * the thing open, because that is the whole promise of the game. So the food's own
 * icon is clipped down the middle and the two halves swing apart, with a blade
 * dropping through on the way. Same gesture, same payoff, no half-finished mesh.
 */
export default function FlatCutStage({
  foodId,
  cut,
  size = 240,
}: {
  foodId: string;
  cut: boolean;
  size?: number;
}) {
  const swing = { type: 'spring' as const, stiffness: 170, damping: 15 };

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* the same soft grounding shadow the 3D stage puts under its food */}
      <div
        style={{
          position: 'absolute',
          bottom: size * 0.04,
          width: size * 0.62,
          height: size * 0.09,
          borderRadius: '50%',
          background: 'rgba(13, 58, 38, 0.16)',
          filter: 'blur(5px)',
        }}
      />

      {(['left', 'right'] as const).map((side) => {
        const isLeft = side === 'left';
        return (
          <motion.div
            key={side}
            animate={{
              x: cut ? (isLeft ? -size * 0.14 : size * 0.14) : 0,
              rotate: cut ? (isLeft ? -7 : 7) : 0,
              y: cut ? size * 0.02 : 0,
            }}
            transition={swing}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // each copy shows only its own half, so the pair reads as one food
              // until the moment it comes apart
              clipPath: isLeft ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
            }}
          >
            <FoodIcon id={foodId} size={size} />
          </motion.div>
        );
      })}

      {/* Bright inner edges, so the split looks sliced rather than just separated. */}
      {cut && (
        <>
          {(['left', 'right'] as const).map((side) => {
            const isLeft = side === 'left';
            return (
              <motion.span
                key={side}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                transition={{ delay: 0.1 }}
                style={{
                  position: 'absolute',
                  top: size * 0.2,
                  height: size * 0.6,
                  width: 3,
                  borderRadius: 2,
                  left: isLeft ? size * 0.36 : undefined,
                  right: isLeft ? undefined : size * 0.36,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 50%, rgba(255,255,255,0) 100%)',
                }}
              />
            );
          })}
        </>
      )}

      <AnimatePresence>
        {!cut ? (
          // the line the blade will follow, so the middle is obviously the target
          <motion.span
            key="guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: size * 0.08,
              height: size * 0.84,
              width: 0,
              borderLeft: '2px dashed #1c6b48',
            }}
          />
        ) : (
          <motion.span
            key="blade"
            initial={{ y: -size * 0.7, opacity: 0.95 }}
            animate={{ y: size * 0.75, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeIn' }}
            style={{ position: 'absolute', display: 'flex', pointerEvents: 'none' }}
          >
            <svg width={size * 0.22} height={size * 0.5} viewBox="0 0 40 92" fill="none">
              <path d="M20 2 33 44H7Z" fill="#dfe7ec" />
              <path d="M20 2 33 44h-13Z" fill="#b8c4cc" />
              <rect x="14" y="44" width="12" height="36" rx="5" fill="#5a4432" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
