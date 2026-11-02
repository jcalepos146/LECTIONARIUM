"""The three coronation orders (tools/texts/orders-*.txt: coronation-1661, coronation-1685-consort, coronation-1594,
coronation-1651) as services."""
import unittest
import test_sanctuary as acceptance


class CoronationTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def service(self, rite):
        self.page.evaluate("(r)=>LectApp.follow({type:'mass',rite:r,iso:'2026-10-21'})", rite)
        self.page.wait_for_function("document.querySelectorAll('.mbody .mpart').length>3")
        return self.page.locator('.runsheet li a').all_inner_texts()

    def test_english_coronation_with_proper_lessons_and_a_consort(self):
        self.open('#today')
        steps = self.service('coro61')
        self.assertEqual(steps[:2], ['The Proceeding to the Abbey', 'The Recognition'])
        self.assertIn('The Anointing', steps); self.assertEqual(steps[-1], "The King's Champion")
        self.assertIn('Guided text', self.page.locator('.covline').inner_text())
        body = self.page.locator('.mbody').inner_text()
        for words in ('Sadoc the Priest, and Nathan the Prophet', 'GOD crown thee with a Crown of Glory and Righteousness',
                      'I will keep it.', 'learn to make Account of the [Godly,] and to terrify the Wicked'):
            self.assertIn(words, body)
        self.assertEqual(self.page.locator('.mbody .reading .rc').all_inner_texts(), ['1 Pet 2:11-17', 'Matt 22:15-22'])
        self.page.locator('details.custom > summary').click()
        self.page.locator('select[data-o="consort"]').select_option('yes')
        self.page.wait_for_function("document.querySelector('.mbody').textContent.includes('Receive the Crown of Glory, Honour, and Joy')")
        steps = self.page.locator('.runsheet li a').all_inner_texts()
        i = steps.index('The Enthroning and the Homage')
        self.assertEqual(steps[i + 1:i + 6], ['The Anointing and Crowning of a Queen Consort (1685)', "The Queen's Anointing",
                                               "The Queen's Ring, Crown and Sceptres", 'The Anthem for the Queen', 'The Anthem, Epistle and Gospel'])
        self.assertNotIn('The Final Prayers (1685)', steps)   # there was no Communion in 1685; here there is

    def test_french_order_names_the_latin_prayers(self):
        self.open('#today')
        steps = self.service('coro94')
        self.assertIn('The Holy Ampoule', steps); self.assertIn('The Calling of the Peers', steps)
        self.assertIn('Order and readings', self.page.locator('.covline').inner_text())
        body = self.page.locator('.mbody').inner_text()
        self.assertIn('Accipe coronam regni &c.', body)
        self.assertIn('Comfortare & esto vi[r] &c.', body)
        self.assertIn('My Lord Prince of Conty', body)

    def test_scottish_order_with_its_psalm_and_folded_sermon(self):
        self.open('#today')
        steps = self.service('coro51')
        self.assertEqual(steps[-1], 'The Exhortation and the Dismissal')
        body = self.page.locator('.mbody')
        self.assertIn('GOD SAVE THE KING, CHARLES THE SECOND.', body.inner_text())
        self.assertIn('SIR, Receave this kinglie Sword', body.inner_text())
        self.assertIn('Ps 20', self.page.locator('.mbody .reading .rc').all_inner_texts())
        fold = body.locator('details.fold', has_text='The sermon preached at Scone')
        self.assertFalse(fold.evaluate('d=>d.open'))
        self.assertIn('Jehojada made a Covenant', fold.text_content())

    def test_coronations_are_listed_with_their_traditions(self):
        self.open('#today')
        r = self.page.evaluate("LectApp.rites().filter(r=>/^coro/.test(r.rite)).map(r=>[r.rite,r.kind,r.cov,LectApp.familyOf(r.rite)])")
        self.assertEqual(sorted(r), [['coro51', 'Coronation', 'guide', 'reformed'], ['coro61', 'Coronation', 'guide', 'anglican'],
                                     ['coro94', 'Coronation', 'order', 'catholic']])
