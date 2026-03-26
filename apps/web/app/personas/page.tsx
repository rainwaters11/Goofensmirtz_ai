import { Theater, Plus } from "lucide-react";
import { SectionHeader } from "../../components/section-header";
import { EmptyState } from "../../components/empty-state";
import { Button } from "../../components/ui/button";

/**
 * PersonasPage — list of available narration personas.
 *
 * TODO: Fetch personas from GET /api/personas (Supabase `personas` table).
 * TODO: Add PersonaCard component for each persona.
 * TODO: Implement Add / Edit persona dialog using @radix-ui/react-dialog.
 */
export default function PersonasPage() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Personas"
        description="Manage the narration personalities available for your projects"
        action={
          // TODO: Open "Create persona" dialog on click
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New persona
          </Button>
        }
      />

      {/* TODO: Replace EmptyState with a grid of PersonaCard when data exists */}
      <EmptyState
        icon={Theater}
        title="No personas configured"
        description="Personas define the voice, tone, and style of your video narration. Seed the defaults or create your own."
        action={
          <Button variant="outline" disabled>
            Seed default personas
          </Button>
        }
      />
    </div>
  );
}
