import type { Role } from "@prisma/client";
import type { Request } from "express";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthedRequest = Request & {
  user?: AuthUser;
};
