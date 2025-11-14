import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, UpdateRoutePayload, WebhookRoute } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface RouteDrawerProps {
  route: WebhookRoute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableDestination {
  id?: string;
  localId: string;
  label: string;
  endpoint: string;
  priority: number;
  isActive: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");

export function RouteDrawer({ route, open, onOpenChange }: RouteDrawerProps) {
  const [name, setName] = useState("");
  const [retentionDays, setRetentionDays] = useState("30");
  const [maxRetries, setMaxRetries] = useState("3");
  const [isActive, setIsActive] = useState(true);
  const [destinations, setDestinations] = useState<EditableDestination[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (route) {
      setName(route.name);
      setRetentionDays(String(route.retentionDays));
      setMaxRetries(String(route.maxRetries));
      setIsActive(route.isActive);
      setDestinations(
        route.destinations
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((destination) => ({
            id: destination.id,
            localId: destination.id,
            label: destination.label,
            endpoint: destination.endpoint,
            priority: destination.priority,
            isActive: destination.isActive,
          })),
      );
    }
  }, [route]);

  const inboundUrl = useMemo(() => {
    if (!route) return "";
    try {
      const url = new URL(route.inboundUrl, API_BASE_URL);
      return url.toString();
    } catch (error) {
      return `${API_BASE_URL}${route.inboundUrl}`;
    }
  }, [route]);

  const updateRouteMutation = useMutation({
    mutationFn: (payload: UpdateRoutePayload) => {
      if (!route) throw new Error("Rota não selecionada");
      return api.updateRoute(route.id, payload);
    },
    onSuccess: () => {
      toast({
        title: "Rota atualizada",
        description: "Destinos e configurações foram salvos.",
      });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao atualizar rota";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `${label} copiado`,
        description: value,
      });
    } catch (error) {
      toast({
        title: "Não foi possível copiar",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const addDestination = () => {
    setDestinations((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        label: `Destino ${prev.length + 1}`,
        endpoint: "",
        priority: prev.length,
        isActive: true,
      } as EditableDestination,
    ]);
  };

  const updateDestination = (index: number, field: keyof EditableDestination, value: string | boolean) => {
    setDestinations((prev) =>
      prev.map((destination, idx) =>
        idx === index
          ? {
              ...destination,
              [field]: value,
            }
          : destination,
      ),
    );
  };

  const removeDestination = (index: number) => {
    setDestinations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (!route) return;
    if (destinations.length === 0) {
      toast({
        title: "Adicione ao menos um destino",
        variant: "destructive",
      });
      return;
    }

    if (destinations.some((destination) => !destination.endpoint)) {
      toast({
        title: "Destinos incompletos",
        description: "Preencha a URL de cada destino.",
        variant: "destructive",
      });
      return;
    }

    const payload: UpdateRoutePayload = {
      name,
      retentionDays: Number(retentionDays),
      maxRetries: Number(maxRetries),
      isActive,
      destinations: destinations.map((destination, index) => ({
        id: destination.id,
        label: destination.label || `Destino ${index + 1}`,
        endpoint: destination.endpoint,
        priority: index,
        isActive: destination.isActive,
      })),
    };

    updateRouteMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Gerenciar rota</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Visualize o endpoint de ingestão e ajuste os destinos associados.
          </DialogDescription>
        </DialogHeader>

        {route ? (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-card-foreground">Nome da rota</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Projeto</Label>
                  <Input value={route.project.name} readOnly className="bg-secondary border-border" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-card-foreground">Retenção (dias)</Label>
                  <Input
                    type="number"
                    min={7}
                    max={90}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Máximo de tentativas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded border border-border p-4">
                <div>
                  <Label className="text-card-foreground">Rota ativa</Label>
                  <p className="text-sm text-muted-foreground">Desative para pausar o recebimento de eventos.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="space-y-2">
                <Label className="text-card-foreground">Inbound URL</Label>
                <div className="flex gap-2">
                  <Input value={inboundUrl} readOnly className="bg-secondary border-border" />
                  <Button type="button" variant="outline" onClick={() => handleCopy(inboundUrl, "URL")}>Copiar</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-card-foreground">Segredo</Label>
                <div className="flex gap-2">
                  <Input value={route.secret} readOnly className="bg-secondary border-border" />
                  <Button type="button" variant="outline" onClick={() => handleCopy(route.secret, "Segredo")}>Copiar</Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-card-foreground">Destinos</Label>
                    <p className="text-sm text-muted-foreground">Defina múltiplos destinos e controle quais estão ativos.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={addDestination}>
                    Adicionar destino
                  </Button>
                </div>

                <div className="space-y-3">
                  {destinations.map((destination, index) => (
                    <div key={destination.localId} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-card-foreground">Destino {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Ativo</span>
                          <Switch
                            checked={destination.isActive}
                            onCheckedChange={(checked) => updateDestination(index, "isActive", checked)}
                          />
                          {destinations.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-destructive hover:text-destructive/80"
                              onClick={() => removeDestination(index)}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-card-foreground">Nome</Label>
                          <Input
                            value={destination.label}
                            onChange={(e) => updateDestination(index, "label", e.target.value)}
                            className="bg-secondary border-border"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-card-foreground">Endpoint</Label>
                          <Input
                            type="url"
                            value={destination.endpoint}
                            onChange={(e) => updateDestination(index, "endpoint", e.target.value)}
                            className="bg-secondary border-border"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSave} disabled={updateRouteMutation.isPending}>
                  {updateRouteMutation.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground">Selecione uma rota para visualizar os detalhes.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
