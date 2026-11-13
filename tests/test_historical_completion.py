"""Regression coverage for historical Prayer Book completions."""
import json
import pathlib
import unittest
import test_sanctuary as acceptance

ROOT = pathlib.Path(__file__).resolve().parents[1]


class HistoricalCompletionTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def test_canadian_holy_week_renders_its_inherited_collect(self):
        book = json.loads((ROOT / 'data/bcp1918.json').read_text())
        collect = book['propers']['THE SUNDAY NEXT BEFORE EASTER']['sets'][0]['collect'][0]
        self.open()
        for iso in ['2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02']:
            self.page.evaluate('(iso)=>LectApp.follow({type:"mass",rite:"bcp18",iso})', iso)
            self.page.wait_for_function('(text)=>document.querySelector(".mbody")?.textContent.includes(text)', arg=collect)
            body = self.page.locator('.mbody')
            self.assertEqual(body.locator('.reading').count(), 2)
            self.assertNotIn('The Collect of the Day, from the Prayer Book.', body.inner_text())

    def test_completed_books_use_their_own_readings_and_leave_wip(self):
        self.open('#/wip')
        self.page.locator('.san-wip').first.wait_for()
        for rite, year in [('bcp18', '1918'), ('bcp29', '1929')]:
            self.assertEqual(self.page.locator(f'.san-wip [data-launch="mass|{rite}|"]').count(), 0)
            self.assertEqual(self.page.evaluate('(rite)=>LectApp.coverage("mass",rite)', rite), 'Complete text')
            book = json.loads((ROOT / f'data/bcp{year}.json').read_text())
            day = book['propers']['CHRISTMAS DAY']['sets'][0]
            self.page.evaluate('(rite)=>LectApp.follow({type:"mass",rite,iso:"2026-12-25"})', rite)
            self.page.wait_for_function('(text)=>document.querySelector(".mbody")?.textContent.includes(text)', arg=day['collect'][0])
            body = self.page.locator('.mbody').inner_text()
            self.assertIn(day['epistle']['text'][0], body)
            self.assertIn(day['gospel']['text'][0], body)
            self.assertNotIn('given from the 1662 Prayer Book', self.page.locator('#session').inner_text())
            self.page.goto(self.url + '#/wip')
            self.page.locator('.san-wip').first.wait_for()
