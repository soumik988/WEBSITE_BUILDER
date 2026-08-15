import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./liib/auth.js";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

export const app = express();
export default app;

const port = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://website-builder-eee5.vercel.app",
  ],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Better Auth
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json({ limit: "50mb" }));

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});

app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);

// Local development only
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}