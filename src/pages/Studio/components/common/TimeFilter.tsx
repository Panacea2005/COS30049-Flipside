import { useState } from 'react';

interface TimeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const getYears = (startYear: number) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
};

const months = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

export const TimeFilter = ({ onChange }: TimeFilterProps) => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  const years = getYears(2000); // Adjust the start year as needed

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = event.target.value;
    setSelectedYear(year);
    if (year === 'all') {
      onChange('all-time');
    } else {
      onChange(year);
    }
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const month = event.target.value;
    setSelectedMonth(month);
    if (month === 'all') {
      onChange(`${selectedYear}`);
    } else {
      onChange(`${selectedYear}-${month}`);
    }
  };

  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const day = event.target.value;
    setSelectedDay(day);
    if (day === 'all') {
      onChange(`${selectedYear}-${selectedMonth}`);
    } else {
      onChange(`${selectedYear}-${selectedMonth}-${day}`);
    }
  };

  return (
    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
      <select
        value={selectedYear}
        onChange={handleYearChange}
        className="px-4 py-2 rounded-md transition-colors bg-white text-gray-900 shadow-sm"
      >
        <option value="">Select Year</option>
        <option value="all">All</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      {selectedYear && selectedYear !== 'all' && (
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="px-4 py-2 rounded-md transition-colors bg-white text-gray-900 shadow-sm"
        >
          <option value="">Select Month</option>
          <option value="all">All</option>
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      )}

      {selectedYear && selectedMonth && selectedMonth !== 'all' && (
        <select
          value={selectedDay}
          onChange={handleDayChange}
          className="px-4 py-2 rounded-md transition-colors bg-white text-gray-900 shadow-sm"
        >
          <option value="">Select Day</option>
          <option value="all">All</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={String(day).padStart(2, '0')}>
              {day}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};