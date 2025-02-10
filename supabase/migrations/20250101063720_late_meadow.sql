/*
  # Wallet Transaction System Schema

  1. New Tables
    - `wallets`
      - `address` (text, primary key) - Wallet address
      - `balance` (numeric) - Current wallet balance
      - `first_seen` (timestamptz) - First transaction timestamp
      - `last_seen` (timestamptz) - Last transaction timestamp
      
    - `transactions`
      - `hash` (text, primary key) - Transaction hash
      - `from_address` (text, references wallets) - Sender address
      - `to_address` (text, references wallets) - Receiver address
      - `value` (numeric) - Transaction amount
      - `gas_used` (numeric) - Gas used
      - `gas_price` (numeric) - Gas price
      - `timestamp` (timestamptz) - Transaction timestamp
      - `block_number` (bigint) - Block number
      - `status` (text) - Transaction status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  address text PRIMARY KEY,
  balance numeric NOT NULL DEFAULT 0,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  hash text PRIMARY KEY,
  from_address text REFERENCES wallets(address),
  to_address text REFERENCES wallets(address),
  value numeric NOT NULL DEFAULT 0,
  gas_used numeric,
  gas_price numeric,
  timestamp timestamptz NOT NULL DEFAULT now(),
  block_number bigint,
  status text DEFAULT 'pending',
  
  CONSTRAINT valid_addresses CHECK (from_address != to_address)
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Wallets are viewable by authenticated users" ON wallets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Transactions are viewable by authenticated users" ON transactions
  FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);