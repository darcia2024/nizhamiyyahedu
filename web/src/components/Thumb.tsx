import Image from "next/image";

/**
 * Thumbnail kelas 16:9. Dilayani lewat pengoptimal gambar Next (ukuran dan format menyesuaikan layar),
 * jadi aslinya boleh beresolusi tinggi tanpa memberatkan HP. `sizes` memberi tahu lebar tampilnya.
 */
export function Thumb({ src, className, sizes, priority = false }: { src: string; className?: string; sizes: string; priority?: boolean }) {
  return <Image className={className} src={src} alt="" width={1600} height={900} sizes={sizes} quality={88} priority={priority} />;
}
