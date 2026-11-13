"""Custom ceremony plans and timed Communion integration."""
import unittest
import test_sanctuary as acceptance

class CeremonyTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def planner(self):
        self.open('#today')
        self.page.locator('#ceremony-planner summary').click()
        return self.page.locator('#ceremony-form')

    def test_custom_occasions_and_exact_minutes(self):
        form=self.planner()
        for kind in ('coronation','consecration','ordination','marriage','other'):
            form.locator('[name=kind]').select_option(kind)
            form.locator('[name=minutes]').fill('37')
            form.locator('[name=subject]').fill('Prince <Alex>')
            form.get_by_role('button',name='Build ceremony plan').click()
            self.assertIn('Prince <Alex>',self.page.locator('#ceremony-result h3').inner_text())
            self.assertIn('37 minutes allocated · matches target',self.page.locator('[data-total]').inner_text())
        self.page.locator('[data-min]').first.fill('9')
        self.assertIn('over target',self.page.locator('[data-total]').inner_text())
        form.locator('[name=tradition]').select_option('secular')
        self.assertTrue(form.locator('[name=eucharist]').is_disabled())
        with self.page.expect_download() as download:
            self.page.locator('[data-download]').click()
        self.assertEqual(download.value.suggested_filename,'ceremony-plan.txt')

    def test_non_catholic_communion_budget(self):
        form=self.planner()
        form.locator('[name=tradition]').select_option('anglican')
        form.locator('[name=eucharist]').check()
        form.locator('[name=minutes]').fill('75')
        form.locator('[name=massMinutes]').fill('40')
        form.get_by_role('button',name='Build ceremony plan').click()
        self.assertIn('75 minutes allocated · matches target',self.page.locator('[data-total]').inner_text())
        self.page.locator('[data-mass]').click()
        self.page.wait_for_function("LectApp.current().rite==='bcp62' && document.querySelectorAll('.mbody .mpart').length>3")
        self.assertEqual(self.page.locator('#tgRange').input_value(),'40')
