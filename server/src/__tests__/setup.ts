import "./mockDb";
import { resetMockDb } from "./mockDb";
import { loginRateLimiter } from "../middlewares/rateLimiter.middleware";
import { beforeEach } from "vitest";

beforeEach(() => {
  resetMockDb();
  loginRateLimiter.reset();
});
