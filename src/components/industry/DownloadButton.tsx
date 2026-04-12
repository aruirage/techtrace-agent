import { Download, ExternalLink } from "lucide-react";

interface DownloadButtonProps {
  label?: string;
  variant?: "download" | "link";
  size?: "sm" | "md";
  onClick?: () => void;
}

const DownloadButton = ({ label = "下载资料", variant = "download", size = "sm", onClick }: DownloadButtonProps) => {
  const isDownload = variant === "download";
  const sizeClasses = size === "sm" ? "text-xs px-2 py-1 gap-1" : "text-sm px-3 py-1.5 gap-1.5";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-md font-medium transition-colors ${sizeClasses} ${
        isDownload
          ? "bg-success/10 text-success hover:bg-success/20"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {isDownload ? <Download className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
      {label}
    </button>
  );
};

export default DownloadButton;
