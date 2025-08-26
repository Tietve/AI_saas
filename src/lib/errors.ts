export class ValidationError extends Error {
    code = "VALIDATION_ERROR" as const;
    field?: string;
    constructor(message: string, field?: string) {
        super(message);
        this.field = field;
    }
}
export class ConflictError extends Error { code = "CONFLICT" as const; }
export class NotFoundError extends Error { code = "NOT_FOUND" as const; }
export class RateLimitError extends Error { code = "RATE_LIMITED" as const; }