import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export type DecodedUser = { role: 'ADMIN' | 'USER'; [k: string]: any };

type Handler<TCtx = any> = (req: NextRequest, ctx: TCtx, user: DecodedUser) => Promise<NextResponse> | NextResponse;

export const withAuth = <TCtx = any>(handler: Handler<TCtx>) => {
  return async (req: NextRequest, ctx: TCtx) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token) as DecodedUser;
      return handler(req, ctx, decoded);
    } catch (err: any) {
      const isExpired = err?.message === 'Token sudah kedaluwarsa';
      const isInvalid = err?.message === 'Token tidak valid';
      const msg = isExpired || isInvalid ? `Unauthorized: ${err.message}` : 'Unauthorized: Invalid token';
      return NextResponse.json({ message: msg }, { status: 401 });
    }
  };
};
