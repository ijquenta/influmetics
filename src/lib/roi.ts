// Industry benchmarks for TikTok organic content (2025-2026)
// Source: influencerfee.com, channelcore.io, influencekit.com

export const CPM_BENCHMARK = 8;
export const CPM_EXCELLENT = 4;
export const CPM_PREMIUM = 15;

export const ENGAGEMENT_RATES = {
    view: 0.008,
    like: 0.05,
    comment: 0.25,
    share: 0.50,
    save: 0.35,
} as const;

export const ROI_THRESHOLDS = {
    excellent: 500,
    good: 300,
    average: 150,
    poor: 0,
    negative: 0,
} as const;

export const BOT_RATE_DEFAULT = 0.10;

export const ROI_SCENARIOS = {
    conservative: { ctr: 0.005, cr: 0.010, label: "Conservador", color: "text-amber-500", short: "Cons." },
    expected:     { ctr: 0.010, cr: 0.020, label: "Esperado",     color: "text-blue-500",   short: "Esp." },
    optimistic:   { ctr: 0.015, cr: 0.025, label: "Optimista",    color: "text-green-500",  short: "Opt." },
} as const;

export type ScenarioKey = keyof typeof ROI_SCENARIOS;

export interface EngagementMetrics {
    playCount: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
}

export interface FormulaInputs {
    ticket: number;
    margin: number;
    botRate: number;
}

export interface ScenarioResult {
    ctr: number;
    cr: number;
    Q: number;
    I: number;
    roi: number;
}

export interface FormulaResult {
    V_m: number;
    V_e: number;
    totalViews: number;
    scenarios: Record<ScenarioKey, ScenarioResult>;
}

export function calculateEMV(totalViews: number): number {
    return (totalViews / 1000) * CPM_BENCHMARK;
}

export function totalEngagements(m: EngagementMetrics): number {
    return m.likes + m.comments + m.shares + m.saves;
}

export function calculateEngagementRate(m: EngagementMetrics): number {
    if (m.playCount === 0) return 0;
    return (totalEngagements(m) / m.playCount) * 100;
}

export function calculateCPM(investment: number, totalViews: number): number | null {
    if (totalViews === 0) return null;
    return (investment / totalViews) * 1000;
}

export function calculateCPE(investment: number, engagements: number): number | null {
    if (engagements === 0) return null;
    return investment / engagements;
}

export function calculateROI(emv: number, investment: number): number {
    if (investment === 0) return 0;
    return ((emv - investment) / investment) * 100;
}

export function getROILabel(roi: number): string {
    if (roi >= ROI_THRESHOLDS.excellent) return "Excelente";
    if (roi >= ROI_THRESHOLDS.good) return "Bueno";
    if (roi >= ROI_THRESHOLDS.average) return "Promedio";
    if (roi >= ROI_THRESHOLDS.poor) return "Bajo";
    return "Negativo";
}

export function getROIColor(roi: number): string {
    if (roi >= ROI_THRESHOLDS.excellent) return "text-green-600";
    if (roi >= ROI_THRESHOLDS.good) return "text-emerald-500";
    if (roi >= ROI_THRESHOLDS.average) return "text-amber-500";
    if (roi >= ROI_THRESHOLDS.poor) return "text-orange-500";
    return "text-red-500";
}

export function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateEffectiveViews(totalViews: number, botRate: number): number {
    return totalViews * (1 - botRate);
}

export function calculateTransactions(effectiveViews: number, ctr: number, cr: number): number {
    return effectiveViews * ctr * cr;
}

export function calculateNetIncome(transactions: number, ticket: number, margin: number): number {
    return transactions * ticket * (margin / 100);
}

export function calculateFormulaROI(netIncome: number, cost: number): number {
    if (cost === 0) return 0;
    return ((netIncome - cost) / cost) * 100;
}

export function computeScenarios(
    totalViews: number,
    cost: number,
    inputs: FormulaInputs,
    conversionRateOverride?: number | null
): FormulaResult {
    const V_e = calculateEffectiveViews(totalViews, inputs.botRate);

    const scenarios = {} as Record<ScenarioKey, ScenarioResult>;

    for (const [key, scenario] of Object.entries(ROI_SCENARIOS)) {
        const cr = conversionRateOverride ?? scenario.cr;
        const Q = calculateTransactions(V_e, scenario.ctr, cr);
        const I = calculateNetIncome(Q, inputs.ticket, inputs.margin);
        const roi = calculateFormulaROI(I, cost);

        scenarios[key as ScenarioKey] = {
            ctr: scenario.ctr,
            cr,
            Q: Math.round(Q * 100) / 100,
            I: Math.round(I * 100) / 100,
            roi: Math.round(roi * 100) / 100,
        };
    }

    return {
        V_m: 0,
        V_e: Math.round(V_e),
        totalViews,
        scenarios,
    };
}

export function computeScenariosWithMedian(
    viewsPerPost: number[],
    cost: number,
    inputs: FormulaInputs,
    conversionRateOverride?: number | null
): FormulaResult {
    const V_m = calculateMedian(viewsPerPost);
    const totalViews = viewsPerPost.reduce((s, v) => s + v, 0);
    const effectiveRate = 1 - inputs.botRate;
    const V_e_perPost = V_m * effectiveRate;
    const V_e = V_e_perPost * viewsPerPost.length;

    const scenarios = {} as Record<ScenarioKey, ScenarioResult>;

    for (const [key, scenario] of Object.entries(ROI_SCENARIOS)) {
        const cr = conversionRateOverride ?? scenario.cr;
        const Q = calculateTransactions(V_e, scenario.ctr, cr);
        const I = calculateNetIncome(Q, inputs.ticket, inputs.margin);
        const roi = calculateFormulaROI(I, cost);

        scenarios[key as ScenarioKey] = {
            ctr: scenario.ctr,
            cr,
            Q: Math.round(Q * 100) / 100,
            I: Math.round(I * 100) / 100,
            roi: Math.round(roi * 100) / 100,
        };
    }

    return {
        V_m: Math.round(V_m),
        V_e: Math.round(V_e),
        totalViews,
        scenarios,
    };
}
