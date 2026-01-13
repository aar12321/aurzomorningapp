// Deno global type declarations for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  [key: string]: any;
};

