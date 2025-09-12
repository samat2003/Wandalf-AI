import React from "react";

export default function Demo() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <h1 className="text-4xl font-bold gradient-text mb-4">Wandalf Demo</h1>
      <p className="text-slate-300 mb-6">
        This is where you can embed a demo video, GIF, or even a live iframe preview.
      </p>
      <video src="/demo.mp4" controls className="w-2/3 rounded-lg shadow-lg" />
    </div>
  );
}
