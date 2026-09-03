import "dotenv/config";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import * as dns from "dns";
import path from "path";

import connectDB from "./src/db/db.js";
import userRoutes from "./src/routes/user-routes/user-routes.js";


// =========================
// DNS CONFIGURATION
// =========================

dns.setDefaultResultOrder("ipv4first");

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);


// =========================
// SERVER CONFIGURATION
// =========================

const port = 2707;

const server = express();


// =========================
// TRUST PROXY
// =========================

server.set("trust proxy", 1);


// =========================
// MIDDLEWARE
// =========================

server.use(cors());

server.use(morgan("dev"));

server.use(express.json());

server.use(
    express.urlencoded({
        extended: true
    })
);


// =========================
// UPLOADS FOLDER
// =========================

server.use(
    "/uploads",
    express.static(
        path.join(
            process.cwd(),
            "uploads"
        )
    )
);


// =========================
// USER ROUTES
// =========================

server.use(userRoutes);


// =========================
// MULTER / GLOBAL ERROR
// =========================

server.use(
    (error, req, res, next) => {

        console.log(
            "Upload Error:",
            error.message
        );


        // FILE SIZE

        if (
            error.code === "LIMIT_FILE_SIZE"
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "File too large! Maximum size is 5 MB."

            });

        }


        // FILE TYPE

        if (
            error.message &&
            error.message.includes("Invalid file")
        ) {

            return res.status(400).send({

                status: false,

                message:
                    error.message

            });

        }


        // GENERAL ERROR

        return res.status(500).send({

            status: false,

            message:
                "Internal server error!"

        });

    }
);


// =========================
// DATABASE CONNECTION
// =========================

connectDB()
    .then(() => {

        console.log(
            "Database connected successfully"
        );


        // =========================
        // START SERVER
        // =========================

        server.listen(
            port,
            () => {

                console.log(
                    `Your Node JS server is running on port ${port}`
                );

            }
        );

    })
    .catch((error) => {

        console.error(
            "Database connection failed:",
            error.message
        );

    });