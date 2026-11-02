"""The world calendar (src/worldcal.js) and votive Masses (src/votive.js with mass.js)."""
import json, unittest
import test_sanctuary as acceptance

REALM = {"on": True, "name": "The Realm", "era": "A.R.", "epoch": "2026-10-04", "pace": 1,
         "months": [{"name": "Frost", "days": 14}, {"name": "Thaw", "days": 14}, {"name": "Bloom", "days": 14}, {"name": "Harvest", "days": 14}],
         "weekdays": ["Sol", "Luna", "Mars", "Merc", "Jove", "Venus", "Sat"]}


class WorldCalendarTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def test_compression_keeps_the_shape_of_the_church_year(self):
        self.open()
        r = self.page.evaluate('''()=>{
          const W=LectWorld, out={};
          for(const n of [7,13,28,56,120,364,400]){ const c=W.normalize({yearLen:n});
            for(const Y of W.YEARS){ const P=W.plan(c,Y), d=P.days;
              const up=d.every((x,i)=>!i||(n<=364?x>d[i-1]:x>=d[i-1]));
              const E=LitDate.iso(LitDate.easter(Y)), adv=LitDate.iso(LitDate.advent(Y-1));
              out[n+'/'+Y]={len:d.length,up,first:d[0]===adv,easter:d.includes(E),inYear:d.every(x=>x>=adv&&x<LitDate.iso(LitDate.advent(Y)))}; } }
          const c=W.normalize({yearLen:56}), P=W.plan(c,2027), E=LitDate.easter(2027), at=k=>LitDate.iso(LitDate.add(E,k));
          out.feasts=['2026-12-25','2027-01-06',at(-46),at(-7),at(-3),at(-2),at(0),at(39),at(49),at(56),'2027-11-01',LitDate.iso(LitDate.add(LitDate.advent(2027),-7))].every(x=>P.days.includes(x));
          const hw=P.days.indexOf(at(-7)); out.holyWeek=P.days.slice(hw,hw+8).join(',')===[-7,-6,-5,-4,-3,-2,-1,0].map(at).join(',');
          out.sundays=P.days.filter(x=>new Date(x+'T00:00Z').getUTCDay()===0).length;
          const loose=W.normalize({yearLen:56,keepHolyWeek:false,snap:false,pins:[]}), L=W.plan(loose,2027);
          out.loose=L.segs.find(s=>s.key==='holyweek').count;
          out.pinned=W.plan(W.normalize({yearLen:56,dates:['12-08','08-06']}),2027).days.filter(x=>x==='2026-12-08'||x==='2027-08-06').length;
          out.weights=W.plan(W.normalize({yearLen:56,weights:{pentecost:0.5}}),2027).segs.find(s=>s.key==='pentecost').count;
          return out; }''')
        for k, v in r.items():
            if '/' in k:
                n = int(k.split('/')[0])
                self.assertEqual(v['len'], n, k)
                self.assertTrue(v['up'] and v['first'] and v['inYear'], (k, v))
                if n >= 13:
                    self.assertTrue(v['easter'], k)
        self.assertTrue(r['feasts'])
        self.assertTrue(r['holyWeek'])
        self.assertGreater(r['sundays'], 30)
        self.assertEqual(r['loose'], 2)
        self.assertEqual(r['pinned'], 2)
        self.assertLess(r['weights'], 25)

    def test_clock_labels_rotation_and_sharing(self):
        self.open()
        r = self.page.evaluate('''(cfg)=>{ const W=LectWorld, c=W.normalize(cfg), t=W.today(c,'2026-10-21');
          const week=W.normalize({...cfg,pace:7}), w=W.today(week,'2026-10-21');
          const fixed=W.normalize({...cfg,cycle:'fixed',litYear:2029});
          const back=W.importText(W.exportText(c));
          return {t,label:W.label(c,t.index),begin:W.realOf(c,t.index),lit:W.liturgical(c,0),
            years:[1,2,3,4,5,6].map(y=>W.churchYear(c,y)),fixed:[1,2,7].map(y=>W.churchYear(fixed,y)),
            w,before:W.label(c,-1),back:JSON.stringify({...back,on:true})===JSON.stringify({...c,on:true}),
            bad:(()=>{ try{ W.importText('[1]'); return 'accepted'; }catch(e){ return 'refused'; } })(),
            yearLen:W.normalize({yearLen:3}).yearLen}; }''', REALM)
        self.assertEqual(r['t'], {'index': 17, 'year': 1, 'doy': 17})
        self.assertEqual(r['label'], 'Merc, 4 Thaw, A.R. 1')
        self.assertEqual(r['begin'], '2026-10-21')
        self.assertEqual(r['lit'], '2025-11-30')
        self.assertEqual(r['years'], [2026, 2027, 2028, 2029, 2030, 2026])
        self.assertEqual(r['fixed'], [2029, 2029, 2029])
        self.assertEqual(r['w'], {'index': 2, 'year': 1, 'doy': 2})
        self.assertEqual(r['before'], 'Sat, 14 Harvest, A.R. 0')
        self.assertTrue(r['back'])
        self.assertEqual(r['bad'], 'refused')
        self.assertEqual(r['yearLen'], 7)

    def test_set_up_open_and_step_through_world_days(self):
        self.context.add_init_script("localStorage.setItem('lect-pray',JSON.stringify({type:'mass',rite:'m',hour:null}))")
        self.open('#today')
        panel = self.page.locator('details.worldcal')
        panel.locator('> summary').click()
        f = panel.locator('form.wc-form')
        f.locator('input[name=on]').check()
        f.locator('input[name=name]').fill('The Realm')
        f.locator('input[name=era]').fill('A.R.')
        f.locator('textarea[name=months]').fill('Frost: 14\nThaw: 14\nBloom: 14\nHarvest: 14')
        f.locator('input[name=weekdays]').fill('Sol, Luna, Mars, Merc, Jove, Venus, Sat')
        f.locator('input[name=epoch]').fill('2026-10-04')
        f.get_by_role('button', name='Save the world calendar').click()
        self.page.locator('.worldrow').first.wait_for()
        self.assertIn('The Realm: Merc, 4 Thaw, A.R. 1', self.page.locator('.worldrow').first.inner_text())
        self.assertIn('Sunday, 22 March 2026', self.page.locator('.worldrow').first.inner_text())
        saved = self.page.evaluate("JSON.parse(localStorage.getItem('lect-world'))")
        self.assertEqual(saved['yearLen'], 56)
        self.page.locator('[data-wday="today"]').click()
        self.page.locator('.mbody .mpart').first.wait_for()
        self.assertEqual(self.page.locator('.dlabel .wday').inner_text(), 'Merc, 4 Thaw, A.R. 1')
        self.assertEqual(self.page.locator('.dayname').first.inner_text(), 'Dominica de Passione')
        self.page.locator('#nextDay').click()
        self.page.wait_for_function("document.querySelector('.dlabel .wday')?.textContent==='Jove, 5 Thaw, A.R. 1'")
        self.page.wait_for_function("document.querySelector('.dayname')?.textContent==='Dominica in Palmis'")
        self.assertEqual(self.page.evaluate('LectApp.current()')['wi'], 18)
        # a plain date leaves the world calendar
        self.page.evaluate("LectApp.follow({type:'mass',rite:'m',iso:'2026-10-21'})")
        self.page.wait_for_function("!document.querySelector('.dlabel .wday')")
        # the day table names each world day's celebration
        self.page.locator('#backAsk').click()
        self.page.locator('details.worldcal').wait_for()   # the panel stays as the reader left it (open)
        self.assertTrue(self.page.evaluate("document.querySelector('details.worldcal').open"))
        self.page.locator('.wc-prev > summary').click()
        self.page.wait_for_function("document.querySelectorAll('.wc-tab tbody tr').length===56")
        self.assertIn('Dominica Resurrectionis', self.page.locator('.wc-tab').inner_text())
        self.assertIn('Holy Week: 7 days for 7', self.page.locator('.wc-table').inner_text())


class VotiveTests(unittest.TestCase):
    setUpClass = classmethod(acceptance.SanctuaryTests.setUpClass.__func__)
    tearDownClass = classmethod(acceptance.SanctuaryTests.tearDownClass.__func__)
    setUp = acceptance.SanctuaryTests.setUp
    tearDown = acceptance.SanctuaryTests.tearDown
    open = acceptance.SanctuaryTests.open

    def body(self, text):
        self.page.wait_for_function("(t)=>document.querySelector('.mbody')?.textContent.includes(t)", arg=text)
        return self.page.locator('.mbody').inner_text()

    def test_coronation_votive_in_lent_takes_the_tract_and_is_for_one_day(self):
        self.open('#today')
        self.page.evaluate("LectApp.follow({type:'mass',rite:'m',iso:'2026-03-12'})")
        sel = self.page.locator('#votiveSel'); sel.wait_for()
        self.assertEqual(sel.locator('option').count(), 4)
        sel.select_option('coronatio')
        self.page.wait_for_function("document.querySelector('.dayname')?.textContent.includes('Coronation of a Pope')")
        t = self.body('Tu es Petrus')
        self.assertIn('Státuit', t)
        self.assertIn('℣. Et portæ ínferi', t)          # the Tract
        self.assertNotIn('Exáltent eum', t)             # not the Gradual
        self.assertIn('in place of Feria Quinta', self.page.locator('.sesbody .daysub').first.inner_text())
        self.assertEqual(self.page.evaluate('LectApp.current()')['votive'], 'coronatio')
        self.page.locator('#nextDay').click()
        self.page.wait_for_function("document.querySelector('#votiveSel')?.value===''&&document.querySelector('.dayname').textContent.startsWith('Feria Sexta')")
        stored = self.page.evaluate("localStorage.getItem('lect-mass-m')")
        self.assertNotIn('votive', stored or '')

    def test_requiem_and_marian_votives_outside_lent(self):
        self.open('#today')
        self.page.evaluate("LectApp.follow({type:'mass',rite:'p',iso:'2026-10-21'})")
        self.page.locator('#votiveSel').select_option('defunctorum')
        t = self.body('Dies iræ')
        self.assertNotIn('Glória in excélsis Deo', t)
        self.assertIn('Requiéscant in pace', t)
        self.page.evaluate("LectApp.follow({type:'mass',rite:'h',iso:'2026-05-14',opts:{votive:'bmv'}})")   # a host's choice reaches a follower
        t = self.body('Salve, sancta parens')
        self.assertIn('Virga Jesse', t)                 # the Paschaltide Alleluia
        self.assertIn('(Salve, sancta Parens)', self.page.locator('.dayname').first.inner_text())

    def test_1979_various_occasions(self):
        self.open('#today')
        self.page.evaluate("LectApp.follow({type:'mass',rite:'bcp79',iso:'2026-10-25'})")
        sel = self.page.locator('#votiveSel'); sel.wait_for()
        sel.select_option('17')
        self.body('Lord God Almighty, you have made all the peoples of the earth')
        self.page.wait_for_function("document.querySelectorAll('.mbody .reading').length>=3")
        self.assertEqual(self.page.locator('.mbody .reading .rc').all_inner_texts(), ['Isa 26:1-8', 'Rom 13:1-10', 'Mark 12:13-17'])
        self.assertIn('Proper Preface: Trinity Sunday', self.page.locator('.mbody').inner_text())
        sel.select_option('15.2')
        t = self.body('For the choice of fit persons')
        self.assertNotIn('For those to be ordained', t)
        sel.select_option('8')
        self.body('are not loaded here')
        self.assertEqual(self.page.locator('.mbody .reading').count(), 0)
        sel.select_option('22')    # "Preface of the Season": the day's own preface
        self.body('Zech 8:3-12,16-17')

    def test_every_loaded_occasion_lesson_reads(self):
        self.open('#today')
        bad = self.page.evaluate('''async()=>{ const O=await (await fetch('data/bcp1979-occasions.json')).json(), bad=[];
          for(const o of O.occasions){ if(!o.lessons) continue;
            for(const k of ['ot','ep','gs']){ const c=o.lessons[k][0]; try{ const t=await LectApp.passage(c,'k','kj'); if(!t||!String(JSON.stringify(t)).length) bad.push(c); }catch(e){ bad.push(c+': '+e.message); } } }
          return bad; }''')
        self.assertEqual(bad, [])

    def test_live_session_carries_the_hosts_votive_mass(self):
        import datetime, os, pathlib, socket, subprocess, tempfile, time, urllib.request
        root = acceptance.ROOT
        for policy_dir in [pathlib.Path('/etc/chromium/policies/managed'), pathlib.Path('/etc/opt/chrome/policies/managed')]:
            for policy in policy_dir.glob('*.json'):
                if json.loads(policy.read_text()).get('WebRtcIPHandling') == 'disable_non_proxied_udp':
                    self.skipTest('Managed Chromium policy blocks direct WebRTC; exercised in GitHub CI')
        client = root / 'node_modules/peerjs/dist/peerjs.min.js'
        self.assertTrue(client.is_file(), 'Run npm ci to install the pinned local PeerJS test tools')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
        log = tempfile.TemporaryFile(mode='w+')
        server = subprocess.Popen(['node', '-e', f"require('peer').PeerServer({{host:'127.0.0.1',port:{port},path:'/'}})"], cwd=root, stdout=log, stderr=log)
        follower_context = None
        try:
            for _ in range(50):
                try:
                    with urllib.request.urlopen(f'http://127.0.0.1:{port}/peerjs/id', timeout=.3) as r:
                        if r.status == 200: break
                except OSError:
                    time.sleep(.1)
            init = 'window.LECT_PEER_OPTS=' + json.dumps({'host': '127.0.0.1', 'port': port, 'path': '/', 'secure': False, 'config': {'iceServers': []}}) + ';'
            endpoint = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'
            script = client.read_text()
            self.context.route(endpoint, lambda route: route.fulfill(body=script, content_type='application/javascript'))
            self.page.add_init_script(init); self.open('#today')
            self.page.evaluate("LectApp.follow({type:'mass',rite:'m',iso:'2026-10-21'})")
            self.page.locator('#votiveSel').select_option('coronatio')
            self.body('Tu es Petrus')
            self.page.get_by_role('button', name='Live session', exact=True).click(); self.page.locator('#lvHost').click()
            self.page.locator('.livecode').wait_for(); code = self.page.locator('.livecode').inner_text()
            follower_context = self.browser.new_context(viewport={'width': 1280, 'height': 900})
            follower_context.route('https://**/*', lambda route: route.abort())
            follower_context.route(endpoint, lambda route: route.fulfill(body=script, content_type='application/javascript'))
            follower_context.add_init_script(init)
            follower_context.add_init_script("localStorage.setItem('lect-participation-asked','1');localStorage.setItem('lect-home','\"classic\"')")
            follower = follower_context.new_page(); follower.clock.install(time=datetime.datetime(2026, 10, 21, 16, tzinfo=datetime.timezone.utc))
            follower.on('pageerror', lambda e: self.errors.append('Follower: ' + str(e)))
            follower.goto(self.url); follower.locator('#joinCode').fill(code); follower.locator('#joinForm button').click()
            follower.wait_for_function("LectApp.current().votive==='coronatio' && document.querySelector('.dayname')?.textContent.includes('Coronation')")
            follower.wait_for_function("document.querySelector('.mbody')?.textContent.includes('Tu es Petrus')")
            self.page.locator('#votiveSel').select_option('defunctorum')
            follower.wait_for_function("LectApp.current().votive==='defunctorum' && document.querySelector('.mbody')?.textContent.includes('Dies iræ')")
            self.page.locator('#lvEnd').click()
        finally:
            if follower_context: follower_context.close()
            self.page.close(); server.terminate()
            try: server.wait(timeout=5)
            except subprocess.TimeoutExpired: server.kill(); server.wait()
            log.close()
