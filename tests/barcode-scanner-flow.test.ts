import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("lector por cámara y lector físico", () => {
  it("mantiene un flujo de cámara protegido y una entrada enfocada para teclado", () => {
    const source = readFileSync(resolve(process.cwd(), "app/product-scanner.tsx"), "utf8");
    expect(source).toContain("useCameraPermissions");
    expect(source).toContain("requestPermission");
    expect(source).toContain("Linking.openSettings");
    expect(source).toContain("<CameraView");
    expect(source).toContain('"HARDWARE"');
    expect(source).toContain("autoFocus={isHardware}");
    expect(source).toContain("onSubmitEditing={() => finishScan(code)}");
    expect(source).toContain("barcodeTypes");
    expect(source).toContain("Permitir y activar cámara");
  });
});
