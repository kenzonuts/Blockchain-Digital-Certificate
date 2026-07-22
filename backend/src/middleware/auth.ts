import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthUser, AuthedRequest } from "../types/auth";

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
  );
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;
  const cookieToken = req.cookies?.token as string | undefined;
  const token = bearer || cookieToken;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
