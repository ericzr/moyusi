import { useMemo } from "react";
import type { ModelOffer } from "../../domain/catalog";
import { catalogRepository } from "../../services/catalogRepository";
import { getCatalogModel } from "../../services/mockApi";
import { useAsyncResource } from "../../shared/asyncState";

export function useCatalogModel(modelId: string) {
  const initialData = useMemo<ModelOffer | null>(() => catalogRepository.getById(modelId), [modelId]);
  return useAsyncResource<ModelOffer | null>(() => getCatalogModel(modelId), [modelId], initialData);
}
