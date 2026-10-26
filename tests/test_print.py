"""Print and PDF: the print panel's choices, the running foot, and the parts left out of the printed page."""
import unittest
import test_sanctuary as acceptance


class PrintTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def session(self, spec):
        self.page.evaluate(f"LectApp.follow({spec})")
        self.page.locator('.dayname').first.wait_for()
        self.page.locator('.tools-bar [data-panel="print"]').wait_for()

    def visible(self, sel):
        return self.page.evaluate(f"[...document.querySelectorAll({sel!r})].filter(e=>e.offsetParent!==null||getComputedStyle(e).display!=='none'&&e.getClientRects().length).length")

    def test_english_only_in_black_with_running_foot(self):
        self.open()
        self.session("{type:'office',rite:'br62',hour:'vespers',iso:'2026-11-01'}")
        self.page.locator('.tools-bar [data-panel="print"]').click()
        self.page.locator('#tPanel select[data-print="lang"]').select_option('en')
        self.page.locator('#tPanel select[data-print="ink"]').select_option('black')
        self.page.evaluate("LectTools.printSetup()")
        self.page.emulate_media(media='print')
        try:
            self.assertGreater(self.visible('.mbody .two > [lang="en"]'), 5)
            self.assertEqual(self.visible('.mbody .two > [lang="la"]'), 0)
            self.assertEqual(self.visible('.mbody select'), 0)
            self.assertEqual(self.page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rubric').trim()"), '#000')
            foot = self.page.evaluate("document.getElementById('print-page').textContent")
            self.assertIn('Omnium Sanctorum', foot)
            self.assertIn('2026', foot)
        finally:
            self.page.emulate_media(media='screen')
            self.page.evaluate("LectTools.printDone()")
        self.assertGreater(self.visible('.mbody .two > [lang="la"]'), 5)
        # the choice is remembered
        self.assertEqual(self.page.evaluate("JSON.parse(localStorage.getItem('lect-print')).lang"), 'en')

    def test_chant_and_hymns_render_before_printing(self):
        # widgets whose markup reaches the page late (the Kyrie, the Gloria, the entrance hymn) still draw their scores
        self.open()
        self.session("{type:'mass',rite:'n',iso:'2027-06-20'}")
        self.page.wait_for_function("[...document.querySelectorAll('figure.chantfig .score')].length>3&&[...document.querySelectorAll('figure.chantfig .score')].every(s=>s.querySelector('svg'))", timeout=15000)


if __name__ == "__main__":
    unittest.main()
