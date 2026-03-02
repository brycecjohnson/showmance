import './Badge.css';

interface BadgeProps {
  count: number;
}

export function Badge({ count }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <span className="badge">{count > 99 ? '99+' : count}</span>
  );
}
