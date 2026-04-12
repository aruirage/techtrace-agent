interface ConfidenceBadgeProps {
  value: number;
}

const ConfidenceBadge = ({ value }: ConfidenceBadgeProps) => {
  const color = value >= 90 ? "bg-success" : value >= 70 ? "bg-primary" : "bg-warning";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
      {value}%
    </span>
  );
};

export default ConfidenceBadge;
