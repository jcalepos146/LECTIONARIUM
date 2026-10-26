"""Calendar regressions anchored to published church dates and source limits."""
import unittest
import test_sanctuary as acceptance


class CurrentCalendarTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def test_coptic_pascha_uses_orthodox_date_and_keeps_hours_separate(self):
        self.open()
        rows=self.page.evaluate('''async()=>{
          const get=iso=>LectCalendar.appointments({type:'mass',rite:'copt',iso});
          return [await get('2026-04-05'),await get('2026-04-12'),await get('2026-04-10'),await get('2031-01-01')];
        }''')
        self.assertIn('Matt 21:1-17',[r['cite'] for r in rows[0]['items']])
        # Church-published Resurrection readings: CopticChurch.net, 12 April 2026.
        self.assertEqual([r['cite'] for r in rows[1]['items']],['1 Cor 15:23-50','1 Pet 3:15-22','1 Pet 4:1-6','Acts 2:22-35','Ps 118:24,25,27','John 20:1-18'])
        self.assertEqual(rows[2]['items'],[])
        self.assertEqual([r['title'] for r in rows[2]['hours']],['First Hour','Third Hour','Sixth Hour','Ninth Hour','Eleventh Hour','Twelfth Hour'])
        self.assertEqual(rows[3]['items'],[]);self.assertIn('outside this date range',rows[3]['note'])
        self.page.evaluate("LectApp.follow({type:'mass',rite:'copt',iso:'2026-04-10'})")
        self.page.locator('.mbody .mpart').first.wait_for()
        self.assertIn('rather than a separate Liturgy',self.page.locator('.mbody').inner_text())
        self.assertEqual(self.page.locator('.mbody .reading').count(),0)

    def test_coptic_reader_changes_hour_without_changing_mass_appointments(self):
        self.open();self.page.evaluate("LectApp.follow({type:'mass',rite:'copt',iso:'2026-10-25'})")
        self.page.wait_for_function("document.querySelectorAll('.mbody .reading').length===5")
        self.assertEqual(self.page.locator('.mbody .reading .rc').all_inner_texts(),['1 Cor 16:12-24','Jas 4:7-17','Acts 15:4-12','Ps 71:7-8','Matt 12:22-28'])
        panel=self.page.locator('#lessonCalendar');panel.locator('summary').click()
        panel.locator('.lesson-hour').select_option(label='Matins')
        self.page.wait_for_function("document.querySelectorAll('.calendar-readings .reading').length===2")
        self.assertEqual(panel.locator('.reading .rc').all_inner_texts(),['Ps 57:9-10','Luke 24:1-12'])
        self.assertEqual(self.page.locator('.mbody .reading .rc').last.inner_text(),'Matt 12:22-28')
        panel.locator('.lesson-hour').select_option(label='Vespers')
        self.page.wait_for_function("document.querySelector('.calendar-readings .reading .rc')?.textContent==='Ps 71:5-7'")
        self.assertEqual(panel.locator('.reading .rc').last.inner_text(),'Mark 4:35-41')

    def test_invalid_upstream_reference_is_flagged_without_partial_scripture(self):
        self.open();self.page.evaluate("LectApp.follow({type:'mass',rite:'copt',iso:'2026-02-04'})")
        self.page.locator('.mbody .mpart').first.wait_for()
        self.assertIn('Eph 2:1-23',self.page.locator('.mbody').inner_text())
        self.assertIn('this chapter has 22 verses',self.page.locator('.mbody').inner_text())
        self.assertNotIn('Eph 2:1-23',self.page.locator('.mbody .reading .rc').all_inner_texts())

    def test_coptic_catholic_or_local_profile_requires_its_own_appointments(self):
        self.open();self.page.evaluate("LectApp.follow({type:'mass',rite:'copt',iso:'2026-10-25'})")
        self.page.wait_for_function("document.querySelectorAll('.mbody .reading').length===5")
        panel=self.page.locator('#lessonCalendar');panel.locator('summary').click()
        panel.locator('.lesson-church').select_option('local')
        self.page.wait_for_function("document.querySelector('.mbody')?.textContent.includes('Coptic Catholic or local church calendar')")
        self.assertEqual(self.page.locator('.mbody .reading').count(),0)
        panel.locator('summary').click()
        self.assertEqual(panel.locator('.lesson-church').input_value(),'local')
        self.assertEqual(panel.locator('.lesson-hour').count(),0)
        panel.locator('.lesson-church').select_option('orthodox')
        self.page.wait_for_function("document.querySelectorAll('.mbody .reading').length===5")
        self.assertEqual(self.page.locator('.mbody .reading .rc').last.inner_text(),'Matt 12:22-28')

    def test_current_episcopal_is_default_and_original_table_is_explicit(self):
        self.open();self.page.evaluate("LectApp.follow({type:'mass',rite:'bcp79',iso:'2026-11-29'})")
        self.page.locator('.mbody .mpart').first.wait_for()
        self.assertIn('current Revised Common Lectionary',self.page.locator('.mbody').inner_text())
        self.assertEqual(self.page.locator('.mbody .reading').count(),0)
        panel=self.page.locator('#lessonCalendar');panel.locator('summary').click()
        self.assertEqual(panel.locator('.lesson-edition').input_value(),'current')
        self.assertEqual(panel.locator('a').first.get_attribute('href'),'https://lectionary.episcopalchurch.org/2026/11')
        panel.locator('.lesson-edition').select_option('1979')
        self.page.wait_for_function("document.querySelectorAll('.mbody .reading').length===4")
        self.assertEqual(self.page.locator('.mbody .reading .rc').all_inner_texts(),['Isa 64:1-9','Ps 80','1 Cor 1:1-9','Mark 13:24-32,33-37'])
        self.page.reload();self.page.wait_for_load_state('networkidle')
        self.assertEqual(self.page.evaluate("localStorage.getItem('lect-calendar-bcp79')"),'1979')
        # Cycle anchors: Year A begins in Advent of years divisible by three.
        years=self.page.evaluate("async()=>Promise.all(['2025-11-30','2026-11-29','2027-11-28'].map(async iso=>(await LectCalendar.pb79({iso})).src))")
        self.assertTrue(all('Year '+c in title for c,title in zip('ABC',years)))

    def test_prayer_book_psalms_use_the_prayer_book_verse_numbers(self):
        self.open()
        text=self.page.evaluate("async()=>LectCalendar.psalm79('Ps 104:25-37')")
        self.assertIn('Book of Common Prayer (1979) Psalter',text)
        self.assertIn('<sup>37</sup>',text)
        self.assertEqual(text.count('<sup>'),13)
        self.assertIn('Hallelujah',text)
        self.assertNotIn('could not be found',text)

    def test_current_profiles_state_church_and_import_limits(self):
        self.open()
        rows=self.page.evaluate("async()=>Promise.all(['arm','adai','a','z','rcusv'].map(rite=>LectCalendar.appointments({type:'mass',rite,iso:'2026-10-25'})))")
        self.assertIn('Armenian Apostolic',rows[0]['src']);self.assertIn('Armenian Catholic',rows[0]['note'])
        # The Church of the East reads Maclean's lectionary (1894) on the Gregorian calendar; a local calendar can be chosen.
        self.assertIn('Maclean',rows[1]['src']);self.assertIn('Assyrian Church of the East',rows[1]['note']);self.assertTrue(rows[1]['items'])
        # Milan reads the 1954 Ambrosian Missal's lessons on its own calendar (2026-10-25 is the last Sunday of October: Christ the King).
        self.assertIn('Ambrosian Missal',rows[2]['src']);self.assertIn('Christ the King',rows[2]['title']);self.assertEqual([x['cite'] for x in rows[2]['items']][-1],'John 18:34-37')
        self.assertIn('not a complete daily reading table',rows[3]['note'])
        self.assertIn('Directory of Worship',rows[4]['note'])
        self.assertTrue(all(not r['items'] for i,r in enumerate(rows) if i not in (1,2)))
