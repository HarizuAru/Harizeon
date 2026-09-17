"""Periodic liveness pings for a running scan.

Dependency-free (threading + time) and decoupled from Redis by taking a `beat`
callable, so it can be unit-tested without a queue or network.

Why a thread: a single heartbeat per phase is not enough. Discovery can take
longer than the reaper's stale window, which would make a live worker look dead
and get its scan requeued or timed out.
"""

import threading


class Heartbeat:
    def __init__(self, beat, every_seconds):
        self._beat = beat
        self._every = every_seconds
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)

    def _run(self):
        while not self._stop.wait(self._every):
            try:
                self._beat()
            except Exception:  # noqa: BLE001 - a failed ping must not kill the job
                pass

    def __enter__(self):
        try:
            self._beat()
        except Exception:  # noqa: BLE001 - a failed ping must not kill the job
            pass
        self._thread.start()
        return self

    def __exit__(self, *_exc):
        self._stop.set()
        self._thread.join(timeout=1)
        return False
