import Image from 'next/image';
import Link from 'next/link';

const imageSizes = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

const wordmarkSizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
} as const;

type BrandLogoProps = {
  size?: keyof typeof imageSizes;
  showWordmark?: boolean;
  className?: string;
  href?: string;
};

export default function BrandLogo({
  size = 'md',
  showWordmark = true,
  className = '',
  href,
}: BrandLogoProps) {
  const imageSize = imageSizes[size];
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/brand/sprout-logo.png"
        alt="Sprout"
        width={imageSize}
        height={imageSize}
        className="rounded-lg"
        priority={size === 'lg'}
      />
      {showWordmark ? (
        <span className={`font-bold text-gray-900 ${wordmarkSizes[size]}`}>
          Sprout
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
