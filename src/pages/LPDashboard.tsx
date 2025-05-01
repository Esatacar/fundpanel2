import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';
import Logo from '../components/Logo';
import BasicInfo from '../components/dashboard/BasicInfo';
import Commitment from '../components/dashboard/Commitment';
import QuarterPerformance from '../components/dashboard/QuarterPerformance';
import FundSummary from '../components/dashboard/FundSummary';
import AccountDetails from '../components/dashboard/AccountDetails';
import FinancialOverview from '../components/dashboard/FinancialOverview';
import NoInvestor from '../components/dashboard/NoInvestor';
import PortfolioOverview from '../components/dashboard/PortfolioOverview';
import UsefulLinks from '../components/dashboard/UsefulLinks';
import { useUsefulLinks } from '../hooks/useUsefulLinks';

interface CompanyData {
  id: string;
  company_no: string;
  company_name: string;
  total_commitment: number;
  [key: string]: any;
}

interface FundLevelData {
  id: string;
  [key: string]: any;
}

interface Period {
  year: number;
  quarter: number;
}

interface QuarterData {
  quarter: number;
  year: number;
  paidCapital: number;
  nav: number;
  difference: number;
}

interface ChartData {
  name: string;
  paidCapital: number;
  nav: number;
}

interface QuarterOption {
  year: number;
  quarter: number;
  label: string;
  value: string;
  selected: boolean;
}

// Define available years and quarters
const years = [2025, 2024, 2023, 2022, 2021];
const quarters = [1]; // Only Q1 for 2025
const regularQuarters = [4, 3, 2, 1]; // All quarters for other years

export default function LPDashboard() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [fundLevelData, setFundLevelData] = useState<FundLevelData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>({ year: 2025, quarter: 1 });
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [quarterOptions, setQuarterOptions] = useState<QuarterOption[]>([]);
  const [showQuarterSelector, setShowQuarterSelector] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { links: usefulLinks } = useUsefulLinks();

  const periodSelectorRef = useRef<HTMLDivElement>(null);
  const quarterSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodSelectorRef.current && !periodSelectorRef.current.contains(event.target as Node)) {
        setShowPeriodSelector(false);
      }
      if (quarterSelectorRef.current && !quarterSelectorRef.current.contains(event.target as Node)) {
        setShowQuarterSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchCompanyData();
      fetchFundLevelData();
      fetchPortfolioData();
      initializeQuarterOptions();
    }
  }, [user?.id]);

  useEffect(() => {
    if (fundLevelData) {
      const latestPeriod = findLatestPeriod();
      if (latestPeriod) {
        setSelectedPeriod(latestPeriod);
      }
    }
  }, [fundLevelData]);

  const fetchPortfolioData = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .select('*');
      
      if (error) throw error;
      setPortfolioData(data || []);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    }
  };

  const initializeQuarterOptions = () => {
    const options: QuarterOption[] = [];
    let latestQuartersCount = 0;
    
    for (const year of years) {
      // Use different quarters array based on the year
      const availableQuarters = year === 2025 ? quarters : regularQuarters;
      
      for (const quarter of availableQuarters) {
        const isLatestQuarter = latestQuartersCount < 4;
        options.push({
          year,
          quarter,
          label: `Q${quarter} ${year}`,
          value: `${year}-${quarter}`,
          selected: isLatestQuarter
        });
        if (isLatestQuarter) {
          latestQuartersCount++;
        }
      }
    }
    
    setQuarterOptions(options);
  };

  const toggleQuarterSelection = (value: string) => {
    setQuarterOptions(prev => 
      prev.map(option => 
        option.value === value
          ? { ...option, selected: !option.selected }
          : option
      )
    );
  };

  const getSelectedQuarters = () => {
    return quarterOptions
      .filter(option => option.selected)
      .sort((a, b) => b.year - a.year || b.quarter - a.quarter);
  };

  const findLatestPeriod = (): Period | null => {
    if (!fundLevelData) return null;

    for (const year of years) {
      const availableQuarters = year === 2025 ? quarters : regularQuarters;
      for (const quarter of availableQuarters) {
        const hasData = Object.keys(fundLevelData).some(key => {
          if (key.endsWith(`_q${quarter}_${year}`)) {
            const value = fundLevelData[key];
            return value !== null && value !== undefined && value !== 0;
          }
          return false;
        });

        if (hasData) {
          return { year, quarter };
        }
      }
    }

    return { year: 2021, quarter: 1 };
  };

  const fetchFundLevelData = async () => {
    try {
      const { data, error } = await supabase
        .from('fund_level')
        .select('*')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setFundLevelData(null);
          return;
        }
        throw error;
      }

      setFundLevelData(data);
    } catch (error) {
      console.error('Error fetching fund level data:', error);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('*')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setCompanyData(null);
          return;
        }
        throw error;
      }

      setCompanyData(data);
    } catch (error) {
      console.error('Error fetching investor data:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return '€' + new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatMillions = (value: number) => {
    return `€${Math.round(value / 1000000)}m`;
  };

  const getQuarterData = (period: Period): QuarterData | null => {
    if (!companyData) return null;
    
    const { year, quarter } = period;
    const paidCapital = companyData[`paid_capital_q${quarter}_${year}`] || 0;
    const nav = companyData[`nav_q${quarter}_${year}`] || 0;
    
    if (paidCapital === 0 && nav === 0) return null;
    
    return {
      quarter,
      year,
      paidCapital,
      nav,
      difference: nav - paidCapital
    };
  };

  const getAllQuartersData = (): ChartData[] => {
    if (!companyData) return [];
    
    const data: ChartData[] = [];
    
    // Start from oldest year (2021) to newest (2025)
    const sortedYears = [...years].reverse();
    
    sortedYears.forEach(year => {
      // For each year, go from Q1 to Q4 (or just Q1 for 2025)
      const availableQuarters = year === 2025 ? [1] : [1, 2, 3, 4];
      
      availableQuarters.forEach(quarter => {
        const paidCapital = companyData[`paid_capital_q${quarter}_${year}`] || 0;
        const nav = companyData[`nav_q${quarter}_${year}`] || 0;
        
        if (paidCapital > 0 || nav > 0) {
          data.push({
            name: `Q${quarter} ${year}`,
            paidCapital,
            nav
          });
        }
      });
    });
    
    return data;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const paidCapital = payload.find((p: any) => p.dataKey === 'paidCapital')?.value || 0;
      const nav = payload.find((p: any) => p.dataKey === 'nav')?.value || 0;
      const difference = nav - paidCapital;
      const isPositive = difference > 0;

      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="text-sm font-medium mb-1">{label}</p>
          <p className="text-sm text-[#0a2547]">
            Paid Capital: {formatCurrency(paidCapital)}
          </p>
          <p className="text-sm text-[#0a2547]">
            NAV: {formatCurrency(nav)}
          </p>
          <p className={`text-sm font-medium mt-1 ${
            isPositive ? 'text-[#76EEC6]' : 'text-red-600'
          }`}>
            Gains/(Losses): {formatCurrency(difference)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getValue = (prefix: string) => {
    if (!fundLevelData) return '0';
    const value = fundLevelData[`${prefix}_q${selectedPeriod.quarter}_${selectedPeriod.year}`] || 0;
    
    if (prefix === 'irr') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (['tvpi', 'moic'].includes(prefix)) {
      return `${Number(value).toFixed(1)}x`;
    }
    if (prefix === 'lp_count') {
      return value.toString();
    }
    if (['management_fee', 'opex'].includes(prefix)) {
      return formatCurrency(Math.abs(value));
    }
    return formatCurrency(value);
  };

  const quarterData = getQuarterData(selectedPeriod);
  const selectedQuarters = getSelectedQuarters();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#0a2547]">LP Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.full_name}</p>
            </div>
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="flex justify-end">
              <button
                onClick={signOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <FundSummary
            fundLevelData={fundLevelData}
            selectedPeriod={selectedPeriod}
            showPeriodSelector={showPeriodSelector}
            setShowPeriodSelector={setShowPeriodSelector}
            setSelectedPeriod={setSelectedPeriod}
            periodSelectorRef={periodSelectorRef}
            years={years}
            quarters={quarters}
            getValue={getValue}
          />

          {companyData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <BasicInfo
                  companyName={companyData.company_name}
                  companyNo={companyData.company_no}
                />
                <Commitment
                  totalCommitment={companyData.total_commitment}
                  formatCurrency={formatCurrency}
                />
                {quarterData && (
                  <QuarterPerformance
                    quarterData={quarterData}
                    formatCurrency={formatCurrency}
                  />
                )}
              </div>

              <AccountDetails
                quarterOptions={quarterOptions}
                selectedQuarters={selectedQuarters}
                showQuarterSelector={showQuarterSelector}
                setShowQuarterSelector={setShowQuarterSelector}
                toggleQuarterSelection={toggleQuarterSelection}
                quarterSelectorRef={quarterSelectorRef}
                companyData={companyData}
                formatCurrency={formatCurrency}
              />

              <FinancialOverview
                data={getAllQuartersData()}
                formatMillions={formatMillions}
                CustomTooltip={CustomTooltip}
              />

              <PortfolioOverview
                portfolioData={portfolioData}
                formatCurrency={formatCurrency}
              />
            </>
          ) : (
            <NoInvestor />
          )}

          <UsefulLinks links={usefulLinks} />
        </div>
      </main>
    </div>
  );
}
