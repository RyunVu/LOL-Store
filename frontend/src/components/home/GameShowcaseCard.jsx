export default function GameShowcaseCard({
  game,
  isActive,
  progress,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative isolate w-full overflow-hidden rounded-xl transition-all duration-200 ${
          isActive
            ? 'shadow-lg'
            : 'opacity-90 hover:opacity-100'
        }
      `}
    >
      {/* Base background */}
      <div className="
        absolute inset-0
        bg-gray-100 dark:bg-neutral-900
      " />

      {/* Progress fill */}
        {isActive && (
        <div
            className="absolute inset-0 origin-left pointer-events-none transition-transform duration-100 linear bg-neutral-300 dark:bg-neutral-700"
            style={{ transform: `scaleX(${progress / 100})` }}
        />
        )}

      <div className="relative z-10 flex items-center gap-4 px-4 py-3">
        <div className="w-12 h-16 shrink-0 rounded-md overflow-hidden bg-black">
          <img
            src={game.thumbnail || game.image}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        </div>

        <h3
          className={`
            text-sm font-semibold
            ${
              isActive
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-neutral-300'
            }
          `}
        >
          {game.title}
        </h3>
      </div>
    </button>
  )
}
