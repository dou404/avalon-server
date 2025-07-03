import { Router } from "express";
import { roleSets } from "../constants/RoleSet";

const httpRouter = Router();

httpRouter.get("/health", (req, res) => {
  res.json({ status: 200, timestamp: new Date() });
});

httpRouter.get("/role-sets", (req, res) => {
  if (!roleSets) {
    res.json({ status: 400, error: "Invalid number of players!" });
  }
  res.json({ status: 200, roleSet: roleSets });
});

httpRouter.get("/role-sets/:count", (req, res) => {
  const count = Number(req.params.count);
  if (count < 5 || count > 12) {
    res.json({ status: 400, error: "Invalid number of players!" });
  }
  res.json({ status: 200, roleSet: roleSets[count] });
});

httpRouter.get("/supported-counts", (req, res) => {
  res.json({ supported: Object.keys(roleSets).map(Number) });
});

export default httpRouter;
