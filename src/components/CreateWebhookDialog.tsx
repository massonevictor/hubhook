import { useState } from "react";
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

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWebhookDialog({ open, onOpenChange }: CreateWebhookDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    project: "",
    endpoint: "",
    fallbackEndpoint: "",
    retentionDays: "30",
    maxRetries: "3",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Webhook criado:", formData);
    onOpenChange(false);
  };

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project" className="text-card-foreground">Projeto</Label>
              <Select value={formData.project} onValueChange={(value) => setFormData({ ...formData, project: value })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecommerce">E-commerce API</SelectItem>
                  <SelectItem value="crm">CRM Integration</SelectItem>
                  <SelectItem value="analytics">Analytics Platform</SelectItem>
                  <SelectItem value="support">Support System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint" className="text-card-foreground">Endpoint Principal</Label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://api.example.com/webhook"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallbackEndpoint" className="text-card-foreground">Endpoint de Fallback (Opcional)</Label>
            <Input
              id="fallbackEndpoint"
              type="url"
              placeholder="https://api.example.com/webhook-fallback"
              value={formData.fallbackEndpoint}
              onChange={(e) => setFormData({ ...formData, fallbackEndpoint: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retentionDays" className="text-card-foreground">Retenção (dias)</Label>
              <Select value={formData.retentionDays} onValueChange={(value) => setFormData({ ...formData, retentionDays: value })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries" className="text-card-foreground">Máximo de Tentativas</Label>
              <Select value={formData.maxRetries} onValueChange={(value) => setFormData({ ...formData, maxRetries: value })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 tentativa</SelectItem>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                  <SelectItem value="10">10 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Criar Webhook
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
