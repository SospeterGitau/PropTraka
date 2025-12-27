import { Tenant } from './db-types';

/**
 * Calculates a "Trust Score" (0-100) for a tenant based on verified data points.
 * 
 * Scoring Model:
 * - Base: 0
 * - Tier 1 (Signals): Phone/Email present (+10 each)
 * - Tier 2 (Documents): ID Uploaded (+20), Selfie Uploaded (+10)
 * - Tier 3 (Social): Valid Vouch (+20)
 * - Tier 4 (Crypto/Bio): World ID Verified (+40) - High confidence
 * 
 * @param tenant The tenant object to evaluate
 * @returns number between 0 and 100
 */
export function calculateTrustScore(tenant: Tenant): number {
    let score = 0;

    // 1. Basic Signals (Max 20)
    if (tenant.email && tenant.email.includes('@')) score += 10;
    if (tenant.phoneNumber && tenant.phoneNumber.length > 5) score += 10;

    // 2. Documents (Max 30)
    const docs = tenant.identityDocuments || [];
    const hasId = docs.some(d => (d.type === 'ID_FRONT' || d.type === 'PASSPORT') && d.status === 'Verified');
    const hasSelfie = docs.some(d => d.type === 'SELFIE' && d.status === 'Verified');

    if (hasId) score += 20;
    if (hasSelfie) score += 10;

    // 3. Social Vouching (Max 20)
    const vouches = tenant.vouchingRequests || [];
    const hasAcceptedVouch = vouches.some(v => v.status === 'Accepted');
    if (hasAcceptedVouch) score += 20;

    // 4. World ID (Max 40) - "The Golden Ticket"
    // If World ID is present, it's a very strong signal of personhood.
    if (tenant.worldIdHash) score += 40;

    return Math.min(score, 100);
}

export function getTrustLevel(score: number): { label: string; color: string } {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-600' };
    return { label: 'Low / Unverified', color: 'text-red-500' };
}
