
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
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
];

function SettingsPage() {
  const { currency, setCurrency, locale, setLocale, companyName, setCompanyName, residencyStatus, setResidencyStatus } = useDataContext();
  const [isEditing, setIsEditing] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(currency);
  const [tempLocale, setTempLocale] = useState(locale);
  const [tempCompanyName, setTempCompanyName] = useState(companyName);
  const [tempResidencyStatus, setTempResidencyStatus] = useState(residencyStatus);


  useEffect(() => {
    if (!isEditing) {
      setTempCurrency(currency);
      setTempLocale(locale);
      setTempCompanyName(companyName);
      setTempResidencyStatus(residencyStatus);
    }
  }, [isEditing, currency, locale, companyName, residencyStatus]);

  const handleSave = () => {
    setCurrency(tempCurrency);
    setLocale(tempLocale);
    setCompanyName(tempCompanyName);
    setResidencyStatus(tempResidencyStatus);
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
          <fieldset disabled={!isEditing} className="space-y-4">
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
              <Label htmlFor="locale-select">Locale</Label>
              <Select value={tempLocale} onValueChange={setTempLocale}>
                <SelectTrigger id="locale-select" className="w-[280px]">
                  <SelectValue placeholder="Select a locale" />
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
