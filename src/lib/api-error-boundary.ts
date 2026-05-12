import { NextResponse } from 'next/server';
import { PaywallError } from './paywall-error';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

export function withPaywallErrorBoundary(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof PaywallError) {
        return NextResponse.json(e.toJSON(), { status: 402 });
      }
      throw e;
    }
  };
}
