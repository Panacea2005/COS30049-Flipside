declare const puter: {
    ai: {
      chat: (message: string) => Promise<string>;
      txt2img: (prompt: string) => Promise<HTMLImageElement>;
    };
    print: (message: string) => void;
  };