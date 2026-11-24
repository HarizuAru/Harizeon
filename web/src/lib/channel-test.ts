/**
 * Deliver a real test alert through POST /v1/channels/{id}/test for each
 * channel. Used by settings widgets so "Test" never fakes a dispatch: HTTP
 * errors and in-body delivery failures both surface as ok:false.
 */
export async function testChannels(
  ids: string[],
): Promise<Array<{ id: string; ok: boolean; message: string }>> {
  return Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`/api/v1/channels/${id}/test`, { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
          error?: { message?: string };
        };
        if (!res.ok) {
          return { id, ok: false, message: data.error?.message ?? `HTTP ${res.status}` };
        }
        return { id, ok: data.ok === true, message: data.message ?? "finished with no detail." };
      } catch {
        return { id, ok: false, message: "Cannot reach the API. Is it running?" };
      }
    }),
  );
}
