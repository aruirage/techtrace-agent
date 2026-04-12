interface SectionHeaderProps {
  number: string;
  title: string;
  subtitle: string;
}

const SectionHeader = ({ number, title, subtitle }: SectionHeaderProps) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        {number}
      </span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <p className="text-sm text-muted-foreground ml-10">{subtitle}</p>
  </div>
);

export default SectionHeader;
