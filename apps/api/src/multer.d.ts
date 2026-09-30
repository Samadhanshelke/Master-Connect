declare module 'multer' {
  export function diskStorage(options: {
    destination: string;
    filename: (
      req: unknown,
      file: { originalname?: string },
      callback: (error: Error | null, filename: string) => void,
    ) => void;
  }): unknown;
}
