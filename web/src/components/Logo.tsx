export function StarMark({ size = 30, stroke = "#1B4D3B", dot = true }: { size?: number; stroke?: string; dot?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={stroke} strokeWidth="1.6">
      <rect x="5" y="5" width="14" height="14" />
      <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      {dot && <circle cx="12" cy="12" r="2.4" fill="#C8A24A" stroke="none" />}
    </svg>
  );
}

export function Logo() {
  return (
    <span className="brand">
      <StarMark />
      <b>Nizhamiyyah</b>
    </span>
  );
}
