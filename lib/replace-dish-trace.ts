const TRACE_PREFIX = "[replace-dish-trace]";

type ReplaceDishTraceScope = "client" | "server";

type ReplaceDishTraceStage = {
  name: string;
  durationMs: number;
  detail: boolean;
  parent?: string;
  order: number;
};

function isFlagEnabled(value: string | undefined) {
  return value === "1" || value === "true";
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function formatDuration(durationMs: number) {
  return `${durationMs.toFixed(1)}ms`;
}

function formatStageList(stages: ReplaceDishTraceStage[]) {
  return stages.map((stage) => `${stage.name}=${formatDuration(stage.durationMs)}`).join(" > ");
}

export function isReplaceDishTraceEnabled(scope: ReplaceDishTraceScope) {
  if (scope === "client") {
    return isFlagEnabled(process.env.NEXT_PUBLIC_REPLACE_DISH_TRACE);
  }

  return (
    isFlagEnabled(process.env.REPLACE_DISH_TRACE) ||
    isFlagEnabled(process.env.NEXT_PUBLIC_REPLACE_DISH_TRACE)
  );
}

export function createReplaceDishTraceId() {
  return `rp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class ReplaceDishTrace {
  private readonly startedAt = now();
  private readonly stages: ReplaceDishTraceStage[] = [];
  private flushed = false;
  private nextOrder = 0;

  constructor(
    readonly scope: ReplaceDishTraceScope,
    readonly traceId: string,
    readonly enabled: boolean,
  ) {}

  async time<T>(
    name: string,
    operation: () => Promise<T> | T,
    options?: {
      detail?: boolean;
      parent?: string;
    },
  ) {
    if (!this.enabled) {
      return operation();
    }

    const stageStartedAt = now();
    const order = this.nextOrder++;

    try {
      return await operation();
    } finally {
      this.stages.push({
        name,
        durationMs: now() - stageStartedAt,
        detail: options?.detail ?? false,
        parent: options?.parent,
        order,
      });
    }
  }

  record(
    name: string,
    durationMs: number,
    options?: {
      detail?: boolean;
      parent?: string;
    },
  ) {
    if (!this.enabled) {
      return;
    }

    this.stages.push({
      name,
      durationMs,
      detail: options?.detail ?? false,
      parent: options?.parent,
      order: this.nextOrder++,
    });
  }

  flush(outcome: "success" | "error") {
    if (!this.enabled || this.flushed) {
      return;
    }

    this.flushed = true;

    const totalMs = now() - this.startedAt;
    const orderedStages = [...this.stages].sort((left, right) => left.order - right.order);
    const majorStages = orderedStages.filter((stage) => !stage.detail);
    const hotspot =
      majorStages.length > 0
        ? majorStages.reduce((currentHotspot, stage) =>
            stage.durationMs > currentHotspot.durationMs ? stage : currentHotspot,
          )
        : undefined;
    const hotspotDetails = hotspot
      ? orderedStages.filter((stage) => stage.detail && stage.parent === hotspot.name)
      : [];

    const summary =
      majorStages.length > 0
        ? ` ${formatStageList(majorStages)}`
        : " no-stages";

    console.info(
      `${TRACE_PREFIX}:${this.scope} id=${this.traceId} outcome=${outcome} total=${formatDuration(totalMs)}${summary}`,
    );

    if (hotspot && hotspotDetails.length > 0) {
      console.info(
        `${TRACE_PREFIX}:${this.scope}:detail id=${this.traceId} hotspot=${hotspot.name} ${formatStageList(hotspotDetails)}`,
      );
    }
  }
}

export function createReplaceDishTrace(scope: ReplaceDishTraceScope, traceId?: string) {
  const enabled = isReplaceDishTraceEnabled(scope);
  return new ReplaceDishTrace(scope, traceId ?? createReplaceDishTraceId(), enabled);
}

export function traceReplaceDishStage<T>(
  trace: ReplaceDishTrace | undefined,
  name: string,
  operation: () => Promise<T> | T,
  options?: {
    detail?: boolean;
    parent?: string;
  },
) {
  return trace?.time(name, operation, options) ?? operation();
}

export function readReplaceDishTraceId(formData: FormData) {
  const value = formData.get("__replaceTraceId");
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
