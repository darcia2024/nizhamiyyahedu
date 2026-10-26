import Image from "next/image";

export function StarMark({ size = 30 }: { size?: number; stroke?: string; dot?: boolean }) {
  return (
    <span className="brand-symbol" style={{ width: Math.round(size * 0.68), height: size }} aria-hidden="true">
      <Image src="/nizhamiyyah-icon.png" alt="" fill sizes={`${size}px`} priority />
    </span>
  );
}

export function Logo() {
  return (
    <span className="brand">
      <StarMark size={34} />
      <b>Nizhamiyyah</b>
    </span>
  );
}
