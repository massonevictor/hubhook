import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
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
import { useWebhooks } from "@/hooks/use-webhooks";
import { useRoutes } from "@/hooks/use-routes";
import { RouteDrawer } from "@/components/RouteDrawer";
import { EventDetailsDrawer } from "@/components/EventDetailsDrawer";
import type { WebhookStatus } from "@/lib/api";

function mapStatus(status: WebhookStatus): "success" | "failed" | "pending" | "retrying" {
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
}

export default function Webhooks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const deferredSearch = useDeferredValue(searchTerm);

  const { data: events, isLoading: isLoadingEvents, refetch: refetchEvents } = useWebhooks(deferredSearch);
  const { data: routes, isLoading: isLoadingRoutes } = useRoutes();

  const selectedRoute = routes?.find((route) => route.id === selectedRouteId) ?? null;

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsEventDrawerOpen(true);
  };

  const handleManageRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setIsRouteDrawerOpen(true);
  };

  const eventList = events ?? [];
  const routesList = routes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Monitore eventos e gerencie rotas de entrega</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Rota
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="routes">Rotas</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-card">
            {isLoadingEvents ? (
              <div className="p-10 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : eventList.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Nenhum evento encontrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destinos</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventList.map((event) => (
                    <TableRow key={event.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell className="text-muted-foreground">{event.project}</TableCell>
                      <TableCell>
                        <StatusBadge status={mapStatus(event.status)} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {event.deliveredCount}/{event.destinationCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{event.attempts}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewEvent(event.id)} className="text-primary">
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          {isLoadingRoutes ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full" />
              ))}
            </div>
          ) : routesList.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
              Nenhuma rota configurada ainda. Clique em "Nova Rota" para começar.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {routesList.map((route) => (
                <Card key={route.id} className="border-border bg-card">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-card-foreground">{route.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{route.project.name}</p>
                    </div>
                    <Badge variant={route.isActive ? "default" : "secondary"}>
                      {route.isActive ? "Ativa" : "Pausada"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Destinos</span>
                      <span className="text-card-foreground">{route.destinations.length}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Principais destinos</p>
                      <div className="flex flex-wrap gap-2">
                        {route.destinations.slice(0, 3).map((destination) => (
                          <Badge key={destination.id} variant="outline">
                            {destination.label || destination.endpoint}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="secondary" size="sm" onClick={() => handleManageRoute(route.id)}>
                        Gerenciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateWebhookDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            refetchEvents();
          }
        }}
        onCreated={() => {
          refetchEvents();
        }}
      />

      <EventDetailsDrawer
        eventId={selectedEventId}
        open={isEventDrawerOpen}
        onOpenChange={(open) => {
          setIsEventDrawerOpen(open);
          if (!open) {
            setSelectedEventId(null);
          }
        }}
      />

      <RouteDrawer
        route={selectedRoute}
        open={isRouteDrawerOpen}
        onOpenChange={(open) => {
          setIsRouteDrawerOpen(open);
          if (!open) {
            setSelectedRouteId(null);
          }
        }}
      />
    </div>
  );
}
