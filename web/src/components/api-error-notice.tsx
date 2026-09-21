/**
 * A security console must never present fabricated data (§10.8): when the API
 * is unreachable, say so and show nothing rather than inventing tenants, keys,
 * findings or audit history. Server-safe (no client hooks).
 */
export function ApiErrorNotice({ message }: { message: string }) {
  return (
    <div className="border border-line bg-canvas p-3">
      <p className="font-mono text-xs font-bold text-ink">ERROR: {message}</p>
      <p className="mt-1 text-sm text-muted">
        Showing no data rather than invented data. Start the API and reload.
      </p>
    </div>
  );
}
