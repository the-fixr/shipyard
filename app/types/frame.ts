// types/frame.ts
export interface FrameContext {
    user: {
      fid: number;
      username: string;
      displayName: string;
      pfpUrl: string;
      location: {
        placeId: string;
        description: string;
      };
    };
    client: {
      clientFid: number;
      added: boolean;
    };
  }

  export interface FrameSDK {
    context: Promise<FrameContext>;
    actions: {
      ready: () => void;
      openUrl: (url: string) => void;
      close: () => void;
      viewCast: (params: { hash: string; authorUsername?: string; close?: boolean }) => void;
      viewProfile: (params: { fid: number }) => void;
      openMiniApp: (params: { url: string }) => void;
      addMiniApp: () => Promise<void>;
      signMessage: (params: { message: string }) => Promise<{ signature: string }>;
    };
    wallet: {
      ethProvider: EIP1193Provider;
    };
  }

  // EIP-1193 Provider interface
  export interface EIP1193Provider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  }

  declare global {
    interface Window {
      frame: {
        sdk: FrameSDK;
      };
      ethereum?: EIP1193Provider;
    }
  }