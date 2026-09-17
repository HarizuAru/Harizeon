import time
import unittest

from heartbeat import Heartbeat


class HeartbeatTests(unittest.TestCase):
    def test_beats_immediately_and_repeatedly(self):
        calls = []
        with Heartbeat(lambda: calls.append(1), 0.01):
            time.sleep(0.06)
        self.assertGreaterEqual(len(calls), 2)

    def test_stops_after_exit(self):
        calls = []
        with Heartbeat(lambda: calls.append(1), 0.01):
            time.sleep(0.02)
        settled = len(calls)
        time.sleep(0.05)
        self.assertEqual(len(calls), settled, "no beats after the context exits")

    def test_failing_beat_does_not_raise(self):
        def boom():
            raise RuntimeError("redis down")

        with Heartbeat(boom, 0.01):
            time.sleep(0.03)
        # reaching here without raising is the assertion


if __name__ == "__main__":
    unittest.main()
