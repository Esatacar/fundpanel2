import React from 'react';
import { Table, ChevronDown, Check } from 'lucide-react';
import { useGlobalViewSettings } from '../../hooks/useGlobalViewSettings';
import { accountMetrics } from '../../constants/accountMetrics';

// Function to get available quarters for a given year based on actual data
const getAvailableQuarters = (year: number, data: any) => {
  if (!data) return year === 2025 ? [1, 2] : [4, 3, 2, 1];
  
  const availableQuarters: number[] = [];
  const quartersToCheck = [4, 3, 2, 1];
  
  for (const quarter of quartersToCheck) {
    // Check if any metric has data for this quarter
    const hasData = Object.keys(data).some(key => {
      if (key.endsWith(`_q${quarter}_${year}`)) {
        const value = data[key];
        return value !== null && value !== undefined && value !== 0;
      }
      return false;
    });
    
    if (hasData) {
      availableQuarters.push(quarter);
    }
  }
  
  return availableQuarters.length > 0 ? availableQuarters.sort((a, b) => b - a) : [1];
};

interface AccountDetailsProps {
  quarterOptions: Array<{
    year: number;
    quarter: number;
    label: string;
    value: string;
    selected: boolean;
  }>;
  selectedQuarters: Array<{
    year: number;
    quarter: number;
    label: string;
  }>;
  showQuarterSelector: boolean;
  setShowQuarterSelector: (show: boolean) => void;
  toggleQuarterSelection: (value: string) => void;
  quarterSelectorRef: React.RefObject<HTMLDivElement>;
  companyData: any;
  formatCurrency: (value: number) => string;
}

export default function AccountDetails({
  showQuarterSelector,
  setShowQuarterSelector,
  quarterSelectorRef,
  companyData,
  formatCurrency
}: AccountDetailsProps) {
  const { settings, updateSettings } = useGlobalViewSettings();
  
  // Generate quarter options dynamically based on actual data
  const years = [2025, 2024, 2023, 2022, 2021];
  const quarterOptions = React.useMemo(() => {
    const options: Array<{
      year: number;
      quarter: number;
      label: string;
      value: string;
      selected: boolean;
    }> = [];
    
    for (const year of years) {
      const availableQuarters = getAvailableQuarters(year, companyData);
      
      for (const quarter of availableQuarters) {
        options.push({
          year,
          quarter,
          label: `Q${quarter} ${year}`,
          value: `${year}-${quarter}`,
          selected: settings.accountQuarters.includes(`${year}-${quarter}`)
        });
      }
    }
    
    return options;
  }, [companyData, settings.accountQuarters]);
  
  const toggleQuarterSelection = async (value: string) => {
    const currentSelected = settings.accountQuarters;
    const isCurrentlySelected = currentSelected.includes(value);
    
    const updatedSelected = isCurrentlySelected
      ? currentSelected.filter(q => q !== value)
      : [...currentSelected, value];
    
    await updateSettings({
      accountQuarters: updatedSelected
    });
  };

  const selectedQuarters = quarterOptions
    .filter(option => settings.accountQuarters.includes(option.value))
    .sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.quarter - b.quarter;
    });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Table className="h-6 w-6 text-blue-600" />
            <h3 className="ml-2 text-lg font-semibold text-blue-900">LP Account Details</h3>
          </div>
          <div className="relative" ref={quarterSelectorRef}>
            <button
              onClick={() => setShowQuarterSelector(!showQuarterSelector)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
            >
              <span>
                {selectedQuarters.length === 0 
                  ? 'Select Quarters' 
                  : `${selectedQuarters.length} Quarter${selectedQuarters.length === 1 ? '' : 's'} Selected`}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showQuarterSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 border">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Select Quarters to Compare</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {quarterOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => toggleQuarterSelection(option.value)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors hover:bg-gray-50"
                      >
                        <span>{option.label}</span>
                        {option.selected && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                {selectedQuarters.map(({ year, quarter }) => (
                  <th
                    key={`${year}-${quarter}`}
                    className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Q{quarter} {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountMetrics.map(({ label, prefix }) => (
                <tr key={prefix} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {label}
                  </td>
                  {selectedQuarters.map(({ year, quarter }) => (
                    <td
                      key={`${prefix}-${year}-${quarter}`}
                      className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {formatCurrency(companyData[`${prefix}_q${quarter}_${year}`] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
