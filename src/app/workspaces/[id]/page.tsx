import { notFound } from "next/navigation";
import { PlannerWorkspace } from "@/features/planning/components/planner-workspace";
import { getPlanningSnapshot } from "@/features/planning/services/planning-service";

export const dynamic = "force-dynamic";

type WorkspacePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const snapshot = await getPlanningSnapshot(id);
  const workspaceExists = snapshot.workspaces.some((workspace) => workspace.id === id);

  if (!workspaceExists) {
    notFound();
  }

  const snapshotKey = [
    id,
    snapshot.tasks
      .map((task) =>
        [
          task.id,
          task.ownerId,
          task.assigneeId,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.assignee,
          task.startDate,
          task.dueDate,
          task.estimateHours,
          task.labels.join(","),
          task.tags.join(","),
          task.dependencies.join(","),
          task.notes.map((note) => `${note.id}:${note.content}:${note.createdAt}`).join(","),
          task.checklist.map((todo) => `${todo.id}:${todo.title}:${todo.done}`).join(","),
        ].join("~"),
      )
      .join("|"),
    snapshot.todos.map((todo) => `${todo.id}:${todo.title}:${todo.done}:${todo.taskId}`).join("|"),
    snapshot.labels.map((label) => `${label.id}:${label.name}:${label.color}`).join("|"),
    snapshot.users.map((user) => `${user.id}:${user.name}:${user.color}`).join("|"),
  ].join(":");

  return <PlannerWorkspace key={snapshotKey} initialSnapshot={snapshot} initialWorkspaceId={id} />;
}
