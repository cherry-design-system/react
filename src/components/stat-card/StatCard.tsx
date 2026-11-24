import {
  forwardRef,
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cx } from "../../utils/cx";
import type { StatCardTrend } from "./variants.gen";

export interface StatCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  label: ReactNode;
  value: ReactNode;
  /** Change, e.g. "+12.4%". */
  delta?: ReactNode;
  /** Direction of the change. Defaults to "neutral". */
  trend?: StatCardTrend;
  /** When up is bad (costs, errors): up reads as danger, down as success. */
  inverse?: boolean;
  /** Text after the delta, e.g. "vs last month". */
  deltaLabel?: ReactNode;
  /** Values for the sparkline (two or more). */
  data?: number[];
  /** Spoken direction words before the delta, translatable. */
  trendLabels?: Partial<Record<StatCardTrend, string>>;
}

const defaultTrendLabels: Record<StatCardTrend, string> = {
  up: "Up",
  down: "Down",
  neutral: "No change",
};

const icons = { up: TrendingUp, down: TrendingDown, neutral: Minus };

/** Sparkline geometry in a 100 x 32 box (stretched to fit, stroke unscaled). */
function sparkline(data: number[]) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = 100 / (data.length - 1);
  const pad = 3;
  const points = data.map((v, i) => [
    i * step,
    pad + (1 - (v - min) / range) * (32 - pad * 2),
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x!.toFixed(2)} ${y!.toFixed(2)}`)
    .join(" ");
  const last = points[points.length - 1]!;
  return { line, area: `${line} L100 32 L0 32 Z`, endY: (last[1]! / 32) * 100 };
}

/**
 * Metric tile: label, value, a delta whose color follows the trend (and
 * `inverse`), and an optional sparkline that draws itself in with a token
 * gradient under it. No client JS.
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  function StatCard(
    {
      label,
      value,
      delta,
      trend = "neutral",
      inverse,
      deltaLabel,
      data,
      trendLabels,
      className,
      ...rest
    },
    ref,
  ) {
    const gradientId = `cherry-stat-${useId().replace(/:/g, "")}`;
    const spark = data && data.length > 1 ? sparkline(data) : null;
    const TrendIcon = icons[trend];
    const spoken = trendLabels?.[trend] ?? defaultTrendLabels[trend];
    return (
      <div
        ref={ref}
        className={cx("cherry-stat-card", className)}
        data-trend={trend}
        data-inverse={inverse || undefined}
        {...rest}
      >
        <div className="cherry-stat-card__label">{label}</div>
        <div className="cherry-stat-card__row">
          <div className="cherry-stat-card__value">{value}</div>
          {spark ? (
            <span
              className="cherry-stat-card__spark"
              style={{ "--_end-y": `${spark.endY}%` } as CSSProperties}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 100 32"
                preserveAspectRatio="none"
                focusable="false"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      className="cherry-stat-card__stop"
                      offset="0"
                      stopOpacity="0.28"
                    />
                    <stop
                      className="cherry-stat-card__stop"
                      offset="1"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  className="cherry-stat-card__area"
                  d={spark.area}
                  fill={`url(#${gradientId})`}
                />
                <path
                  className="cherry-stat-card__line"
                  d={spark.line}
                  pathLength={1}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span className="cherry-stat-card__dot" />
            </span>
          ) : null}
        </div>
        {delta !== undefined || deltaLabel ? (
          <div className="cherry-stat-card__footer">
            {delta !== undefined ? (
              <span className="cherry-stat-card__delta">
                <TrendIcon aria-hidden="true" />
                <span className="cherry-sr-only">{spoken} </span>
                {delta}
              </span>
            ) : null}
            {deltaLabel ? (
              <span className="cherry-stat-card__delta-label">
                {deltaLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);
