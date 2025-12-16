"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Calculator,
  Info,
  CalendarClock,
  DollarSign,
  Percent,
  History,
} from "lucide-react";

type Period = "weekly" | "biweekly" | "semimonthly" | "monthly";

const PERIODS_PER_YEAR: Record<Period, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

// Overtime threshold per period (based on 40 hrs/week)
const OT_THRESH_BY_PERIOD: Record<Period, number> = {
  weekly: 40,
  biweekly: 80,
  semimonthly: 40 * (26 / 24), // ≈ 43.33
  monthly: 40 * (52 / 12), // ≈ 173.33
};

// 2025 FICA (employee)
const SS_RATE = 0.062; // 6.2%
const SS_WAGE_BASE_2025 = 176_100; // $
const MEDICARE_RATE = 0.0145; // 1.45%
const ADDL_MED_RATE = 0.009; // 0.9%
const ADDL_MED_THRESHOLD = 200_000; // $

// Sample **illustrative** annual federal brackets (single-filer style, for class demo)
const SAMPLE_FIT_BRACKETS = [
  { upTo: 12_000, rate: 0.10 },
  { upTo: 47_500, rate: 0.12 },
  { upTo: 100_000, rate: 0.22 },
  { upTo: 190_000, rate: 0.24 },
  { upTo: 245_000, rate: 0.32 },
  { upTo: 610_000, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function annualize(amountPerPeriod: number, period: Period) {
  return amountPerPeriod * PERIODS_PER_YEAR[period];
}
function deannualize(annualAmount: number, period: Period) {
  return annualAmount / PERIODS_PER_YEAR[period];
}

function computeFITAnnual(taxableAnnual: number) {
  let remaining = Math.max(0, taxableAnnual);
  let lower = 0;
  let tax = 0;
  for (const b of SAMPLE_FIT_BRACKETS) {
    const cap = Math.min(remaining, b.upTo - lower);
    if (cap > 0) {
      tax += cap * b.rate;
      remaining -= cap;
      lower = b.upTo;
    }
    if (remaining <= 0) break;
  }
  return tax;
}

export default function Page() {
  const [period, setPeriod] = React.useState<Period>("weekly");
  const [hourlyRate, setHourlyRate] = React.useState<string>("25");
  const [hours, setHours] = React.useState<string>("45");
  const [ytdWages, setYtdWages] = React.useState<string>("0");

  const [results, setResults] = React.useState<string>("");

  function calculate() {
    const rate = Number(hourlyRate || 0);
    const hrs = Number(hours || 0);
    const ytdBefore = Number(ytdWages || 0);

    if (rate < 0 || hrs < 0 || ytdBefore < 0) {
      setResults("Inputs must be zero or positive.");
      return;
    }

    // Overtime split
    const otThreshold = OT_THRESH_BY_PERIOD[period];
    const otHours = Math.max(0, hrs - otThreshold);
    const regHours = Math.max(0, hrs - otHours);

    // Gross pay
    const regularPay = regHours * rate;
    const overtimePay = otHours * rate * 1.5;
    const gross = regularPay + overtimePay;

    // Sample Federal Income Tax (illustrative): annualize -> tax -> deannualize
    const grossAnnual = annualize(gross, period);
    const fitAnnual = computeFITAnnual(grossAnnual);
    const fitThisPeriod = deannualize(fitAnnual, period);

    // FICA (employee)
    const wagesThis = gross;
    const ytdAfter = ytdBefore + wagesThis;

    // Social Security capped at wage base
    const ssTaxableThis =
      ytdBefore >= SS_WAGE_BASE_2025
        ? 0
        : Math.max(0, Math.min(ytdAfter, SS_WAGE_BASE_2025) - ytdBefore);

    const ssTax = ssTaxableThis * SS_RATE;

    // Medicare + Additional Medicare
    const medicare = wagesThis * MEDICARE_RATE;
    const addlMedTaxableThis =
      ytdBefore >= ADDL_MED_THRESHOLD
        ? wagesThis
        : Math.max(0, ytdAfter - ADDL_MED_THRESHOLD);
    const addlMed = addlMedTaxableThis * ADDL_MED_RATE;

    const fica = ssTax + medicare + addlMed;

    const net = gross - fitThisPeriod - fica;

    const lines: string[] = [];
    lines.push("--- Pay Summary ---");
    lines.push(`Pay period: ${period}`);
    lines.push(`Hourly rate: ${currency(rate)}`);
    lines.push(`Hours (regular): ${regHours.toFixed(2)}`);
    lines.push(`Hours (overtime @1.5x): ${otHours.toFixed(2)}`);
    lines.push(`Regular pay: ${currency(regularPay)}`);
    lines.push(`Overtime pay: ${currency(overtimePay)}`);
    lines.push(`GROSS PAY: ${currency(gross)}`);
    lines.push("");
    lines.push("--- Federal Taxes (This Check) ---");
    lines.push(`Sample Federal Income Tax (illustrative): ${currency(fitThisPeriod)}`);
    lines.push(`Social Security (6.2% up to $176,100): ${currency(ssTax)}`);
    lines.push(`Medicare (1.45% all wages): ${currency(medicare)}`);
    lines.push(`Additional Medicare (0.9% over $200,000 YTD): ${currency(addlMed)}`);
    lines.push(`Total FICA (SS + Medicare): ${currency(fica)}`);
    lines.push("");
    lines.push(`NET PAY: ${currency(net)}`);
    lines.push("");
    lines.push("--- YTD Helper ---");
    lines.push(`YTD before this check: ${currency(ytdBefore)}`);
    lines.push(`YTD after this check: ${currency(ytdAfter)}`);
    lines.push("(Used only to decide Social Security cap and Additional Medicare)");
    setResults(lines.join("\n"));
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Calculator className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Payroll Calculator – Class Project</h1>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Educational use only</AlertTitle>
        <AlertDescription>
          Federal income tax uses a simple sample bracket table for demonstration.
          FICA rates reflect 2025 law. No state/local taxes, no pre/post-tax deductions.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Inputs
            </CardTitle>
            <CardDescription>Hourly only. Overtime is 1.5× after 40 hrs/week (scaled by pay period).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="period">Pay period</Label>
              <Select
                value={period}
                onValueChange={(v: Period) => setPeriod(v)}
              >
                <SelectTrigger id="period" aria-label="Pay period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly (every 2 weeks)</SelectItem>
                  <SelectItem value="semimonthly">Semi-monthly (24/yr)</SelectItem>
                  <SelectItem value="monthly">Monthly (12/yr)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rate" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Hourly rate
              </Label>
              <Input
                id="rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="25.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hours" className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                Total hours this period
              </Label>
              <Input
                id="hours"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 45"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ytd" className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Year-to-date taxable wages (optional)
              </Label>
              <Input
                id="ytd"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={ytdWages}
                onChange={(e) => setYtdWages(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center gap-2">
            <Button onClick={calculate} className="w-full">
              Calculate
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setPeriod("weekly");
                setHourlyRate("25");
                setHours("45");
                setYtdWages("0");
                setResults("");
              }}
            >
              Reset
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Results
            </CardTitle>
            <CardDescription>Calculated for the selected pay period.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{results || "Run a calculation to see results here."}</pre>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Tip: Include a screenshot of this result and your assumptions in your project report.
            </p>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overtime Thresholds</CardTitle>
            <CardDescription>Threshold is based on 40 hours per week.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>Weekly: 40.00 hours</li>
              <li>Biweekly: 80.00 hours</li>
              <li>Semi-monthly: ≈ {OT_THRESH_BY_PERIOD.semimonthly.toFixed(2)} hours</li>
              <li>Monthly: ≈ {OT_THRESH_BY_PERIOD.monthly.toFixed(2)} hours</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Federal Items Used</CardTitle>
            <CardDescription>FICA uses 2025 rates; income tax uses a sample table.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <strong>Social Security (employee):</strong> 6.2% up to ${SS_WAGE_BASE_2025.toLocaleString()}
            </div>
            <div>
              <strong>Medicare (employee):</strong> 1.45% on all wages
            </div>
            <div>
              <strong>Additional Medicare:</strong> 0.9% on wages over ${ADDL_MED_THRESHOLD.toLocaleString()} (YTD-based)
            </div>
            <Separator className="my-2" />
            <div>
              <strong>Sample Federal Income Tax (illustrative only):</strong>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div className="font-medium">Bracket</div>
                <div className="font-medium">Up to</div>
                <div className="font-medium">Rate</div>
                <div>1</div><div>$12,000</div><div>10%</div>
                <div>2</div><div>$47,500</div><div>12%</div>
                <div>3</div><div>$100,000</div><div>22%</div>
                <div>4</div><div>$190,000</div><div>24%</div>
                <div>5</div><div>$245,000</div><div>32%</div>
                <div>6</div><div>$610,000</div><div>35%</div>
                <div>7</div><div>∞</div><div>37%</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              For real payroll, use current IRS Pub. 15-T methods and the employee’s W-4.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
