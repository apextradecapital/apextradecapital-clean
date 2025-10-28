import React, { useEffect } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <img src="/logo.png" alt="PrimeFX Trust Capital Logo" className="w-32 h-32 animate-pulse rounded-full" />
      <p className="text-blue-800 font-semibold mt-3">Investir en toute sécurité</p>
    </div>
  );
}

