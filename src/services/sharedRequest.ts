import { ArkyNetworkError } from "../types/apiError";

export interface SharedRequestTarget {
  method: string;
  url: string;
}

export interface SharedRequest<T> {
  readonly abandoned: boolean;
  join(signal?: AbortSignal): Promise<T>;
}

export function shareRequest<T>(
  target: SharedRequestTarget,
  run: (signal: AbortSignal) => Promise<T>,
): SharedRequest<T> {
  const controller = new AbortController();
  let answer: Promise<T> | null = null;
  let waiting = 0;
  const aborted = () =>
    new ArkyNetworkError("aborted", "The request was aborted", { method: target.method, url: target.url });
  return {
    get abandoned() {
      return controller.signal.aborted;
    },
    join(signal?: AbortSignal): Promise<T> {
      if (signal?.aborted) return Promise.reject(aborted());
      const shared = answer ?? run(controller.signal);
      answer = shared;
      waiting += 1;
      if (!signal) return shared;
      return new Promise<T>((resolve, reject) => {
        const leave = () => {
          waiting -= 1;
          if (waiting === 0) controller.abort();
          reject(aborted());
        };
        signal.addEventListener("abort", leave, { once: true });
        shared.then(
          (value) => {
            signal.removeEventListener("abort", leave);
            resolve(value);
          },
          (error: unknown) => {
            signal.removeEventListener("abort", leave);
            reject(error);
          },
        );
      });
    },
  };
}
