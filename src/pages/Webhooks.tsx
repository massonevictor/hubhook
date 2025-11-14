import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateWebhookDialog } from "@/components/CreateWebhookDialog";

type WebhookStatus = "success" | "failed" | "pending";

interface Webhook {
  id: string;
  name: string;
  project: string;
  endpoint: string;
  status: WebhookStatus;
  timestamp: string;
  attempts: number;
}

const mockWebhooks: Webhook[] = [
  { id: "1", name: "Payment Completed", project: "E-commerce API", endpoint: "https://api.example.com/payments", status: "success", timestamp: "2024-11-14 14:32:15", attempts: 1 },
  { id: "2", name: "User Registered", project: "CRM Integration", endpoint: "https://api.example.com/users", status: "success", timestamp: "2024-11-14 14:28:42", attempts: 1 },
  { id: "3", name: "Order Created", project: "E-commerce API", endpoint: "https://api.example.com/orders", status: "failed", timestamp: "2024-11-14 14:15:33", attempts: 3 },
  { id: "4", name: "Lead Captured", project: "CRM Integration", endpoint: "https://api.example.com/leads", status: "pending", timestamp: "2024-11-14 14:10:21", attempts: 1 },
  { id: "5", name: "Analytics Event", project: "Analytics Platform", endpoint: "https://api.example.com/events", status: "success", timestamp: "2024-11-14 14:05:18", attempts: 1 },
  { id: "6", name: "Support Ticket", project: "Support System", endpoint: "https://api.example.com/tickets", status: "success", timestamp: "2024-11-14 13:58:45", attempts: 1 },
  { id: "7", name: "Subscription Updated", project: "E-commerce API", endpoint: "https://api.example.com/subscriptions", status: "failed", timestamp: "2024-11-14 13:45:12", attempts: 2 },
  { id: "8", name: "Invoice Generated", project: "E-commerce API", endpoint: "https://api.example.com/invoices", status: "success", timestamp: "2024-11-14 13:32:08", attempts: 1 },
];

export default function Webhooks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredWebhooks = mockWebhooks.filter(webhook =>
    webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webhook.project.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os seus webhooks</p>
        </div>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar webhooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Button variant="outline" className="border-border">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-card-foreground">Nome</TableHead>
              <TableHead className="text-card-foreground">Projeto</TableHead>
              <TableHead className="text-card-foreground">Endpoint</TableHead>
              <TableHead className="text-card-foreground">Status</TableHead>
              <TableHead className="text-card-foreground">Tentativas</TableHead>
              <TableHead className="text-card-foreground">Data/Hora</TableHead>
              <TableHead className="text-card-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWebhooks.map((webhook) => (
              <TableRow key={webhook.id} className="border-border hover:bg-muted/50 cursor-pointer">
                <TableCell className="font-medium text-card-foreground">{webhook.name}</TableCell>
                <TableCell className="text-muted-foreground">{webhook.project}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">{webhook.endpoint}</TableCell>
                <TableCell>
                  <StatusBadge status={webhook.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{webhook.attempts}</TableCell>
                <TableCell className="text-muted-foreground">{webhook.timestamp}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">
                    Ver Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateWebhookDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
