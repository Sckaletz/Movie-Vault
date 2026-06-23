import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");

if (!supabaseUrl) {
  console.warn("⚠️  SUPABASE_URL is not set. Auth will not work.");
}

const JWKS = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!JWKS || !supabaseUrl) {
    res.status(503).json({ error: "Authentication service unavailable" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
    });

    if (!payload.sub) {
      res.status(401).json({ error: "Invalid token: missing subject" });
      return;
    }

    req.userId = payload.sub;
    next();
  } catch (error) {
    console.error("JWT verification failed:", (error as Error).message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
