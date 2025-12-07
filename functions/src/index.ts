
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// ============================================
// FUNCTION 1: PRICE FORECASTING
// ============================================
export const predictPrice = functions.https.onCall(
  async (data: any, context: any) => {
    try {
      const { location, propertyType, bedrooms, sqm, currentPrice } = data;

      // Input validation
      if (!location || !propertyType || !bedrooms || !sqm || !currentPrice) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required fields"
        );
      }

      const predictions = calculatePricePrediction(
        location,
        propertyType,
        bedrooms,
        sqm,
        currentPrice
      );

      // Log to Firestore for analytics
      await admin.firestore().collection("ml_predictions").add({
        type: "price_forecast",
        input: data,
        output: predictions,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: context.auth?.uid || "anonymous",
      });

      return {
        success: true,
        predictions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Price prediction error:", error);
      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ============================================
// FUNCTION 2: DEMAND ANALYSIS
// ============================================
export const analyzeDemand = functions.https.onCall(
  async (data: any, context: any) => {
    try {
      const { location, propertyType, bedrooms, targetRent } = data;

      // Input validation
      if (!location || !propertyType || !bedrooms || !targetRent) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required fields"
        );
      }

      const analysis = calculateDemandAnalysis(
        location,
        propertyType,
        bedrooms,
        targetRent
      );

      // Log to Firestore
      await admin.firestore().collection("ml_predictions").add({
        type: "demand_analysis",
        input: data,
        output: analysis,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: context.auth?.uid || "anonymous",
      });

      return {
        success: true,
        analysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Demand analysis error:", error);
      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ============================================
// FUNCTION 3: ROI CALCULATOR
// ============================================
export const calculateROI = functions.https.onCall(
  async (data: any, context: any) => {
    try {
      const {
        propertyValue,
        monthlyRent,
        annualExpenses,
        downPaymentPercent = 20,
        loanInterestRate = 12.5,
        investmentYears = 5,
      } = data;

      // Input validation
      if (!propertyValue || !monthlyRent || !annualExpenses) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required fields"
        );
      }

      const roi = calculateROIMetrics(
        propertyValue,
        monthlyRent,
        annualExpenses,
        downPaymentPercent,
        loanInterestRate,
        investmentYears
      );

      // Log to Firestore
      await admin.firestore().collection("ml_predictions").add({
        type: "roi_calculation",
        input: data,
        output: roi,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: context.auth?.uid || "anonymous",
      });

      return {
        success: true,
        roi,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("ROI calculation error:", error);
      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculatePricePrediction(
  location: string,
  propertyType: string,
  bedrooms: number,
  sqm: number,
  currentPrice: number
) {
  // Market growth rates for Kenya based on KNBS data
  const growthRates: { [key: string]: number } = {
    Nairobi: 0.08, // 8% annual
    Mombasa: 0.06, // 6% annual
    Kisumu: 0.05, // 5% annual
    Nakuru: 0.055, // 5.5% annual
    Eldoret: 0.05, // 5% annual
  };

  const annualGrowth = growthRates[location] || 0.06;

  const threeMonthPrice = currentPrice * (1 + annualGrowth / 4);
  const sixMonthPrice = currentPrice * (1 + annualGrowth / 2);
  const twelveMonthPrice = currentPrice * (1 + annualGrowth);

  return {
    threeMonth: {
      predicted: Math.round(threeMonthPrice),
      confidenceInterval: {
        lower: Math.round(threeMonthPrice * 0.95),
        upper: Math.round(threeMonthPrice * 1.05),
      },
      growthRate: ((annualGrowth / 4) * 100).toFixed(2),
    },
    sixMonth: {
      predicted: Math.round(sixMonthPrice),
      confidenceInterval: {
        lower: Math.round(sixMonthPrice * 0.93),
        upper: Math.round(sixMonthPrice * 1.07),
      },
      growthRate: ((annualGrowth / 2) * 100).toFixed(2),
    },
    twelveMonth: {
      predicted: Math.round(twelveMonthPrice),
      confidenceInterval: {
        lower: Math.round(twelveMonthPrice * 0.9),
        upper: Math.round(twelveMonthPrice * 1.1),
      },
      growthRate: (annualGrowth * 100).toFixed(2),
    },
    metadata: {
      model: "rule-based-v1",
      location,
      propertyType,
    },
  };
}

function calculateDemandAnalysis(
  location: string,
  propertyType: string,
  bedrooms: number,
  targetRent: number
) {
  // Benchmark rents per bedroom in KES
  const benchmarkRents: {
    [key: string]: { [key: number]: number };
  } = {
    Nairobi: { 1: 25000, 2: 40000, 3: 65000, 4: 90000 },
    Mombasa: { 1: 18000, 2: 30000, 3: 50000, 4: 70000 },
    Kisumu: { 1: 12000, 2: 20000, 3: 35000, 4: 50000 },
    Nakuru: { 1: 15000, 2: 25000, 3: 40000, 4: 60000 },
    Eldoret: { 1: 12000, 2: 20000, 3: 35000, 4: 50000 },
  };

  const marketRent =
    benchmarkRents[location]?.[bedrooms] ||
    benchmarkRents["Nairobi"]?.[bedrooms] ||
    25000;
  const priceRatio = targetRent / marketRent;

  let demandLevel: string;
  let occupancyForecast: number;

  if (priceRatio < 0.9) {
    demandLevel = "high";
    occupancyForecast = 95;
  } else if (priceRatio > 1.1) {
    demandLevel = "low";
    occupancyForecast = 65;
  } else {
    demandLevel = "medium";
    occupancyForecast = 85;
  }

  const recommendation =
    priceRatio > 1.15
      ? "Consider lowering rent to increase demand"
      : priceRatio < 0.85
        ? "Rent is below market - opportunity to increase"
        : "Rent is competitive with market rates";

  return {
    demandLevel,
    occupancyForecast,
    optimalPriceRange: {
      min: Math.round(marketRent * 0.9),
      max: Math.round(marketRent * 1.1),
      currency: "KES",
    },
    marketComparison: {
      targetRent,
      marketAverage: marketRent,
      difference: targetRent - marketRent,
      percentageDifference: ((priceRatio - 1) * 100).toFixed(1),
    },
    recommendation,
  };
}

function calculateROIMetrics(
  propertyValue: number,
  monthlyRent: number,
  annualExpenses: number,
  downPaymentPercent: number,
  loanInterestRate: number,
  investmentYears: number
) {
  // Financial calculations
  const downPayment = (propertyValue * downPaymentPercent) / 100;
  const loanAmount = propertyValue - downPayment;
  const annualRent = monthlyRent * 12;
  const netOperatingIncome = annualRent - annualExpenses;

  // Cap Rate
  const capRate = ((netOperatingIncome / propertyValue) * 100).toFixed(2);

  // Cash on Cash Return
  const annualLoanPayment = (loanAmount * loanInterestRate) / 100;
  const cashFlow = netOperatingIncome - annualLoanPayment;
  const cashOnCashReturn = ((cashFlow / downPayment) * 100).toFixed(2);

  // Break-even calculation
  const breakEvenMonths = Math.ceil(
    downPayment / (monthlyRent - annualExpenses / 12)
  );

  // 5-year profit projection
  const fiveYearRent = annualRent * investmentYears;
  const fiveYearExpenses = annualExpenses * investmentYears;
  const fiveYearLoanPayments = annualLoanPayment * investmentYears;
  const fiveYearProfit =
    fiveYearRent - fiveYearExpenses - fiveYearLoanPayments;

  // Total ROI
  const totalROI = ((fiveYearProfit / downPayment) * 100).toFixed(2);

  return {
    cashOnCashReturn,
    capRate,
    breakEvenPeriod: {
      months: breakEvenMonths,
      years: (breakEvenMonths / 12).toFixed(1),
    },
    fiveYearProjection: {
      totalRevenue: fiveYearRent,
      totalExpenses: fiveYearExpenses + fiveYearLoanPayments,
      netProfit: Math.round(fiveYearProfit),
      roi: totalROI,
    },
    monthlyBreakdown: {
      grossRent: monthlyRent,
      monthlyExpenses: Math.round(annualExpenses / 12),
      monthlyCashFlow: Math.round(cashFlow / 12),
      currency: "KES",
    },
    investmentSummary: {
      propertyValue,
      downPayment: Math.round(downPayment),
      loanAmount: Math.round(loanAmount),
      loanInterestRate,
      investmentHorizon: `${investmentYears} years`,
    },
  };
}
