export const SUBSCRIPTION_TIERS = {
  free: "free",
  pro: "pro",
  enterprise: "enterprise",
} as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

export const SUBSCRIPTION_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ["Hasta 10 influencers", "Métricas básicas", "1 campaña activa"],
  pro: ["Influencers ilimitados", "Métricas avanzadas", "Campañas ilimitadas", "Exportación de datos"],
  enterprise: ["Todo lo de Pro", "API dedicada", "Soporte prioritario", "Onboarding personalizado"],
};
