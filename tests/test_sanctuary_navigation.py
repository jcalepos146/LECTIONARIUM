"""Sanctuary study/guide navigation regressions, sharing the existing browser fixture."""
import datetime
import unittest
import test_sanctuary as acceptance


class NavigationTests(unittest.TestCase):
    # Reuse only the fixture and browser helpers; do not inherit its acceptance tests.
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open
    sanctuary = acceptance.SanctuaryTests.sanctuary

    def test_study_shelf_opens_existing_panels_and_coverage_inventory(self):
        self.page.add_init_script("localStorage.setItem('lect-home','\"sanctuary\"')")
        self.open('#/sanctuary');self.page.locator('[data-route="#/study"]').click()
        self.sanctuary().get_by_role('heading',name='Study the liturgy',exact=True).wait_for()
        self.assertEqual(self.page.locator('[data-study]').count(),7)
        self.page.locator('[data-study="sources"]').click()
        self.page.wait_for_function("location.hash==='#sources' && !document.body.classList.contains('san-open')")
        self.assertTrue(self.page.locator('#sources').is_visible());self.assertFalse(self.page.locator('.tabs').is_visible())
        self.assertEqual(self.page.locator('#coverage-body tr').count(),self.page.evaluate('LectApp.rites().length'))
        self.assertEqual(self.page.evaluate("JSON.parse(localStorage.getItem('lect-home'))"),'sanctuary')
        self.page.locator('[data-bar="study"]').click();self.page.locator('[data-study="compare"]').click()
        self.page.wait_for_function("location.hash==='#compare' && !document.body.classList.contains('san-open')")
        self.assertTrue(self.page.locator('#compare').is_visible())
        self.page.locator('[data-bar="classic"]').click();self.assertTrue(self.page.locator('.tabs').is_visible())

    def test_sanctuary_guide_keyboard_sections_and_native_editing(self):
        self.page.add_init_script("localStorage.setItem('lect-home','\"sanctuary\"')")
        self.open('#/t/latin/roman-1962');self.page.locator('[data-pray="roman-1962:0"]').click()
        self.page.locator('.mbody .mpart').first.wait_for()
        self.page.locator('[data-bar="home"]').focus();self.page.keyboard.press('ArrowDown')
        self.assertEqual(self.page.locator(':focus').get_attribute('id'),'mp-0')
        self.page.keyboard.press('ArrowDown');self.assertEqual(self.page.locator(':focus').get_attribute('id'),'mp-1')
        self.page.keyboard.press('ArrowUp');self.assertEqual(self.page.locator(':focus').get_attribute('id'),'mp-0')
        # Native text editing keeps its own arrow keys, including fields added by guide tools.
        self.page.evaluate("()=>{const i=document.createElement('input');i.id='native-edit-test';i.value='abc';document.querySelector('#session').append(i);i.focus();i.setSelectionRange(2,2)}")
        self.page.keyboard.press('ArrowLeft');self.assertEqual(self.page.locator(':focus').get_attribute('id'),'native-edit-test')
        self.assertEqual(self.page.locator('#native-edit-test').evaluate('(e)=>e.selectionStart'),1)
        self.page.locator('[data-bar="home"]').focus();self.page.keyboard.press('Escape')
        self.sanctuary().get_by_role('heading',name='Roman Rite · 1962',exact=True).wait_for()

    def test_gamepad_guide_navigation_keeps_release_gate_across_routes(self):
        self.page.add_init_script("localStorage.setItem('lect-home','\"sanctuary\"');window.testPad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};navigator.getGamepads=()=>[window.testPad]")
        self.open('#/t/latin/roman-1962');self.page.locator('[data-pray="roman-1962:0"]').click()
        self.page.locator('.mbody .mpart').first.wait_for()
        self.page.clock.pause_at(datetime.datetime(2026,10,21,17,tzinfo=datetime.timezone.utc))
        self.page.locator('[data-bar="home"]').focus();self.page.evaluate('testPad.buttons[13].pressed=true');self.page.clock.run_for(100)
        self.assertEqual(self.page.locator(':focus').get_attribute('id'),'mp-0')
        self.page.clock.run_for(400);self.assertNotEqual(self.page.locator(':focus').get_attribute('id'),'mp-0')
        self.page.evaluate('testPad.buttons[13].pressed=false;testPad.buttons[1].pressed=true');self.page.clock.run_for(800)
        self.sanctuary().get_by_role('heading',name='Roman Rite · 1962',exact=True).wait_for()
        # Held B must not back through the entry and its parent on the same press.
        self.page.evaluate('testPad.buttons[1].pressed=false');self.page.clock.run_for(60)
        self.page.evaluate('testPad.buttons[1].pressed=true');self.page.clock.run_for(100)
        self.sanctuary().get_by_role('heading',name='Latin Church',exact=True).wait_for()

