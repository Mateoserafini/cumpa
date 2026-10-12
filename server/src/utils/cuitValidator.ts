/**
 * Validador algorítmico de CUIT argentino (Algoritmo Módulo 11 de AFIP)
 * Según decisión de arquitectura ADR-007.
 */

const VALID_PREFIXES = ["20", "23", "24", "27", "30", "33", "34"];
const MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export interface CuitValidationResult {
  isValid: boolean;
  cleanCuit: string;
  errorMessage?: string;
}

/**
 * Limpia y valida formalmente un CUIT argentino.
 * @param cuit Cadena de texto con o sin guiones (ej: "20-12345678-9" o "20123456789")
 */
export function validateCuit(cuit: string | undefined | null): CuitValidationResult {
  if (!cuit || typeof cuit !== "string") {
    return {
      isValid: false,
      cleanCuit: "",
      errorMessage: "El CUIT es obligatorio y debe ser una cadena de texto.",
    };
  }

  // Quitar espacios y guiones
  const cleanCuit = cuit.replace(/[\s-]/g, "");

  // Verificar que tenga exactamente 11 dígitos numéricos
  if (!/^\d{11}$/.test(cleanCuit)) {
    return {
      isValid: false,
      cleanCuit,
      errorMessage: "El CUIT debe contener exactamente 11 dígitos numéricos.",
    };
  }

  // Verificar prefijo de AFIP
  const prefix = cleanCuit.substring(0, 2);
  if (!VALID_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      cleanCuit,
      errorMessage: `El prefijo '${prefix}' no corresponde a un prefijo CUIT válido en Argentina.`,
    };
  }

  // Cálculo del dígito verificador mediante Módulo 11
  let accumulated = 0;
  for (let i = 0; i < 10; i++) {
    accumulated += parseInt(cleanCuit[i], 10) * MULTIPLIERS[i];
  }

  const remainder = accumulated % 11;
  let expectedVerifier = 11 - remainder;
  if (expectedVerifier === 11) expectedVerifier = 0;

  // Resultado 10: no existe dígito válido (AFIP reasigna otro prefijo), por lo tanto el CUIT es inválido.
  if (expectedVerifier === 10) {
    return {
      isValid: false,
      cleanCuit,
      errorMessage: "CUIT inválido: no existe dígito verificador para esta combinación.",
    };
  }

  const providedVerifier = parseInt(cleanCuit[10], 10);

  if (providedVerifier !== expectedVerifier) {
    return {
      isValid: false,
      cleanCuit,
      errorMessage: `Dígito verificador inválido para el CUIT ingresado (esperado: ${expectedVerifier}, recibido: ${providedVerifier}).`,
    };
  }

  return {
    isValid: true,
    cleanCuit,
  };
}

/**
 * Helper booleano simplificado para validaciones rápidas o custom validators
 */
export function isCuitValid(cuit: string | undefined | null): boolean {
  return validateCuit(cuit).isValid;
}
