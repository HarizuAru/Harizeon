"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-white text-black font-mono p-4">
        <div className="border border-black p-6 max-w-md">
          <h2 className="text-base font-bold uppercase mb-2">Application Error</h2>
          <p className="text-xs mb-4">An unexpected system error occurred.</p>
          <button
            onClick={() => reset()}
            className="border border-black px-4 py-2 text-xs uppercase hover:bg-black hover:text-white"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
