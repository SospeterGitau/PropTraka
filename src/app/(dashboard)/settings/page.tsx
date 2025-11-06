
'use client';

import { useState, useEffect, memo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useDataContext } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ResidencyStatus } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const supportedCurrencies = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'KES', name: 'Kenyan Shilling' },
];

const supportedLocales = [
  { code: 'en-GB', name: 'DD/MM/YYYY (UK)' },
  { code: 'en-US', name: 'MM/DD/YYYY (US)' },
  { code: 'de-DE', name: 'DD.MM.YYYY (DE)' },
  { code: 'fr-FR', name: 'DD/MM/YYYY (FR)' },
  { code: 'ja-JP', name: 'YYYY/MM/DD (JP)' },
];

function SettingsPage() {
  const { 
    currency, setCurrency, 
    locale, setLocale, 
    companyName, setCompanyName, 
    residencyStatus, setResidencyStatus,
    isPnlReportEnabled, setIsPnlReportEnabled,
    isMarketResearchEnabled, setIsMarketResearchEnabled,
    theme, setTheme,
  } = useDataContext();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Temps states for editing
  const [tempCurrency, setTempCurrency] = useState(currency);
  const [tempLocale, setTempLocale] = useState(locale);
  const [tempCompanyName, setTempCompanyName] = useState(companyName);
  const [tempResidencyStatus, setTempResidencyStatus] = useState(residencyStatus);
  const [tempIsPnlReportEnabled, setTempIsPnlReportEnabled] = useState(isPnlReportEnabled);
  const [tempIsMarketResearchEnabled, setTempIsMarketResearchEnabled] = useState(isMarketResearchEnabled);
  const [tempTheme, setTempTheme] = useState(theme);


  useEffect(() => {
    if (!isEditing) {
      setTempCurrency(currency);
      setTempLocale(locale);
      setTempCompanyName(companyName);
      setTempResidencyStatus(residencyStatus);
      setTempIsPnlReportEnabled(isPnlReportEnabled);
      setTempIsMarketResearchEnabled(isMarketResearchEnabled);
      setTempTheme(theme);
    }
  }, [isEditing, currency, locale, companyName, residencyStatus, isPnlReportEnabled, isMarketResearchEnabled, theme]);

  const handleSave = () => {
    setCurrency(tempCurrency);
    setLocale(tempLocale);
    setCompanyName(tempCompanyName);
    setResidencyStatus(tempResidencyStatus);
    setIsPnlReportEnabled(tempIsPnlReportEnabled);
    setIsMarketResearchEnabled(tempIsMarketResearchEnabled);
    setTheme(tempTheme);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <>
      <PageHeader title="Settings">
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
        )}
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your application settings. Click "Edit" to make changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <fieldset disabled={!isEditing} className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">Appearance</h3>
              <Separator className="my-2" />
               <div className="space-y-2 pt-2">
                <Label>Theme</Label>
                 <RadioGroup
                    value={tempTheme}
                    onValueChange={(value: "light" | "dark" | "system") => setTempTheme(value)}
                    className="grid max-w-md grid-cols-3 gap-8 pt-2"
                  >
                    <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="light" className="sr-only" />
                      <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                        <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">Light</span>
                    </Label>
                    <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="dark" className="sr-only" />
                      <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                          <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">Dark</span>
                    </Label>
                     <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="system" className="sr-only" />
                       <div className="items-center rounded-md border-2 border-muted bg-gradient-to-r from-slate-950 to-white p-1 hover:bg-accent hover:text-accent-foreground">
                          <div className="space-y-2 rounded-sm bg-gradient-to-r from-slate-900 to-gray-100 p-2">
                            <div className="space-y-2 rounded-md bg-gradient-to-r from-slate-800 to-white p-2 shadow-sm">
                              <div className="h-2 w-[80px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                              <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-slate-800 to-white p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-slate-400 to-gray-300" />
                              <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-slate-800 to-white p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-slate-400 to-gray-300" />
                              <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                            </div>
                          </div>
                        </div>
                      <span className="block w-full p-2 text-center font-normal">System</span>
                    </Label>
                  </RadioGroup>
               </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">Company &amp; Tax</h3>
              <Separator className="my-2" />
               <div className="space-y-4 pt-2">
                 <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={tempCompanyName}
                      onChange={(e) => setTempCompanyName(e.target.value)}
                      className="w-[280px]"
                      placeholder="Your Company Name"
                    />
                    <p className="text-sm text-muted-foreground">
                      This name will be used on generated reports.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Residency Status</Label>
                    <RadioGroup
                      value={tempResidencyStatus}
                      onValueChange={(value: ResidencyStatus) => setTempResidencyStatus(value)}
                      className="flex gap-4 pt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="resident" id="r-resident" />
                        <Label htmlFor="r-resident">Resident</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non-resident" id="r-non-resident" />
                        <Label htmlFor="r-non-resident">Non-Resident</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-sm text-muted-foreground">
                      Determines if KRA rental income tax is applicable.
                    </p>
                  </div>
               </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Localisation</h3>
              <Separator className="my-2" />
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="currency-select">Currency</Label>
                  <Select value={tempCurrency} onValueChange={setTempCurrency}>
                    <SelectTrigger id="currency-select" className="w-[280px]">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCurrencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    This will change the currency symbol used across the application.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale-select">Date Format</Label>
                  <Select value={tempLocale} onValueChange={setTempLocale}>
                    <SelectTrigger id="locale-select" className="w-[280px]">
                      <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLocales.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    This will change the date and number formatting across the application.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">AI Feature Control</h3>
              <Separator className="my-2" />
              <div className="space-y-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pnl-switch"
                      checked={tempIsPnlReportEnabled}
                      onCheckedChange={setTempIsPnlReportEnabled}
                    />
                    <Label htmlFor="pnl-switch">Enable AI P&amp;L Statement Generation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Switch
                      id="market-research-switch"
                      checked={tempIsMarketResearchEnabled}
                      onCheckedChange={setTempIsMarketResearchEnabled}
                    />
                    <Label htmlFor="market-research-switch">Enable AI Market Research Generation</Label>
                  </div>
              </div>
            </div>
          </fieldset>
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}


export default memo(SettingsPage);
