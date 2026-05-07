import { WorkspaceList } from "@/features/planning/components/workspace-list";
import { getPlanningSnapshot } from "@/features/planning/services/planning-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getPlanningSnapshot();

  return <WorkspaceList snapshot={snapshot} />;
}
