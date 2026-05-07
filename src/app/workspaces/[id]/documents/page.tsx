import { notFound } from "next/navigation";
import { ThaiOfficialDocument } from "@/features/planning/components/thai-official-document";
import { getPlanningSnapshot } from "@/features/planning/services/planning-service";

export const dynamic = "force-dynamic";

type WorkspaceDocumentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkspaceDocumentsPage({ params }: WorkspaceDocumentsPageProps) {
  const { id } = await params;
  const snapshot = await getPlanningSnapshot(id);
  const workspace = snapshot.workspaces.find((candidate) => candidate.id === id);

  if (!workspace) {
    notFound();
  }

  return <ThaiOfficialDocument snapshot={snapshot} workspace={workspace} />;
}
