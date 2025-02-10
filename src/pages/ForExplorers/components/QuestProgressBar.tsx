interface QuestProgressBarProps {
  current: number;
  total: number;
}

export const QuestProgressBar = ({ current, total }: QuestProgressBarProps) => {
  const percentage = (current / total) * 100;
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-violet-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm whitespace-nowrap">
        {current} / {total}
      </span>
    </div>
  );
};