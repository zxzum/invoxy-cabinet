import brandLogo from '@/assets/logo.png';

export function BrandLogo({
  className = '',
  iconClassName = 'h-10 w-10 rounded-xl',
  textClassName = 'text-lg font-bold',
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={brandLogo}
        alt=""
        className={iconClassName}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/images/brand-mark.png?v=20260924_shield';
        }}
      />
      <span className={textClassName}>
        Invoxy<span className="text-mint">VPN</span>
      </span>
    </span>
  );
}
