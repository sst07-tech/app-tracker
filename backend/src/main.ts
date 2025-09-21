import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config(); // load backend/.env before reading process.env

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
// import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Read comma-separated origins from env, e.g. "http://localhost:5173,https://*.amplifyapp.com"
  const allowed = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log("CORS allowed origins:", allowed);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl/postman/no-origin
      if (allowed.includes(origin)) return cb(null, true);
      // allow Amplify preview/prod by domain (optional)
      try {
        const hostname = new URL(origin).hostname;
        if (/\.amplifyapp\.com$/.test(hostname)) return cb(null, true);
      } catch {}
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    optionsSuccessStatus: 204,
  });

  // Global guard (uncomment if you want it global)
  // app.useGlobalGuards(new JwtAuthGuard());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
}
bootstrap();
