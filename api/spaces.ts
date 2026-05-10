import { randomUUID } from "node:crypto";

import type { VercelRequest, VercelResponse } from "@vercel/node";

type CreateBody = { user_id?: string; name?: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const { putSpace } = await import("@foc/server");

  const body = req.body as CreateBody;
  const userId = body.user_id?.trim();
  const name = body.name?.trim();
  if (!userId || !name) {
    return res.status(422).json({ detail: "user_id and name are required" });
  }

  const id = randomUUID();
  putSpace(id, { userId, name, reportIds: [] });

  return res.status(200).json({ space_id: id });
}
