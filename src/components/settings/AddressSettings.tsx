import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Check, Copy, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../../hooks/use-toast';

type SavedAddress = {
  id: string;
  address: string;
  chainId: number;
  label: string;
  isDefault: boolean;
  createdAt: string;
};

export const AddressSettings = () => {
  const { user, setUser } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeAddress, setActiveAddress] = useState<string | null>(
    user?.user_metadata?.active_address || null
  );
  const [newAddressForm, setNewAddressForm] = useState({
    address: '',
    chainId: 1, // Default to Ethereum mainnet
    label: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch saved addresses on component mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAddresses(data || []);
      } catch (error) {
        console.error('Error fetching addresses:', error);
        toast({ title: 'Failed to load addresses', status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Validate address format (basic check, can be replaced with more robust validation)
      if (!newAddressForm.address.startsWith('0x') || newAddressForm.address.length !== 42) {
        throw new Error('Invalid address format');
      }

      // Check if this is the first address to set as default
      const isDefault = addresses.length === 0;
      
      // Insert the new address
      const { data, error } = await supabase
        .from('user_addresses')
        .insert([
          {
            user_id: user?.id,
            address: newAddressForm.address,
            chain_id: newAddressForm.chainId,
            label: newAddressForm.label || `Address ${addresses.length + 1}`,
            is_default: isDefault,
          },
        ])
        .select();

      if (error) throw error;
      
      // If this is the first address, set it as active
      if (isDefault) {
        await setActiveWalletAddress(newAddressForm.address);
      }
      
      // Reset form and update UI
      setAddresses([...(data || []), ...addresses]);
      setNewAddressForm({ address: '', chainId: 1, label: '' });
      setShowAddForm(false);
      toast({ title: 'Address added successfully!', status: 'success' });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Error adding address', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setLoading(true);
      
      // Find the address to be deleted
      const addressToDelete = addresses.find(addr => addr.id === addressId);
      
      // Delete the address
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      
      // Update the local state
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      
      // If the deleted address was the active one, set another address as active
      if (addressToDelete?.address === activeAddress) {
        const defaultAddress = addresses.find(addr => addr.id !== addressId && addr.isDefault);
        const anyAddress = addresses.find(addr => addr.id !== addressId);
        
        if (defaultAddress) {
          await setActiveWalletAddress(defaultAddress.address);
        } else if (anyAddress) {
          await setActiveWalletAddress(anyAddress.address);
        } else {
          await setActiveWalletAddress(null);
        }
      }
      
      toast({ title: 'Address deleted successfully!', status: 'success' });
    } catch (error) {
      toast({ title: 'Error deleting address', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const setAddressAsDefault = async (addressId: string) => {
    try {
      setLoading(true);
      
      // Find the address to set as default
      const addressToDefault = addresses.find(addr => addr.id === addressId);
      if (!addressToDefault) throw new Error('Address not found');
      
      // Update all addresses to not be default
      const { error: resetError } = await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);
        
      if (resetError) throw resetError;
      
      // Set the selected address as default
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId);
        
      if (error) throw error;
      
      // Update local state
      setAddresses(
        addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId,
        }))
      );
      
      // Set as active wallet address
      await setActiveWalletAddress(addressToDefault.address);
      
      toast({ title: 'Default address updated successfully!', status: 'success' });
    } catch (error) {
      toast({ title: 'Error updating default address', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const setActiveWalletAddress = async (address: string | null) => {
    try {
      // Update user metadata with active address
      const { error, data: userData } = await supabase.auth.updateUser({
        data: { active_address: address }
      });

      if (error) throw error;
      
      // Update local state
      setActiveAddress(address);
      setUser(userData.user);
      
      return true;
    } catch (error) {
      console.error('Error setting active address:', error);
      return false;
    }
  };

  const copyAddressToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: 'Address copied to clipboard', status: 'success' });
  };

  const openBlockExplorer = (address: string, chainId: number) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/address/',
      56: 'https://bscscan.com/address/',
      137: 'https://polygonscan.com/address/',
      42161: 'https://arbiscan.io/address/',
      10: 'https://optimistic.etherscan.io/address/',
    };
    
    const baseUrl = explorers[chainId] || 'https://etherscan.io/address/';
    window.open(`${baseUrl}${address}`, '_blank');
  };

  // Get chain name from ID (basic implementation)
  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      56: 'BSC',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      // Add more as needed
    };
    return chains[chainId] || `Chain ID ${chainId}`;
  };

  // Get chain color from ID
  const getChainColor = (chainId: number) => {
    const chains: Record<number, string> = {
      1: 'bg-blue-100 text-blue-800',
      56: 'bg-yellow-100 text-yellow-800',
      137: 'bg-purple-100 text-purple-800',
      42161: 'bg-blue-100 text-blue-800',
      10: 'bg-red-100 text-red-800',
    };
    return chains[chainId] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 mt-16">
        <h1 className="text-3xl font-bold text-gray-800">Wallet Addresses</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-md flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Address
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Add New Address</h2>
          <form onSubmit={handleAddAddress} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
              <input
                type="text"
                value={newAddressForm.address}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                placeholder="0x..."
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label (Optional)</label>
              <input
                type="text"
                value={newAddressForm.label}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                placeholder="Main Wallet, Trading Wallet, etc."
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blockchain</label>
              <select
                value={newAddressForm.chainId}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, chainId: parseInt(e.target.value) })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 px-4 py-3"
              >
                <option value={1}>Ethereum</option>
                <option value={56}>BSC</option>
                <option value={137}>Polygon</option>
                <option value={42161}>Arbitrum</option>
                <option value={10}>Optimism</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {saving ? 'Adding...' : 'Add Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-100">
          <Wallet className="w-16 h-16 mx-auto text-violet-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">No Addresses Saved</h3>
          <p className="text-gray-600 mt-2 mb-6 max-w-md mx-auto">Add wallet addresses to quickly connect across the platform and enhance your experience</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-md"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-6 rounded-xl shadow-md transition-all ${
                address.address === activeAddress 
                  ? 'border-2 border-violet-500 bg-violet-50' 
                  : 'border border-gray-100 bg-white hover:border-violet-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{address.label}</h3>
                    {address.isDefault && (
                      <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                        Default
                      </span>
                    )}
                    {address.address === activeAddress && (
                      <span className="ml-2 px-3 py-1 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full mr-3 ${getChainColor(address.chainId)}`}>
                      {getChainName(address.chainId)}
                    </span>
                    <span className="text-gray-600 font-mono text-sm bg-gray-50 px-3 py-1 rounded-md">
                      {address.address.substring(0, 6)}...{address.address.substring(address.address.length - 4)}
                    </span>
                    <button 
                      onClick={() => copyAddressToClipboard(address.address)}
                      className="ml-2 p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                      title="Copy full address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openBlockExplorer(address.address, address.chainId)}
                      className="ml-1 p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                      title="View on block explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {address.address !== activeAddress && (
                    <button
                      onClick={() => setActiveWalletAddress(address.address)}
                      className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      title="Set as active"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  {!address.isDefault && (
                    <button
                      onClick={() => setAddressAsDefault(address.id)}
                      className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      title="Set as default"
                    >
                      <Wallet className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this address?')) {
                        handleDeleteAddress(address.id);
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete address"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};