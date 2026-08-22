import { describe, expect, it } from "vitest";

import { fiscalProviderReadiness } from "../shared/fiscal-provider";

describe("preparación de proveedor fiscal", () => {
  it("no presenta como verificada una ficha incompleta", () => {
    expect(fiscalProviderReadiness({ name: "", rif: "", authorizationReference: "", verificationStatus: "NO_CONFIGURADO", verifiedAt: null }).status).toBe("NO_CONFIGURADO");
    expect(fiscalProviderReadiness({ name: "Proveedor", rif: "J-12345678-9", authorizationReference: "", verificationStatus: "VERIFICADO", verifiedAt: null }).status).toBe("PENDIENTE");
  });
});
