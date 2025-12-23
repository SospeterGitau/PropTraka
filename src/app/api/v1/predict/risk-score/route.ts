import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing or invalid API key' },
                { status: 401 }
            );
        }

        const apiKey = authHeader.split(' ')[1];

        // TODO: Validate API key against database/user records
        // For now, we accept any key that looks like a valid key (mock validation)
        if (apiKey.length < 10) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid API key' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { tenantName, income, creditScore, rentAmount } = body;

        if (!tenantName || !income || !creditScore || !rentAmount) {
            return NextResponse.json(
                { error: 'Bad Request: Missing required fields (tenantName, income, creditScore, rentAmount)' },
                { status: 400 }
            );
        }

        // Mock AI Risk Score Logic
        // In a real scenario, this would call an external ML model or internal advanced logic
        let riskScore = 0;

        // 1. Rent-to-Income Ratio (30% weight)
        const rentToIncome = rentAmount / income;
        if (rentToIncome > 0.4) riskScore += 40;
        else if (rentToIncome > 0.3) riskScore += 20;
        else riskScore += 5;

        // 2. Credit Score (50% weight)
        if (creditScore < 600) riskScore += 50;
        else if (creditScore < 700) riskScore += 25;
        else riskScore += 5;

        // 3. Name Length Randomness (Mock variation, 20% weight)
        // Adding some deterministic randomness based on name length so it's not static
        riskScore += (tenantName.length % 10) * 2;

        // Cap score at 100
        riskScore = Math.min(100, Math.max(0, riskScore));

        let riskLevel = 'Low';
        if (riskScore > 70) riskLevel = 'High';
        else if (riskScore > 40) riskLevel = 'Medium';

        return NextResponse.json({
            success: true,
            data: {
                tenantName,
                riskScore,
                riskLevel,
                details: {
                    rentToIncomeRatio: rentToIncome.toFixed(2),
                    creditScoreCategory: creditScore > 700 ? 'Good' : creditScore > 600 ? 'Fair' : 'Poor'
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('AI Risk Score Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
