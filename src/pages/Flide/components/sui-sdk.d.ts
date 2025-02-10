declare module 'sui-sdk' {
    export class SuiWallet {
      connect(): Promise<void>;
      getAddress(): string;
    }
  }