import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useProjects } from "@/hooks/use-projects";
import { useToast } from "@/components/ui/use-toast";

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateWebhookDialog({ open, onOpenChange, onCreated }: CreateWebhookDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    retentionDays: "30",
    maxRetries: "3",
  });
  const [destinations, setDestinations] = useState([{ label: "Destino principal", endpoint: "" }]);
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      name: "",
      projectId: "",
      retentionDays: "30",
      maxRetries: "3",
    });
    setDestinations([{ label: "Destino principal", endpoint: "" }]);
  };

  const addDestination = () => {
    setDestinations((prev) => [
      ...prev,
      { label: `Destino ${prev.length + 1}`, endpoint: "" },
    ]);
  };

  const updateDestination = (index: number, field: "label" | "endpoint", value: string) => {
    setDestinations((prev) =>
      prev.map((destination, idx) =>
        idx === index ? { ...destination, [field]: value } : destination,
      ),
    );
  };

  const removeDestination = (index: number) => {
    setDestinations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const createWebhookMutation = useMutation({
    mutationFn: () =>
      api.createWebhookRoute({
        name: formData.name,
        projectId: formData.projectId || undefined,
        retentionDays: Number(formData.retentionDays),
        maxRetries: Number(formData.maxRetries),
        destinations: destinations.map((destination, index) => ({
          label: destination.label || `Destino ${index + 1}`,
          endpoint: destination.endpoint,
          priority: index,
        })),
      }),
    onSuccess: () => {
      toast({
        title: "Webhook criado",
        description: "Agora você pode usar o endpoint de ingestão para receber eventos.",
      });
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      resetForm();
      onOpenChange(false);
      onCreated?.();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao criar webhook";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destinations.some((destination) => !destination.endpoint)) {
      toast({
        title: "Destinos incompletos",
        description: "Preencha a URL de todos os destinos.",
        variant: "destructive",
      });
      return;
    }
    createWebhookMutation.mutate();
  };

  const disabled =
    createWebhookMutation.isPending ||
    destinations.some((destination) => !destination.endpoint);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Criar Novo Webhook</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure um novo webhook para receber e gerenciar eventos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-card-foreground">Nome do Webhook</Label>
              <Input
                id="name"
                placeholder="Ex: Payment Completed"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project" className="text-card-foreground">Projeto</Label>
              <Select
                value={formData.projectId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, projectId: value === "none" ? "" : value })
                }
                disabled={isLoadingProjects}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione (opcional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem projeto</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-card-foreground">Destinos</Label>
                <p className="text-sm text-muted-foreground">Adicionar múltiplos destinos garante redundância.</p>
              </div>
              <Button type="button" variant="outline" onClick={addDestination} className="border-border">
                Adicionar destino
              </Button>
            </div>

            <div className="space-y-3">
              {destinations.map((destination, index) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-card-foreground">
                      Destino {index + 1}
                    </h4>
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
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-card-foreground">Nome</Label>
                      <Input
                        value={destination.label}
                        onChange={(e) => updateDestination(index, "label", e.target.value)}
                        placeholder="Ex: API principal"
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-card-foreground">Endpoint</Label>
                      <Input
                        type="url"
                        value={destination.endpoint}
                        onChange={(e) => updateDestination(index, "endpoint", e.target.value)}
                        placeholder="https://api.example.com/webhook"
                        className="bg-secondary border-border"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retentionDays" className="text-card-foreground">Retenção (dias)</Label>
              <Select
                value={formData.retentionDays}
                onValueChange={(value) => setFormData({ ...formData, retentionDays: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["7", "15", "30", "60", "90"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value} dias
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries" className="text-card-foreground">Máximo de Tentativas</Label>
              <Select
                value={formData.maxRetries}
                onValueChange={(value) => setFormData({ ...formData, maxRetries: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "3", "5", "10"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value} tentativas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!projects?.length && !isLoadingProjects && (
            <p className="text-sm text-muted-foreground">
              Você pode criar webhooks sem projeto ou cadastrar um projeto para organizar melhor.
            </p>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={disabled}>
              {createWebhookMutation.isPending ? "Criando..." : "Criar Webhook"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
