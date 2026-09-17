import unittest

from phases import PHASES, planned_phases, progress_for_phase, phase_message


class PlannedPhases(unittest.TestCase):
    def test_quick_is_passive_only(self):
        self.assertEqual(
            planned_phases("quick"),
            ["verify", "discover", "resolve", "normalize", "report"],
        )

    def test_standard_runs_all_phases(self):
        self.assertEqual(planned_phases("standard"), PHASES)

    def test_deep_runs_all_phases(self):
        self.assertEqual(planned_phases("deep"), PHASES)

    def test_unknown_profile_rejected(self):
        with self.assertRaises(ValueError):
            planned_phases("turbo")


class Progress(unittest.TestCase):
    def test_monotonic_and_bounded(self):
        prev = -1
        for phase in PHASES:
            value = progress_for_phase(phase)
            self.assertTrue(0 <= value <= 100, "%s => %s" % (phase, value))
            self.assertGreater(value, prev)
            prev = value
        self.assertGreaterEqual(progress_for_phase("report"), 90)


class Messages(unittest.TestCase):
    def test_message_names_phase_and_target(self):
        msg = phase_message("resolve", [{"value": "example.com"}])
        self.assertIn("resolve", msg)
        self.assertIn("example.com", msg)

    def test_message_tolerates_no_targets(self):
        self.assertIsInstance(phase_message("probe", []), str)

    def test_message_does_not_invent_findings(self):
        # W04 has no engines; the test/normalize lines must not claim findings.
        self.assertIn("no engine yet", phase_message("test", [{"value": "x"}]))
        self.assertIn("0 findings", phase_message("normalize", [{"value": "x"}]))


if __name__ == "__main__":
    unittest.main()
