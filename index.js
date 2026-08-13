import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./src/db/db.js";
import initDb from "./src/db/initDb.js";
import seedPermissions from "./src/db/seedPermissions.js";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/auth.routes.js";
import rbacRoutes from "./src/routes/rbac.routes.js";
import projectRoutes from "./src/routes/project.routes.js";
import taskRoutes from "./src/routes/task.routes.js";

dotenv.config({
    path: "./.env",
});

const app = express();

app.use(
  cors({
    methods: ["GET", "POST", "PUT", "DELETE"],
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
// app.use(helmet());
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rbac", rbacRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.get("/health" , (req , res)=>{
    res.send("Backend service is healthy")

})
const startServer = async () => {
    try {

        await pool.query("SELECT NOW()");
        console.log("Database connected successfully");
        await initDb();
        await seedPermissions();
        app.listen(process.env.PORT || 5000, () => {
            console.log(
                `Server is running on port ${process.env.PORT || 5000}`
            );
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();