type SpaceRow = { userId: string; name: string; reportIds: string[] };

type Bucket = {
  reports: Map<string, Record<string, unknown>>;
  calcs: Map<string, { status: string; createdAt: string }>;
  spaces: Map<string, SpaceRow>;
};

const GK = "__foc_memory_store__";

function bucket(): Bucket {
  const g = globalThis as unknown as Record<string, Bucket | undefined>;
  if (!g[GK]) {
    g[GK] = {
      reports: new Map(),
      calcs: new Map(),
      spaces: new Map(),
    };
  }
  return g[GK]!;
}

export function putReport(id: string, payload: Record<string, unknown>): void {
  bucket().reports.set(id, payload);
}

export function getReport(id: string): Record<string, unknown> | undefined {
  return bucket().reports.get(id);
}

export function putCalculation(id: string, status: string, createdAt: string): void {
  bucket().calcs.set(id, { status, createdAt });
}

export function putSpace(id: string, row: SpaceRow): void {
  bucket().spaces.set(id, row);
}

export function getSpace(id: string): SpaceRow | undefined {
  return bucket().spaces.get(id);
}

export function attachReportToSpace(spaceId: string, reportId: string): boolean {
  const sp = bucket().spaces.get(spaceId);
  if (!sp) return false;
  if (!sp.reportIds.includes(reportId)) sp.reportIds.push(reportId);
  return true;
}
