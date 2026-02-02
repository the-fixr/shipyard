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
    };
  }
  
  declare global {
    interface Window {
      frame: {
        sdk: FrameSDK;
      };
    }
  }