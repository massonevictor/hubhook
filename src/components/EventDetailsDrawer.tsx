import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { useEventDetails } from "@/hooks/use-event-details";
import { api, WebhookStatus } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface EventDetailsDrawerProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const badgeStatus = (status: WebhookStatus): "pending" | "success" | "failed" | "retrying" => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "failed";
    case "RETRYING":
      return "retrying";
    default:
      return "pending";
  }
};

export function EventDetailsDrawer({ eventId, open, onOpenChange }: EventDetailsDrawerProps) {
  const { data, isLoading, refetch } = useEventDetails(eventId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: () => {
      if (!eventId) throw new Error("Evento inválido");
      return api.retryEvent(eventId);
    },
    onSuccess: () => {
      toast({
        title: "Reenvio solicitado",
        description: "O evento foi colocado novamente na fila.",
      });
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      refetch();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao reenfileirar evento";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!open) return;
    if (eventId) {
      refetch();
    }
  }, [eventId, open, refetch]);

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copiado` });
    } catch (error) {
      toast({ title: "Erro ao copiar", description: String(error), variant: "destructive" });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-40 w-full" />;
    }

    if (!data) {
      return <p className="text-muted-foreground">Selecione um evento para visualizar os detalhes.</p>;
    }

    return (
      <ScrollArea className="max-h-[70vh] pr-4">
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-semibold text-card-foreground">{data.route.name}</h3>
                <p className="text-sm text-muted-foreground">Projeto: {data.route.project.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={badgeStatus(data.status)} />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(data.id, "ID do evento")}>
                  Copiar ID
                </Button>
                <Button
                  size="sm"
                  onClick={() => retryMutation.mutate()}
                  disabled={retryMutation.isPending}
                >
                  {retryMutation.isPending ? "Reenfileirando..." : "Reenfileirar"}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded border border-border p-3">
                <p className="text-xs text-muted-foreground">Destinos entregues</p>
                <p className="text-lg font-semibold text-card-foreground">
                  {data.deliveredCount}/{data.destinationCount}
                </p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-xs text-muted-foreground">Tentativas</p>
                <p className="text-lg font-semibold text-card-foreground">{data.attemptCount}</p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-xs text-muted-foreground">Última tentativa</p>
                <p className="text-lg font-semibold text-card-foreground">
                  {data.lastAttemptAt ? new Date(data.lastAttemptAt).toLocaleString() : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-card-foreground">Payload</h4>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(data.payload, null, 2), "Payload")}>
                Copiar payload
              </Button>
            </div>
            <pre className="rounded bg-secondary p-4 text-sm text-secondary-foreground overflow-x-auto">
{JSON.stringify(data.payload, null, 2)}
            </pre>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-card-foreground">Headers</h4>
            <div className="rounded border border-border divide-y divide-border">
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} className="flex justify-between p-3 text-sm">
                  <span className="font-medium text-card-foreground">{key}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-card-foreground">Tentativas</h4>
            <div className="space-y-2">
              {data.attempts.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma tentativa registrada ainda.</p>
              )}
              {data.attempts.map((attempt) => (
                <div key={attempt.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {attempt.destination ? attempt.destination.label : "Destino"}
                      </p>
                      {attempt.destination && (
                        <p className="text-xs text-muted-foreground">{attempt.destination.endpoint}</p>
                      )}
                    </div>
                    <Badge variant={attempt.success ? "default" : "destructive"}>
                      {attempt.success ? "Sucesso" : "Falha"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Horário: {new Date(attempt.createdAt).toLocaleString()}</p>
                    <p>Status HTTP: {attempt.responseStatus ?? "Sem resposta"}</p>
                  </div>
                  {attempt.errorMessage && (
                    <p className="text-sm text-destructive">Erro: {attempt.errorMessage}</p>
                  )}
                  {attempt.responseBody && (
                    <pre className="bg-secondary rounded p-3 text-xs text-secondary-foreground overflow-x-auto">
{attempt.responseBody}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Detalhes do evento</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Inspecione o payload original, cabeçalhos, tentativas de entrega e reenvie se necessário.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
