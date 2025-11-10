export interface PIIPattern {
  type: PIIType;
  regex: RegExp;
  replacement: string;
}

export enum PIIType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  IP_ADDRESS = 'ip_address',
  URL = 'url',
}

export interface RedactionResult {
  redactedText: string;
  piiFound: PIIType[];
  redactionMap: Record<string, string>; // placeholder -> original value
  originalText: string;
}

export interface PIIConfig {
  enabledTypes: PIIType[];
  customPatterns?: PIIPattern[];
}
