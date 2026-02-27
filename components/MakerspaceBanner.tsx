"use client";

import Image from "next/image";

/**
 * MakerspaceBanner – uses Trainstation banner + logo
 * Aspect 3000×800, object-cover, handles screen rotation
 */
export default function MakerspaceBanner() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "3000/800", minHeight: "80px", maxHeight: "140px" }}
      aria-hidden
    >
      {/* Background: Trainstation banner pattern */}
      <Image
        src="/trainstationbannerback.png"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      {/* Logo: Trainstation White SVG centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/trainstation-logo.svg"
          alt="Trainstation"
          className="h-[50%] min-h-[36px] w-auto max-w-[70%] object-contain drop-shadow-lg"
        />
      </div>
    </div>
  );
}
