import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("superficie de sincronización", () => {
  it("retira las rutas públicas efímeras de POS y pedidos del router", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(source).toContain("sync: router");
    expect(source).toContain("protectedProcedure.input(snapshotInput)");
    expect(source).toContain("CONFLICT");
    expect(source).not.toContain("pos: router");
    expect(source).not.toContain("orders: router");
  });
});
