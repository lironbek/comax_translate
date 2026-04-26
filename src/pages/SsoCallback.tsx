import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SSO_SHARED_SECRET = import.meta.env.VITE_SSO_SHARED_SECRET || "";

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return atob(base64);
}

async function verifyHmacSignature(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign("HMAC", key, data);

  let sigB64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
  while (sigB64.length % 4) sigB64 += "=";
  const receivedSig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
  const expectedSig = new Uint8Array(signature);

  if (receivedSig.length !== expectedSig.length) return false;
  return receivedSig.every((b, i) => b === expectedSig[i]);
}

export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginFromSso } = useAuth();
  const [status, setStatus] = useState<"validating" | "success" | "error">("validating");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("Missing SSO token");
      return;
    }

    (async () => {
      try {
        // 1. Split JWT
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token format");
        const [headerB64, payloadB64, signatureB64] = parts;

        // 2. Verify HMAC-SHA256 signature
        const valid = await verifyHmacSignature(headerB64, payloadB64, signatureB64, SSO_SHARED_SECRET);
        if (!valid) throw new Error("Invalid signature");

        // 3. Decode payload
        const payload = JSON.parse(base64UrlDecode(payloadB64));

        // 4. Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp < now) throw new Error("Token expired");

        // 5. Check issuer
        if (payload.iss !== "comax-connect-hub") throw new Error("Invalid issuer");

        // 6. Check email exists
        const email = payload.email;
        if (!email) throw new Error("Missing email in token");

        // 7. Find user by email in local DB
        const { data: localUser, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .eq("is_active", true)
          .maybeSingle();

        if (dbError) throw new Error("Database error");
        if (!localUser) throw new Error("User not found in this system");

        // 8. Update last_login
        await supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", localUser.id);

        // 9. Create local session
        loginFromSso({
          id: localUser.id,
          username: localUser.username,
          displayName: localUser.display_name || localUser.username,
          role: localUser.role,
          email: localUser.email || undefined,
        });

        setStatus("success");
        setTimeout(() => {
          navigate("/localization", { replace: true });
        }, 1000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "SSO failed";
        console.error("[SSO] Error:", msg);
        setStatus("error");
        setErrorMsg(msg);
      }
    })();
  }, [searchParams, loginFromSso, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center space-y-4">
        {status === "validating" && (
          <>
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 text-sm">מתחבר באמצעות SSO...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">התחברת בהצלחה! מעביר...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700 underline">
              חזור לדף ההתחברות
            </a>
          </>
        )}
      </div>
    </div>
  );
}
