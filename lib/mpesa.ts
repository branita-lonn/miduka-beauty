// lib/mpesa.ts
// Utility wrapper for M-Pesa Daraja API (STK Push)

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  env: "sandbox" | "production";
}

const config: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY ?? "",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? "",
  passkey: process.env.MPESA_PASSKEY ?? "",
  shortcode: process.env.MPESA_SHORTCODE ?? "",
  env: (process.env.MPESA_ENV as "sandbox" | "production") ?? "sandbox",
};

const getBaseUrl = () => {
  return config.env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
};

// 1. Generate Access Token
export async function getMpesaToken(): Promise<string> {
  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("M-Pesa Auth Error:", errText);
    throw new Error("Failed to authenticate with M-Pesa");
  }

  const data = await response.json();
  return data.access_token;
}

// 2. Initiate STK Push
interface StkPushParams {
  phoneNumber: string; // e.g. 254712345678
  amount: number;
  accountReference: string; // usually the Order ID
  transactionDesc: string;
}

export async function initiateStkPush({ phoneNumber, amount, accountReference, transactionDesc }: StkPushParams) {
  const token = await getMpesaToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");

  const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;
  
  // Use MPESA_CALLBACK_URL if provided, otherwise fall back to NEXTAUTH_URL
  const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/webhooks/mpesa`;

  const payload = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", // or "CustomerBuyGoodsOnline" for Till numbers
    Amount: Math.ceil(amount), // M-Pesa requires integer amounts
    PartyA: phoneNumber,
    PartyB: config.shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("M-Pesa STK Push Error:", data);
    throw new Error(data.errorMessage || "Failed to initiate STK Push");
  }

  // Expecting { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription, CustomerMessage }
  return data;
}

// Helper to format phone number to 254 format
export function formatPhoneNumber(phone: string): string {
  // Remove non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  
  return cleaned;
}
