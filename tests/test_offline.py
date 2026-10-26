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
        badge = self.page.locator('#offline-badge')
        badge.wait_for()
        self.assertIn('every calendar, lectionary and Bible', badge.inner_text())
        self.context.set_offline(False)
        self.page.wait_for_function("document.getElementById('offline-badge').hidden")

    def test_an_office_pack_is_saved_on_its_own(self):
        self.controlled()
        packs = self.page.evaluate("LectOffline.packs().map(p=>p.key)")
        self.assertEqual(sorted(packs), ['br55', 'br62', 'mon', 'op'])
        done = self.page.evaluate("LectOffline.save(null,'op')")
        self.assertTrue(done['finished']); self.assertEqual(done['failed'], 0); self.assertGreater(done['total'], 10)
        self.assertTrue(self.page.evaluate("!!LectOffline.saved('op')&&!LectOffline.saved()"))
        cached = self.page.evaluate("caches.open('lect-data').then(c=>c.keys()).then(k=>k.map(r=>new URL(r.url).pathname))")
        self.assertTrue(any('/breviary/op/manifest.json' in u for u in cached))
        self.assertFalse(any('/breviary/br62/' in u for u in cached))
        # the footer panel lists the pack as saved
        self.page.evaluate("document.getElementById('offline-use').open=true")
        self.page.wait_for_function("document.querySelector('.offline-panel').innerText.includes('Dominican Office')")
        self.assertRegex(self.page.locator('.offline-panel').inner_text(), r'Dominican Office \(about \d+ MB\) · saved')


if __name__ == "__main__":
    unittest.main()
