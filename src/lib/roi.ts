// Industry benchmarks for TikTok organic content (2025-2026)
// Source: influencerfee.com, channelcore.io, influencekit.com

export const CPM_BENCHMARK = 8; // $8 per 1,000 views (conservative for TikTok organic)
export const CPM_EXCELLENT = 4; // $4 per 1,000 views (top quartile)
export const CPM_PREMIUM = 15; // $15 per 1,000 views (premium creators)

export const ENGAGEMENT_RATES = {
    view: 0.008, // $0.008 per view (CPM $8 / 1000)
    like: 0.05, // $0.05 per like
    comment: 0.25, // $0.25 per comment
    share: 0.50, // $0.50 per share
    save: 0.35, // $0.35 per save
} as const;

export const ROI_THRESHOLDS = {
    excellent: 500, // 500%+ = excellent
    good: 300, // 300-500% = good
    average: 150, // 150-300% = average
    poor: 0, // 0-150% = poor
    negative: 0, // below 0 = negative
} as const;

export interface EngagementMetrics {
    playCount: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
}

/** Calculate Earned Media Value (EMV) using CPM benchmark */
export function calculateEMV(totalViews: number): number {
    return (totalViews / 1000) * CPM_BENCHMARK;
}

/** Calculate total engagements */
export function totalEngagements(m: EngagementMetrics): number {
    return m.likes + m.comments + m.shares + m.saves;
}

/** Calculate Engagement Rate (as percentage) */
export function calculateEngagementRate(m: EngagementMetrics): number {
    if (m.playCount === 0) return 0;
    return (totalEngagements(m) / m.playCount) * 100;
}

/** Calculate Cost Per Mille (CPM) */
export function calculateCPM(investment: number, totalViews: number): number | null {
    if (totalViews === 0) return null;
    return (investment / totalViews) * 1000;
}

/** Calculate Cost Per Engagement (CPE) */
export function calculateCPE(investment: number, engagements: number): number | null {
    if (engagements === 0) return null;
    return investment / engagements;
}

/** Calculate ROI percentage */
export function calculateROI(emv: number, investment: number): number {
    if (investment === 0) return 0;
    return ((emv - investment) / investment) * 100;
}

/** Get qualitative label for ROI value */
export function getROILabel(roi: number): string {
    if (roi >= ROI_THRESHOLDS.excellent) return "Excelente";
    if (roi >= ROI_THRESHOLDS.good) return "Bueno";
    if (roi >= ROI_THRESHOLDS.average) return "Promedio";
    if (roi >= ROI_THRESHOLDS.poor) return "Bajo";
    return "Negativo";
}

/** Get color class for ROI value */
export function getROIColor(roi: number): string {
    if (roi >= ROI_THRESHOLDS.excellent) return "text-green-600";
    if (roi >= ROI_THRESHOLDS.good) return "text-emerald-500";
    if (roi >= ROI_THRESHOLDS.average) return "text-amber-500";
    if (roi >= ROI_THRESHOLDS.poor) return "text-orange-500";
    return "text-red-500";
}
