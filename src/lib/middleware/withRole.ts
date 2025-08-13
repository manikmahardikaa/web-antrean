import { NextRequest, NextResponse } from 'next/server';
import { withAuth, DecodedUser } from './withAuth';

type Handler<TCtx = any> = (req: NextRequest, ctx: TCtx, user: DecodedUser) => Promise<NextResponse> | NextResponse;

export const withRole = (role: 'ADMIN' | 'USER') => {
  return <TCtx = any>(handler: Handler<TCtx>) =>
    withAuth<TCtx>((req, ctx, user) => {
      if (!user || user.role !== role) {
        return NextResponse.json({ message: 'Forbidden: Access denied' }, { status: 403 });
      }
      return handler(req, ctx, user);
    });
};
