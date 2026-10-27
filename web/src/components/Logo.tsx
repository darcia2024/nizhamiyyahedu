import Image from "next/image";
import { withBase } from "@/lib/base-path";

export function StarMark({ size = 30 }: { size?: number; stroke?: string; dot?: boolean }) {
  return (
    <span className="brand-symbol" style={{ width: Math.round(size * 0.4), height: size }} aria-hidden="true">
      <Image src={withBase("/nizhamiyyah-icon.png")} alt="" fill sizes={`${size}px`} priority />
    </span>
  );
}

export function Logo() {
  return (
    <span className="brand">
      <StarMark size={50} />
      <b>Nizhamiyyah</b>
    </span>
  );
}
