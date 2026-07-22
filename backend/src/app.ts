import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  );

  return app;
}
