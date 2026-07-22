import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import multer from "multer";
import { env } from "./config/env";
import { UPLOAD_ROOT, ensureUploadDirs } from "./lib/uploads";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { templatesRouter } from "./routes/templates";

export function createApp() {
  ensureUploadDirs();

  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(UPLOAD_ROOT));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/templates", templatesRouter);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ message: "Image must be 5MB or smaller" });
          return;
        }
        res.status(400).json({ message: err.message });
        return;
      }

      if (err.message?.includes("Only PNG")) {
        res.status(400).json({ message: err.message });
        return;
      }

      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  );

  return app;
}
