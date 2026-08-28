import type { CatalogSelection } from "../domain/catalog";
import { getAccessFlow } from "../domain/accessPolicy";

export function workspaceSelectionPath(selection: CatalogSelection): string {
  const flow = getAccessFlow(selection.source.mode);
  const query = new URLSearchParams({
    model: selection.offer.id,
    source: selection.source.name,
  });
  return `/workspace/${flow.targetSection}?${query.toString()}`;
}
