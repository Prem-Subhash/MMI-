export function validateStage(
  mandatoryFields: string[],
  metadata: Record<string, any>
) {
  const missing = mandatoryFields.filter(
    field =>
      metadata[field] === undefined ||
      metadata[field] === null ||
      metadata[field] === ''
  )

  return {
    valid: missing.length === 0,
    missing,
  }
}
