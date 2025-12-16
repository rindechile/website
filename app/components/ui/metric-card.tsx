interface MetricCardProps {
  value: string;
  label: string;
  variant?: 'default' | 'accent' | 'muted' | 'ghost';
  className?: string;
}

const variantStyles = {
  default: 'bg-secondary',
  accent: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
  ghost: 'bg-transparent border border-border',
};

export function MetricCard({ value, label, variant = 'default', className = '' }: MetricCardProps) {
  return (
    <div className={`text-center ${className}`}>
      <p className={`text-xl tablet:text-2x font-semibold px-8 py-4 rounded-md ${variantStyles[variant]}`}>
        {value}
      </p>
      <p className="text-xs font-medium mt-2">{label}</p>
    </div>
  );
}
