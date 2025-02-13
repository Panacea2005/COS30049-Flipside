export const QuestBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-lg mb-32">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500">
        <div className="absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full border-t border-white/10"
              style={{
                transform: `scale(${1 + i * 0.1}) rotate(${i * 2}deg)`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative p-8 sm:p-16">
        <h2 className="text-3xl sm:text-4xl font-light text-white mb-4">
          Embark on an epic onchain odyssey.
          <br />
          Ready to claim your first reward?
        </h2>
        
        <a 
          href="/quests"
          className="inline-flex items-center space-x-2 text-white/80 hover:text-white mt-8 group"
        >
          <span>View all quests</span>
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </div>
  );
};