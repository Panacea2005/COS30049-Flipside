export const HeroImage = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-96 h-96">
          <img
            src="/hero-image.svg"
            alt="Flipside Logo 3D"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/30 to-red-400/30 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      </div>
    </div>
  );
};