import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WalletSearchProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
}

export const WalletSearch = ({ onSearch, isLoading }: WalletSearchProps) => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address) {
      setError('Please enter a wallet address');
      return;
    }

    onSearch(address);
    setAddress(''); // Reset the input field
  };

  return (
    <Card className="w-full max-w-2xl bg-white/50 backdrop-blur-sm border-none shadow-lg">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Search wallet address..."
              className={cn(
                "w-full pl-10 pr-4 py-6 bg-transparent",
                "border-none focus-visible:ring-2 focus-visible:ring-black/50",
                "placeholder:text-gray-400 text-gray-900",
                "transition-all duration-200"
              )}
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "ml-2 px-6 py-6 bg-black hover:bg-gray-800",
              "text-white font-medium rounded-lg",
              "transition-all duration-200",
              "flex items-center gap-2"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
        {error && (
          <div className="absolute -bottom-6 left-0 right-0">
            <p className="text-sm text-red-500 mt-1.5 px-3">{error}</p>
          </div>
        )}
      </form>
    </Card>
  );
};

export default WalletSearch;