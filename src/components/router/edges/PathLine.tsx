type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export default function PathLine({ x1, y1, x2, y2 }: Props) {
  const midY = (y1 + y2) / 2;

  const d = `
    M ${x1} ${y1}
    V ${midY}
    H ${x2}
    V ${y2}
  `;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      <path
        d={d}
        fill="none"
        stroke="#CBD5E1"        // blue-gray
        strokeWidth={1}
        strokeDasharray="10 10"   // dotted
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
