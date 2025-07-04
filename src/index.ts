import { Server, Socket } from "socket.io";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { registerSocketEvents } from "./routes/socket";
import httpRouter from "./routes/http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT;

app.use(
  cors({
    origin: process.env.WEB_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api", httpRouter);
app.get("/", (_, res) => {
  res.send("a v a l o n");
});

const io = new Server(server, {
  cors: { origin: "*" },
});
registerSocketEvents(io);

server.listen(port, () => {
  console.log(
    `✅ Avalon server is successfully running on ${process.env.SERVER_URL}`
  );
});
