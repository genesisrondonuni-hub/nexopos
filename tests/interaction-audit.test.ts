import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("auditoría de interacciones", () => {
  it("mantiene todos los accesos de configuración conectados a una acción", () => {
    const source = readFileSync(resolve(root, "app/(tabs)/settings.tsx"), "utf8");
    const rows = [...source.matchAll(/<SettingRow[\s\S]*?\/>/g)].map((match) => match[0]);
    expect(rows).toHaveLength(12);
    expect(rows.every((row) => row.includes("onPress="))).toBe(true);
    expect(source).not.toContain("onPress={() => undefined}");
  });

  it("conserva pantallas reales para los accesos administrativos y de soporte", () => {
    ["app/team-permissions.tsx", "app/billing.tsx", "app/help-center.tsx", "app/sales-analytics.tsx", "app/business-profile.tsx", "app/fiscal-settings.tsx", "app/sync-settings.tsx"].forEach((path) => expect(existsSync(resolve(root, path))).toBe(true));
    const layout = readFileSync(resolve(root, "app/_layout.tsx"), "utf8");
    ["team-permissions", "billing", "help-center", "fiscal-settings", "sync-settings"].forEach((route) => expect(layout).toContain(`name="${route}"`));
  });
});
