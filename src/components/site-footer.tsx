import { Ticket } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-center gap-4 py-6 text-center">
        <div className="flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RifasXpress. Todos los derechos reservados.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-primary">
            Aquí se viene a ganar. Y a divertirse, claro.
          </p>
        </div>
      </div>
    </footer>
  );
}
