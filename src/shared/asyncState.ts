import { useEffect, useState } from "react";

export type AsyncResourceState<T> = {
  status: "loading" | "ready" | "error";
  data: T | null;
  error: Error | null;
  receivedAt: string | null;
};

export function useAsyncResource<T>(
  loader: () => Promise<{ data: T; receivedAt: string }>,
  dependencies: readonly unknown[],
  initialData: T | null = null,
): AsyncResourceState<T> {
  const [state, setState] = useState<AsyncResourceState<T>>({
    status: initialData === null ? "loading" : "ready",
    data: initialData,
    error: null,
    receivedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, status: "loading", error: null }));

    loader().then((response) => {
      if (cancelled) return;
      setState({ status: "ready", data: response.data, error: null, receivedAt: response.receivedAt });
    }).catch((cause: unknown) => {
      if (cancelled) return;
      setState((current) => ({
        ...current,
        status: "error",
        error: cause instanceof Error ? cause : new Error("资源加载失败"),
      }));
    });

    return () => { cancelled = true; };
    // The caller owns the dependency list so resource identity follows domain inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return state;
}
