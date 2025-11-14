import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

type Status = "success" | "failed" | "pending" | "retrying";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    success: {
      label: "Sucesso",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
    },
    failed: {
      label: "Falhou",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    },
    pending: {
      label: "Pendente",
      icon: Clock,
      className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
    },
    retrying: {
      label: "Reenviando",
      icon: Clock,
      className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
