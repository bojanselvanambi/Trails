'use client';

import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('@/components/Canvas'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Trails
        </div>
        <div className="text-zinc-500">Loading canvas...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen">
      <Canvas />
    </main>
  );
}
