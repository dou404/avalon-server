import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { registerSocketEvents } from "./routes/socket";
import httpRouter from "./routes/http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
app.use(
  cors({
    origin: process.env.WEB_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api", httpRouter);

const io = new Server(server, {
  cors: { origin: "*" },
});

const port = process.env.PORT || 3001;

io.on("connection", (socket) => {
  registerSocketEvents(io, socket);
  console.log("Connected: ", socket.id);
});

server.listen(port, () => {
  console.log(
    `✅ Avalon server is successfully running on ${process.env.SERVER_URL}`
  );
});
