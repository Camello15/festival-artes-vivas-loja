export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'RESERVE';
export type AuditEntity = 'Venue' | 'Artist' | 'Event' | 'Performance' | 'Reservation';

export interface AuditEntry {
  userId: number;
  action: AuditAction;
  entity: AuditEntity;
  entityId: number;
}

/** Writes only successful mutations and excludes request payloads and other sensitive data. */
export function logAudit(entry: AuditEntry) {
  try {
    console.info(JSON.stringify({ timestamp: new Date().toISOString(), ...entry }));
  } catch {
    // Logging must not turn an already committed business operation into an apparent failure.
  }
}
