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
      <img src="/images/brand-mark.png?v=3d" alt="" className={iconClassName} />
      <span className={textClassName}>
        Invoxy<span className="text-mint">VPN</span>
      </span>
    </span>
  );
}
