export default function AuthCard({ children, side }) {
  return (
    <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-[#1e1e2e] shadow-2xl">
      
      {/* Left visual panel */}
      <div className="relative hidden w-1/2 lg:block">
        <img
          src={side}
          alt="Auth visual"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 p-8 flex flex-col justify-end">
          <h3 className="text-white text-lg font-semibold">
            Capturing Moments,
          </h3>
          <p className="text-white/80 text-sm">
            Creating Memories
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 bg-[#24243a] p-10">
        {children}
      </div>
    </div>
  )
}
