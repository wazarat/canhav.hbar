"use client";

import dynamic from "next/dynamic";

export const HeroScene = dynamic(
  () => import("./hero-scene").then((m) => m.HeroSceneCanvas),
  {
    ssr: false,
    loading: () => <div className="h-full w-full" aria-hidden />,
  }
);
