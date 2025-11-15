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
import { Textarea } from "@/components/ui/textarea";
import { api, CreateProjectPayload } from "@/lib/api";
import { PROJECTS_QUERY_KEY } from "@/hooks/use-projects";
import { useToast } from "@/components/ui/use-toast";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const createProjectMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => api.createProject(payload),
    onSuccess: () => {
      toast({
        title: "Projeto criado",
        description: "Você já pode organizar seus webhooks usando este projeto.",
      });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao criar projeto";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createProjectMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const isDisabled = createProjectMutation.isPending || name.trim().length < 3;

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        resetForm();
      }
      onOpenChange(next);
    }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Novo Projeto</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Agrupe rotas de webhook por projeto e organize seu tráfego.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-card-foreground">
              Nome
            </Label>
            <Input
              id="project-name"
              placeholder="Ex: Pagamentos"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={3}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-card-foreground">
              Descrição (opcional)
            </Label>
            <Textarea
              id="project-description"
              placeholder="Adicione detalhes para identificar este projeto"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isDisabled}
            >
              {createProjectMutation.isPending ? "Criando..." : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
