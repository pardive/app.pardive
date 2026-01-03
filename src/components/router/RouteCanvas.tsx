'use client';

import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import AddNodeButton from './nodes/AddNodeButton';

export default function RouteCanvas() {
  return (
    <div
      className="
        w-full h-full relative overflow-auto
        bg-white dark:bg-ui-navigationDark
      "
    >
      {/* SVG PATH LINES */}
      <svg
        width="100%"
        height="100%"
        className="absolute top-0 left-0 pointer-events-none"
      >
        <line
          x1="50%"
          y1="110"
          x2="50%"
          y2="150"
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1="50%"
          y1="182"
          x2="50%"
          y2="222"
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>

      {/* FLOW NODES */}
      <div
        className="
          min-w-[1200px]
          pt-20 pb-48
          flex flex-col items-center gap-4
          relative z-10
        "
      >
        <StartNode />
        <AddNodeButton />
        <EndNode />
      </div>
    </div>
  );
}
