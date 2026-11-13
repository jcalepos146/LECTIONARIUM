"""Original companions must never be mistaken for historical service books."""
import json
import pathlib
import unittest
import test_sanctuary as acceptance
ROOT=pathlib.Path(__file__).resolve().parents[1]

class CompanionTests(unittest.TestCase):
    setUpClass=classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass=classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp=acceptance.SanctuaryTests.setUp
    tearDown=acceptance.SanctuaryTests.tearDown
    open=acceptance.SanctuaryTests.open

    def test_every_wip_entry_has_a_complete_companion(self):
        self.open('#/wip')
        self.page.locator('[data-route^="#/companion/"]').first.wait_for()
        links=self.page.locator('[data-route^="#/companion/"]').evaluate_all('(els)=>els.map(e=>e.dataset.route)')
        self.assertEqual(len(links),len(set(links)))
        catalog=json.loads((ROOT/'data/traditions.json').read_text())
        leaves=[n for n in catalog if not n['supported'] and not any(c['parent']==n['id'] for c in catalog)]
        rites=self.page.evaluate('LectApp.rites().filter(r=>r.cov!=="full")')
        self.assertEqual(len(links),len(leaves)+len(rites))
        for route in links:
            self.page.goto(self.url+route+'/0')
            self.page.locator('.devotional-companion').wait_for()
            self.assertEqual(self.page.locator('.companion-section').count(),8,route)
            self.assertIn('not this church’s official service',self.page.locator('.companion-notice').inner_text())
            self.assertIn('King James Version',self.page.locator('.companion-provenance').inner_text())

    def test_cycle_and_download_keep_authorship_and_scripture(self):
        self.open('#/companion/rite-mass-n/0')
        self.assertIn('The Lord is my shepherd',self.page.locator('.companion-section').nth(2).inner_text())
        self.page.get_by_role('button',name='Mercy in action',exact=True).click()
        self.page.wait_for_url('**/1')
        self.page.get_by_role('heading',name='Mercy in action',exact=True).wait_for()
        with self.page.expect_download() as dl:
            self.page.get_by_role('button',name='Download text',exact=True).click()
        text=pathlib.Path(dl.value.path()).read_text()
        self.assertIn('Original devotional compositions',text)
        self.assertIn('Luke 10:30-37',text)
        self.assertIn('A certain man went down from Jerusalem',text)
        self.assertNotIn('Download text',text)
        self.page.keyboard.press('Escape')
        self.page.get_by_role('heading',name='Not yet complete',exact=True).wait_for()

    def test_alternatives_preserve_guide_and_user_text(self):
        self.open()
        self.page.evaluate('LectApp.follow({type:"mass",rite:"n",iso:"2026-11-15"})')
        self.page.locator('.devotional-alternative').first.wait_for()
        self.assertEqual(self.page.evaluate('LectApp.coverage("mass","n")'),'Guided text')
        for details in self.page.locator('.devotional-alternative').all():
            self.assertFalse(details.get_attribute('open'))
            self.assertIn('newly composed',details.text_content())
            cue=details.evaluate('(e)=>{let c=e.previousElementSibling;return c.cloneNode(true).textContent}')
            self.assertNotRegex(cue,r'Eucharistic|consecration|Anaphora|Canon\b')
        cue=self.page.locator('.cue').filter(has_text='Collect of the day').first
        cue.get_by_role('button',name='Add your text for:',exact=False).click()
        self.page.locator('#mtT').fill('My own source text for this collect.')
        self.page.locator('.mt-edit').get_by_role('button',name='Save',exact=True).click()
        self.page.locator('.mytext').filter(has_text='My own source text').wait_for()
        self.assertFalse(self.page.locator('.mytext').first.evaluate('(e)=>e.nextElementSibling?.classList.contains("devotional-alternative")'))

    def test_mobile_direct_link_and_unknown_routes(self):
        self.page.set_viewport_size({'width':390,'height':844})
        self.open('#/companion/rite-mass-byzv/6')
        self.assertEqual(self.page.locator('.companion-section').count(),8)
        self.assertTrue(self.page.evaluate('document.querySelector("#sanctuary").scrollWidth<=innerWidth'))
        self.page.evaluate('document.body.classList.add("companion-print")')
        self.page.emulate_media(media='print')
        self.assertFalse(self.page.locator('.companion-actions').is_visible())
        self.assertTrue(self.page.locator('.companion-notice').is_visible())
        self.page.emulate_media(media='screen')
        self.page.evaluate('document.body.classList.remove("companion-print")')
        self.page.goto(self.url+'#/companion/not-real/0')
        self.page.get_by_role('heading',name='Companion not found').wait_for()
        self.page.goto(self.url+'#/companion/rite-mass-n/99')
        self.page.get_by_role('heading',name='Companion not found').wait_for()

class ScriptureIntegrityTests(unittest.TestCase):
    def test_every_scripture_verse_matches_the_existing_bible(self):
        data=json.loads((ROOT/'data/devotional-companions.json').read_text())
        bible={}
        for f in (ROOT/'bible/kj').glob('s*.json'):bible.update(json.loads(f.read_text()))
        self.assertEqual(len(data['profiles']),8)
        self.assertEqual(len(data['cycle']),7)
        for day in data['cycle']:
            for field in ['psalm','reading']:
                passage=day[field];book,ref=passage['cite'].split();chapter=int(ref.split(':')[0])
                for verse in passage['verses']:
                    self.assertEqual(verse['text'],bible[book][chapter-1][verse['n']-1])
