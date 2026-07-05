export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 50,
  maxLimit: 200,
};

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'CONVERTED',
  'LOST',
] as const;

export const AI_INTENTS = [
  'GREETING',
  'BOOK_APPOINTMENT',
  'CHECK_AVAILABILITY',
  'RESCHEDULE',
  'CANCEL',
  'QUESTION',
  'PRICE_INQUIRY',
  'SERVICE_INFO',
  'COMPLAINT',
  'FAREWELL',
  'UNKNOWN',
] as const;
