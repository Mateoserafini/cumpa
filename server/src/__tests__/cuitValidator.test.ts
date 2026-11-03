import { describe, it, expect } from "vitest";
import { validateCuit } from "../utils/cuitValidator";

describe("CUIT Validator Unit Tests (Algoritmo Módulo 11)", () => {
  it("debe validar correctamente un CUIT válido de persona física (20-...)", () => {
    // 20-22222222-3 -> verificación: 2*5 + 0*4 + 2*3 + 2*2 + 2*7 + 2*6 + 2*5 + 2*4 + 2*3 + 2*2 = 10+0+6+4+14+12+10+8+6+4 = 74 % 11 = 8. 11 - 8 = 3. Válido.
    const result = validateCuit("20-22222222-3");
    expect(result.isValid).toBe(true);
    expect(result.cleanCuit).toBe("20222222223");
    expect(result.errorMessage).toBeUndefined();
  });

  it("debe validar correctamente un CUIT de empresa o institución jurídica (30-...)", () => {
    // 30-11111111-8
    // 3*5 + 0*4 + 1*3 + 1*2 + 1*7 + 1*6 + 1*5 + 1*4 + 1*3 + 1*2 = 15 + 0 + 3 + 2 + 7 + 6 + 5 + 4 + 3 + 2 = 47. 47 % 11 = 3. 11 - 3 = 8. Válido.
    const result = validateCuit("30111111118");
    expect(result.isValid).toBe(true);
    expect(result.cleanCuit).toBe("30111111118");
  });

  it("debe rechazar un CUIT con dígito verificador erróneo", () => {
    const result = validateCuit("20-22222222-9");
    expect(result.isValid).toBe(false);
    expect(result.errorMessage?.toLowerCase()).toContain("dígito verificador inválido");
  });

  it("debe rechazar un CUIT con longitud distinta de 11 dígitos", () => {
    const resultShort = validateCuit("20-12345");
    expect(resultShort.isValid).toBe(false);
    expect(resultShort.errorMessage).toContain("exactamente 11 dígitos");

    const resultLong = validateCuit("20-1234567890123");
    expect(resultLong.isValid).toBe(false);
    expect(resultLong.errorMessage).toContain("exactamente 11 dígitos");
  });

  it("debe rechazar prefijos no permitidos por la normativa argentina", () => {
    const result = validateCuit("45-12345678-9");
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain("no corresponde a un prefijo CUIT válido");
  });

  it("debe rechazar valores nulos, vacíos o no numéricos", () => {
    expect(validateCuit("").isValid).toBe(false);
    expect(validateCuit("abcdefghijk").isValid).toBe(false);
  });
});
