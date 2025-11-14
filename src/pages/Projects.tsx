import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Folder, Activity } from "lucide-react";

const mockProjects = [
  { id: 1, name: "E-commerce API", webhooks: 156, successRate: 98.5, description: "Webhooks de pagamento e notificações" },
  { id: 2, name: "CRM Integration", webhooks: 89, successRate: 95.2, description: "Sincronização de leads e contatos" },
  { id: 3, name: "Analytics Platform", webhooks: 234, successRate: 99.1, description: "Eventos de tracking e conversão" },
  { id: 4, name: "Support System", webhooks: 67, successRate: 96.8, description: "Tickets e notificações de suporte" },
];

export default function Projects() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground mt-1">Organize seus webhooks por projeto</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <Card key={project.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-card-foreground">{project.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{project.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Webhooks</span>
                  <span className="text-sm font-medium text-card-foreground">{project.webhooks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-3 w-3 text-success" />
                    <span className="text-sm font-medium text-success">{project.successRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
