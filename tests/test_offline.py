"""Offline use: the service worker serves the page and what was opened, and "Save for offline use" fills the rest."""
import unittest
import test_sanctuary as acceptance


class OfflineTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def controlled(self):
        # Browsers under automation register the worker only when asked (lect-sw); the first load installs it and
        # the reload is the first one it controls.
        self.page.add_init_script("localStorage.setItem('lect-sw','1')")
        self.open()
        self.page.wait_for_function("navigator.serviceWorker&&navigator.serviceWorker.ready.then(()=>true)")
        self.page.reload(); self.page.wait_for_load_state('networkidle')
        self.page.wait_for_function("!!navigator.serviceWorker.controller")

    def session(self, spec, needle):
        self.page.evaluate(f"LectApp.follow({spec})")
        self.page.locator('.dayname').first.wait_for()
        self.page.wait_for_function("t=>document.body.innerText.includes(t)", arg=needle, timeout=15000)

    def test_opened_service_works_offline(self):
        self.controlled()
        self.session("{type:'mass',rite:'n',iso:'2026-10-25'}", 'Exod 22:20-26')
        self.context.set_offline(True)
        self.page.reload(); self.page.wait_for_load_state('domcontentloaded')
        self.session("{type:'mass',rite:'n',iso:'2026-10-25'}", 'Exod 22:20-26')
        self.assertIn('widow', self.page.locator('body').inner_text())   # the reading's text, from the cached Bible
        self.context.set_offline(False)

    def test_save_for_offline_use_fills_the_cache(self):
        self.controlled()
        done = self.page.evaluate("LectOffline.save()")
        self.assertTrue(done['finished']); self.assertEqual(done['failed'], 0); self.assertGreater(done['total'], 50)
        self.context.set_offline(True)
        self.page.reload(); self.page.wait_for_load_state('domcontentloaded')
        # A rite never opened before this test, on a date in another year's file.
        self.session("{type:'mass',rite:'bcp62',iso:'2027-11-07'}", 'Collect')
        self.context.set_offline(False)


if __name__ == "__main__":
    unittest.main()
