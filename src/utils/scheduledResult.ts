import type { RequestOptions } from "../services/createHttpClient";

const SCHEDULED_RESULT_TIMEOUT_MS = 20_000;
const SCHEDULED_RESULT_INITIAL_DELAY_MS = 50;
const SCHEDULED_RESULT_MAX_DELAY_MS = 1_000;

export class ScheduledResultTimeoutError<T = unknown> extends Error {
  readonly lastResult: T;

  constructor(lastResult: T) {
    super(
      "Scheduled result observation timed out before terminal domain state; " +
        "the mutation may have succeeded",
    );
    this.name = "ScheduledResultTimeoutError";
    this.lastResult = lastResult;
  }
}

export function scheduledObservationOptions<T>(
  options?: RequestOptions,
  signal?: AbortSignal,
): RequestOptions<T> | undefined {
  if (!options && !signal) return undefined;

  const observation: RequestOptions<T> = {};
  if (options?.headers !== undefined) observation.headers = options.headers;
  if (options?.params !== undefined) observation.params = options.params;
  if (signal !== undefined) {
    observation.signal = signal;
  } else if (options?.signal !== undefined) {
    observation.signal = options.signal;
  }

  return observation;
}

export function prepareScheduledMutation(
  body: unknown,
  options?: RequestOptions,
): { body: unknown; options: RequestOptions | undefined } {
  if (!options?.transformRequest) return { body, options };

  const { transformRequest, ...initialOptions } = options;
  return {
    body: transformRequest(body),
    options: initialOptions,
  };
}

function scheduledDelay(attempt: number): number {
  const exponential = Math.min(
    SCHEDULED_RESULT_INITIAL_DELAY_MS * 2 ** attempt,
    SCHEDULED_RESULT_MAX_DELAY_MS,
  );
  const minimum = exponential / 2;
  return minimum + Math.random() * minimum;
}

function abortError(signal: AbortSignal): unknown {
  if (signal.reason !== undefined) return signal.reason;
  return new DOMException("The operation was aborted", "AbortError");
}

async function waitForObservation(
  delayMs: number,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) throw abortError(signal);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(abortError(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function awaitObservation<T>(
  observation: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) throw abortError(signal);

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(abortError(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    observation.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

export async function pollScheduledResult<T>(
  initialResult: T,
  observe: (signal: AbortSignal) => Promise<T>,
  isPending: (result: T) => boolean,
  callerSignal?: AbortSignal,
): Promise<T> {
  let result = initialResult;
  if (!isPending(result)) return result;
  if (callerSignal?.aborted) throw abortError(callerSignal);

  const observationController = new AbortController();
  let timedOut = false;
  const onCallerAbort = () => {
    if (!observationController.signal.aborted) {
      observationController.abort(abortError(callerSignal!));
    }
  };
  callerSignal?.addEventListener("abort", onCallerAbort, { once: true });
  const deadlineTimer = setTimeout(() => {
    if (observationController.signal.aborted) return;
    timedOut = true;
    observationController.abort();
  }, SCHEDULED_RESULT_TIMEOUT_MS);
  let attempt = 0;

  try {
    while (isPending(result)) {
      await waitForObservation(
        scheduledDelay(attempt),
        observationController.signal,
      );
      result = await awaitObservation(
        observe(observationController.signal),
        observationController.signal,
      );
      attempt += 1;
    }
    return result;
  } catch (error) {
    if (timedOut) throw new ScheduledResultTimeoutError(result);
    throw error;
  } finally {
    clearTimeout(deadlineTimer);
    callerSignal?.removeEventListener("abort", onCallerAbort);
  }
}
