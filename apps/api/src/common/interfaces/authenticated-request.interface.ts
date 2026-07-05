import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  businessId: string;
  branchId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
