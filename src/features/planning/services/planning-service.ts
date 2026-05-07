import { findPlanningSnapshot } from "../repositories/planning-repository";

export async function getPlanningSnapshot(workspaceId?: string) {
  return findPlanningSnapshot(workspaceId);
}
