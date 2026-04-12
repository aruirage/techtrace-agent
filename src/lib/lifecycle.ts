import type { LifecycleOverride, ProductLifecycle } from "@/types/analysis";

export const LIFECYCLE_STAGE_OPTIONS = [
  "概念验证",
  "产品验证",
  "商业验证",
  "规模化交付",
] as const;

export function getEffectiveProductLifecycle(
  productLifecycle: ProductLifecycle,
  lifecycleOverride?: LifecycleOverride | null,
): ProductLifecycle {
  if (!lifecycleOverride?.stage) {
    return productLifecycle;
  }

  return {
    ...productLifecycle,
    stage: lifecycleOverride.stage,
  };
}

export function hasLifecycleOverride(lifecycleOverride?: LifecycleOverride | null) {
  return Boolean(lifecycleOverride?.stage);
}
