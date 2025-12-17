import React from "react";

export function DocVerseLogo(props: {
  className?: string;
  size?: number;
  alt?: string;
  zoom?: number;
}) {
  const size = props.size ?? 28;
  const zoom = props.zoom ?? 2.4;

  return (
    <span
      className={props.className ?? "inline-flex overflow-hidden"}
      style={{ width: size, height: size }}
    >
      <img
        src="/Logo.png"
        width={size}
        height={size}
        alt={props.alt ?? "DocVerse"}
        className="h-full w-full object-cover"
        style={{ transform: `scale(${zoom})` }}
        draggable={false}
      />
    </span>
  );
}
