import fs from "node:fs";
import path from "node:path";

import type { APIRequestContext, Page } from "@playwright/test";

const backendPort = process.env.BACKEND_PORT ?? "8000";
const frontendPort = process.env.FRONTEND_PORT ?? "3000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://127.0.0.1:${backendPort}/api/v1`;
export const FRONTEND_BASE_URL = `http://127.0.0.1:${frontendPort}`;
export const AUTH_ARTIFACT_DIR = path.resolve(process.cwd(), "test-results/.auth");
export const AUTH_STATE_PATH = path.join(AUTH_ARTIFACT_DIR, "storage-state.json");
export const AUTH_SESSION_PATH = path.join(AUTH_ARTIFACT_DIR, "session.json");

export type TestSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  user: {
    created_at: string;
    email: string;
    full_name: string;
    id: number;
    is_active: boolean;
    preferred_currency: string;
    updated_at: string;
  };
};

type SubscriptionSeed = {
  amount: string;
  cadence?: string;
  category_id?: number;
  currency?: string;
  description?: string;
  name: string;
  next_charge_date?: string;
  notes?: string;
  payment_method_id?: number;
  start_date: string;
  status?: string;
  vendor?: string;
  website_url?: string;
};

export function uniqueEmail(prefix = "playwright") {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export function uniqueLabel(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function registerTestUser(
  request: APIRequestContext,
  {
    email = uniqueEmail(),
    fullName = "Playwright User",
    password = "super-secret",
  }: {
    email?: string;
    fullName?: string;
    password?: string;
  } = {},
) {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: {
      email,
      full_name: fullName,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to register ${email}: ${response.status()} ${await response.text()}`);
  }

  const session = (await response.json()) as TestSession;
  return { email, password, session };
}

export async function seedSession(page: Page, session: TestSession) {
  await page.addInitScript(
    (nextSession) => {
      (window as typeof window & { __MYSUBSCRIPTION_TEST_SESSION__?: TestSession })
        .__MYSUBSCRIPTION_TEST_SESSION__ = nextSession;
    },
    session,
  );

  if (page.url().startsWith(FRONTEND_BASE_URL)) {
    await page.evaluate((nextSession) => {
      (window as typeof window & { __MYSUBSCRIPTION_TEST_SESSION__?: TestSession })
        .__MYSUBSCRIPTION_TEST_SESSION__ = nextSession;
    }, session);
  }
}

export function ensureAuthArtifactDir() {
  fs.mkdirSync(AUTH_ARTIFACT_DIR, { recursive: true });
}

export function saveSessionArtifact(session: TestSession) {
  ensureAuthArtifactDir();
  fs.writeFileSync(AUTH_SESSION_PATH, JSON.stringify(session, null, 2));
}

export function readSavedSession() {
  return JSON.parse(fs.readFileSync(AUTH_SESSION_PATH, "utf8")) as TestSession;
}

export function buildAuthHeaders(session = readSavedSession()) {
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function resetWorkspace(
  request: APIRequestContext,
  session = readSavedSession(),
) {
  const response = await request.delete(`${API_BASE_URL}/auth/me/data`, {
    headers: buildAuthHeaders(session),
  });

  if (response.status() !== 204) {
    throw new Error(`Failed to reset workspace: ${response.status()} ${await response.text()}`);
  }
}

export async function createCategory(
  request: APIRequestContext,
  name: string,
  session = readSavedSession(),
) {
  const response = await request.post(`${API_BASE_URL}/categories`, {
    data: {
      description: `${name} services`,
      name,
    },
    headers: buildAuthHeaders(session),
  });

  if (!response.ok()) {
    throw new Error(`Failed to create category ${name}: ${response.status()} ${await response.text()}`);
  }

  const payload = (await response.json()) as { id: number };
  return payload.id;
}

export async function createPaymentMethod(
  request: APIRequestContext,
  label: string,
  session = readSavedSession(),
) {
  const response = await request.post(`${API_BASE_URL}/payment-methods`, {
    data: {
      is_default: true,
      label,
      last4: "4242",
      provider: "Visa",
    },
    headers: buildAuthHeaders(session),
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create payment method ${label}: ${response.status()} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as { id: number };
  return payload.id;
}

export async function createSubscription(
  request: APIRequestContext,
  payload: SubscriptionSeed,
  session = readSavedSession(),
) {
  const response = await request.post(`${API_BASE_URL}/subscriptions`, {
    data: {
      auto_renew: true,
      cadence: "monthly",
      currency: "USD",
      status: "active",
      vendor: payload.name,
      ...payload,
    },
    headers: buildAuthHeaders(session),
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create subscription ${payload.name}: ${response.status()} ${await response.text()}`,
    );
  }

  return response.json();
}

export function buildCsvStatement(vendor: string, amount: string) {
  return [
    "Posting Date,Details,Amount",
    `01/01/2026,${vendor},-${amount}`,
    `02/01/2026,${vendor},-${amount}`,
    `03/01/2026,${vendor},-${amount}`,
  ].join("\n");
}

export function buildRollingCsvStatement(vendor: string, amount: string) {
  const rows = ["Posting Date,Details,Amount"];
  const today = new Date();

  for (const monthOffset of [2, 1, 0]) {
    const postedAt = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const month = `${postedAt.getMonth() + 1}`.padStart(2, "0");
    const day = `${postedAt.getDate()}`.padStart(2, "0");
    rows.push(`${month}/${day}/${postedAt.getFullYear()},${vendor},-${amount}`);
  }

  return rows.join("\n");
}

export async function uploadCsvStatement(
  request: APIRequestContext,
  {
    amount,
    fileName = "statement.csv",
    vendor,
  }: {
    amount: string;
    fileName?: string;
    vendor: string;
  },
  session = readSavedSession(),
) {
  const response = await request.post(`${API_BASE_URL}/uploads`, {
    headers: buildAuthHeaders(session),
    multipart: {
      file: {
        buffer: Buffer.from(buildRollingCsvStatement(vendor, amount)),
        mimeType: "text/csv",
        name: fileName,
      },
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to upload CSV statement ${fileName}: ${response.status()} ${await response.text()}`,
    );
  }

  const upload = (await response.json()) as { id: number; status: string };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const statusResponse = await request.get(`${API_BASE_URL}/uploads/${upload.id}/status`, {
      headers: buildAuthHeaders(session),
    });

    if (!statusResponse.ok()) {
      throw new Error(
        `Failed to read upload status ${upload.id}: ${statusResponse.status()} ${await statusResponse.text()}`,
      );
    }

    const statusPayload = (await statusResponse.json()) as { status: string };
    if (statusPayload.status === "completed") {
      return statusPayload;
    }
    if (statusPayload.status === "failed") {
      throw new Error(`Upload ${upload.id} failed during processing`);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Upload ${upload.id} did not complete before timeout`);
}

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function buildPdfStatement(lines: string[]) {
  const stream =
    "BT\n/F1 12 Tf\n72 720 Td\n" +
    lines
      .map((line, index) =>
        index === 0
          ? `(${escapePdfText(line)}) Tj`
          : `0 -18 Td (${escapePdfText(line)}) Tj`,
      )
      .join("\n") +
    "\nET\n";

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}endstream\nendobj\n`,
  ];

  let content = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(content, "latin1"));
    content += object;
  }

  const xrefOffset = Buffer.byteLength(content, "latin1");
  content += `xref\n0 ${objects.length + 1}\n`;
  content += "0000000000 65535 f \n";
  for (const offset of offsets) {
    content += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  content += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(content, "latin1");
}
