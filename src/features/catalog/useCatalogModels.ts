import { useMemo } from "react";
import type { CatalogFilter, ModelOffer } from "../../domain/catalog";
import { catalogRepository } from "../../services/catalogRepository";
import { listCatalogModels } from "../../services/mockApi";
import { useAsyncResource } from "../../shared/asyncState";

export function useCatalogModels(filter: CatalogFilter) {
  const stableFilter = useMemo(() => filter, [filter]);
  const initialData = useMemo(() => catalogRepository.list(stableFilter), [stableFilter]);
  return useAsyncResource<ModelOffer[]>(() => listCatalogModels(stableFilter), [stableFilter], initialData);
}
