
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export type ImageModel = 'gemini-3-pro-image-preview';

export interface ImageModelOption {
  id: ImageModel;
  label: string;
  description: string;
  icon?: string;
}

export const IMAGE_MODELS: ImageModelOption[] = [
  {
    id: 'gemini-3-pro-image-preview',
    label: 'Gemini 3 Pro',
    description: 'High quality, balanced'
  }
];

export type ImageStatus = 'pending' | 'success' | 'error';

export interface GeneratedImage {
  id: string;
  url?: string;
  prompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
  status: ImageStatus;
  errorMessage?: string;
}

export interface GenerationParams {
  prompt: string;
  aspectRatio: AspectRatio;
  model?: ImageModel;
  referenceImages?: string[]; // Array of base64 strings
}

declare global {
  /**
   * Defines the AIStudio interface to match the environment's expected type.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * Declares the aistudio property on the global Window object.
     * Modified with 'readonly' to match the system-level declaration and fix the modifier mismatch error.
     */
    readonly aistudio: AIStudio;
  }
}
