import dotenv from "dotenv";

dotenv.config();

export const easykashConfig = {
  apiUrl: process.env.EASYKASH_API_URL,
  apiKey: process.env.EASYKASH_API_KEY,
  hmacSecret: process.env.EASYKASH_HMAC_SECRET,
  callbackUrl: process.env.EASYKASH_CALLBACK_URL,
  enabled: process.env.EASYKASH_ENABLED,
  /** Local/dev only. Never set true in production deployments. */
  allowInsecureCallbacks:
    process.env.PAYMENT_ALLOW_INSECURE_CALLBACKS === "true",
};

// Validate configuration
export function validateEasyKashConfig(): boolean {
  if (!easykashConfig.enabled) {
    return false;
  }

  const required = ["apiKey", "hmacSecret"];
  const missing = required.filter(
    (key) => !easykashConfig[key as keyof typeof easykashConfig]
  );

  if (missing.length > 0) {
    if (
      missing.includes("hmacSecret") &&
      easykashConfig.allowInsecureCallbacks
    ) {
      console.warn(
        "⚠️  EasyKash HMAC secret missing but PAYMENT_ALLOW_INSECURE_CALLBACKS=true"
      );
      return missing.filter((k) => k !== "hmacSecret").length === 0;
    }
    console.warn(
      `⚠️  EasyKash configuration incomplete. Missing: ${missing.join(", ")}`
    );
    return false;
  }

  return true;
}

// Log configuration status on load
if (easykashConfig.enabled) {
  if (validateEasyKashConfig()) {
    console.log("✅ EasyKash payment gateway configured");
  } else {
    console.warn(
      "⚠️  EasyKash payment gateway enabled but not properly configured"
    );
  }
} else {
  console.log("ℹ️  EasyKash payment gateway disabled");
}
