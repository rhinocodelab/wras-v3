import type { SVGProps } from "react";

export function RailwayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 15h14" />
      <path d="m14 15-3-8-3 8" />
      <path d="M5 18h14" />
      <path d="M6 10h12" />
      <path d="M8 5h8" />
      <path d="M12 3v2" />
      <path d="M6 3h.01" />
      <path d="M18 3h.01" />
    </svg>
  );
}
