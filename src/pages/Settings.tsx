import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as configurações da sua conta</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Configurações Gerais</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure as opções gerais da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-card-foreground">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  value="wh_live_1234567890abcdef"
                  readOnly
                  className="bg-secondary border-border font-mono"
                />
                <Button variant="outline" className="border-border">Copiar</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl" className="text-card-foreground">URL Base para Webhooks</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://webhooks.example.com"
                className="bg-secondary border-border"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Notificações</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure quando receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-card-foreground">Webhooks com falha</Label>
                <p className="text-sm text-muted-foreground">Receba notificações quando webhooks falharem</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-card-foreground">Relatórios diários</Label>
                <p className="text-sm text-muted-foreground">Receba um resumo diário por email</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-card-foreground">Limites atingidos</Label>
                <p className="text-sm text-muted-foreground">Notificar quando atingir limites de armazenamento</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Retenção de Dados</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure por quanto tempo manter os webhooks armazenados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultRetention" className="text-card-foreground">Retenção Padrão</Label>
              <Input
                id="defaultRetention"
                type="number"
                defaultValue="30"
                className="bg-secondary border-border"
              />
              <p className="text-sm text-muted-foreground">Número de dias para manter webhooks (7-90 dias)</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
