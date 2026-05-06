import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase no configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

function getBucket(): string {
  return process.env.SUPABASE_BUCKET ?? "cdt-files";
}

export async function uploadFile(
  path: string,
  data: Buffer | Uint8Array,
  contentType: string,
): Promise<{ path: string }> {
  const { error } = await getClient()
    .storage.from(getBucket())
    .upload(path, data, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return { path };
}

export async function downloadFile(path: string): Promise<Buffer> {
  const { data, error } = await getClient().storage.from(getBucket()).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function getSignedUrl(path: string, expiresIn = 300): Promise<string> {
  const { data, error } = await getClient()
    .storage.from(getBucket())
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(`Signed URL failed: ${error?.message ?? "no data"}`);
  return data.signedUrl;
}

export async function removeFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await getClient().storage.from(getBucket()).remove(paths);
  if (error) throw new Error(`Storage remove failed: ${error.message}`);
}
