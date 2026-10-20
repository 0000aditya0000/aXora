import { applyVisit } from '../../server/redirect.ts';

export default function handler(req: { query?: { code?: string | string[] } }, res: { setHeader(name: string, value: string): void; statusCode: number; end(body?: string): void }) {
  const code = Array.isArray(req.query?.code) ? req.query.code[0] : req.query?.code;
  return applyVisit(req, res, code || '', 'scan');
}
