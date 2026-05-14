import crypto from "node:crypto";

/**
 * Verifies MercadoPago webhook signature using HMAC SHA256.
 *
 * MP sends `x-signature` header with format: `ts=<unix>,v1=<hex>`.
 * Manifest template: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`.
 * v1 must match HMAC-SHA256(secret, manifest).
 *
 * Reference: https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 */
export function verifyMPSignature(opts: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!opts.signatureHeader || !opts.requestId || !opts.secret) return false;

  let parts: Record<string, string>;
  try {
    parts = Object.fromEntries(
      opts.signatureHeader
        .split(",")
        .map((s) => s.trim().split("=") as [string, string])
    );
  } catch {
    return false;
  }

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${opts.dataId};request-id:${opts.requestId};ts:${ts};`;
  const computed = crypto
    .createHmac("sha256", opts.secret)
    .update(manifest)
    .digest("hex");

  if (v1.length !== computed.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(v1, "hex"),
      Buffer.from(computed, "hex")
    );
  } catch {
    return false;
  }
}
