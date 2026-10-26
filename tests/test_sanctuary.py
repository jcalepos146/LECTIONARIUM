"""Browser acceptance tests. Run: python3 -m unittest discover -s tests -v"""
import datetime, functools, http.server, socket, time, urllib.request, json, os, pathlib, subprocess, tempfile, threading, unittest
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
class SanctuaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)))
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()
        cls.url=f'http://127.0.0.1:{cls.http.server_port}/'
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop();cls.http.shutdown();cls.http.server_close();cls.thread.join()
    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':1920,'height':1080})
        # External font/CDN failures are outside this local regression suite. No app/data mocks.
        self.context.route('https://**/*',lambda route: route.abort())
        # The first-time question and the Sanctuary default view have their own tests; elsewhere the classic page is home.
        self.context.add_init_script("localStorage.setItem('lect-participation-asked','1');if(localStorage.getItem('lect-home')===null)localStorage.setItem('lect-home','\"classic\"')")
        self.page=self.context.new_page();self.page.clock.install(time=datetime.datetime(2026,10,21,16,tzinfo=datetime.timezone.utc));self.errors=[]
        self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.on('console',lambda m:self.errors.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    def tearDown(self):
        self.context.close();self.assertEqual(self.errors,[])
    def open(self,hash=''):
        self.page.goto(self.url+hash);self.page.wait_for_load_state('networkidle')
    def sanctuary(self):return self.page.locator('#sanctuary')
    def test_lazy_open_exit_and_preserve_tab_scroll(self):
        requests=[];self.page.on('request',lambda r:requests.append(r.url))
        self.open('#compare');self.assertFalse(any('traditions.json' in u for u in requests))
        self.page.evaluate('window.scrollTo(0,300)');y=self.page.evaluate('scrollY')
        self.page.locator('#enter-sanctuary').focus();self.page.keyboard.press('s')
        self.sanctuary().get_by_role('heading',name='Sanctuary',exact=True).wait_for()
        self.assertTrue(any('traditions.json' in u for u in requests))
        self.page.keyboard.press('s');self.page.wait_for_function("location.hash==='#compare' && !document.body.classList.contains('san-open')")
        self.assertTrue(self.page.locator('#compare').is_visible());self.page.wait_for_timeout(100)
        self.assertEqual(self.page.evaluate('scrollY'),y)
    def test_keyboard_hierarchy_history_and_search(self):
        self.open('#/sanctuary');self.sanctuary().get_by_role('heading',name='Sanctuary',exact=True).wait_for()
        self.page.locator('[data-route="#/t/catholic"]').focus();self.page.keyboard.press('Enter')
        self.sanctuary().get_by_role('heading',name='Catholic',exact=True,level=1).wait_for()
        self.page.locator('[data-route="#/t/latin"]').focus();self.page.keyboard.press('Enter')
        self.sanctuary().get_by_role('heading',name='Latin Church',exact=True).wait_for()
        self.page.keyboard.press('Escape');self.sanctuary().get_by_role('heading',name='Catholic',exact=True,level=1).wait_for()
        self.page.go_back();self.sanctuary().get_by_role('heading',name='Latin Church',exact=True).wait_for()
        self.page.go_forward();self.sanctuary().get_by_role('heading',name='Catholic',exact=True,level=1).wait_for()
        self.page.keyboard.press('/');q=self.page.locator('#san-query');q.wait_for();q.fill('1928 United States')
        self.assertIn('1 results',self.page.locator('#san-count').inner_text())
        q.fill('Ukraine');self.page.locator('#san-results [data-route="#/t/catholic-ukrainian"]').wait_for()
        q.fill('not-a-tradition');self.assertIn('No matches',self.page.locator('#san-results').inner_text())
        self.page.keyboard.press('Escape');self.sanctuary().get_by_role('heading',name='Sanctuary',exact=True).wait_for()
    def test_nested_deep_link_and_correct_guide(self):
        self.open('#/t/latin/roman-1962');self.sanctuary().get_by_role('heading',name='Roman Rite · 1962',exact=True).wait_for()
        self.page.locator('[data-pray="roman-1962:0"]').click()
        self.page.wait_for_function("LectApp.current().rite==='m' && !document.body.classList.contains('san-open')")
        self.page.get_by_role('button',name='Live session',exact=True).wait_for()
        self.assertIn('Complete text',self.page.locator('#session').inner_text())
        self.page.locator('#enter-sanctuary').click();self.sanctuary().get_by_role('heading',name='Continue',exact=True).wait_for()
        self.page.locator('[data-resume="0"]').click();self.page.wait_for_function("LectApp.current().rite==='m'")
    def test_keyboard_spatial_wrap_and_focus_trap(self):
        self.open('#/sanctuary');first=self.page.locator('.san-shelf').filter(has=self.page.get_by_role('heading',name='Today ·',exact=False)).locator('.san-tile').first
        first.wait_for();first.focus();self.page.keyboard.press('ArrowLeft')
        self.assertTrue(self.page.locator(':focus').get_attribute('data-launch').startswith('office|br62|'))
        self.page.keyboard.press('ArrowRight');self.assertEqual(self.page.locator(':focus').get_attribute('data-launch'),'mass|n|')
        self.page.keyboard.press('ArrowDown');self.assertTrue(self.page.locator(':focus').evaluate('(e)=>e.closest("#sanctuary")!==null'))
        self.page.locator('.san-toolbar button').first.focus();self.page.keyboard.press('Shift+Tab');self.assertTrue(self.page.locator(':focus').evaluate('(e)=>e.closest("#sanctuary")!==null'))
    def test_gamepad(self):
        self.page.add_init_script('''window.testPad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};navigator.getGamepads=()=>[window.testPad];''')
        self.open('#/sanctuary');self.page.locator('[data-route="#/t/catholic"]').wait_for();self.page.locator('[data-route="#/t/catholic"]').focus()
        def press(index):
            self.page.evaluate('(i)=>testPad.buttons[i].pressed=true',index);self.page.wait_for_timeout(90);self.page.evaluate('(i)=>testPad.buttons[i].pressed=false',index);self.page.wait_for_timeout(60)
        press(0);self.sanctuary().get_by_role('heading',name='Catholic',exact=True,level=1).wait_for()
        self.page.locator('[data-route="#/t/latin"]').click();self.sanctuary().get_by_role('heading',name='Latin Church',exact=True).wait_for()
        press(13);self.assertEqual(self.page.locator(':focus').evaluate('(e)=>getComputedStyle(e).outlineStyle'),'solid');self.assertIn('A Select',self.page.locator('.san-prompts').inner_text())
        press(9);self.sanctuary().get_by_role('heading',name='Sanctuary menu').wait_for();press(1)
        self.sanctuary().get_by_role('heading',name='Latin Church',exact=True).wait_for();press(3);self.page.locator('#san-query').wait_for()
        press(1);self.sanctuary().get_by_role('heading',name='Sanctuary',exact=True).wait_for()
    def test_gamepad_stick_repeat_and_held_select(self):
        self.page.add_init_script('''window.testPad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};navigator.getGamepads=()=>[window.testPad];''')
        self.open('#/sanctuary');self.page.locator('[data-launch="mass|n|"]').wait_for()
        # The home view focuses its first tile once it has rendered; start the stick only after that.
        self.page.wait_for_function("document.activeElement?.dataset.launch==='mass|n|'")
        self.page.clock.pause_at(datetime.datetime(2026,10,21,17,tzinfo=datetime.timezone.utc))
        # Pausing the fake clock can drop the frame the poll loop was waiting on; a connect event restarts it,
        # as a controller's first input does in a browser.
        self.page.evaluate("dispatchEvent(new Event('gamepadconnected'))")
        self.page.evaluate('testPad.axes[0]=1');self.page.clock.run_for(100)
        self.assertEqual(self.page.locator(':focus').get_attribute('data-launch'),'mass|m|')
        self.page.clock.run_for(140)
        self.assertEqual(self.page.locator(':focus').get_attribute('data-launch'),'mass|m|')
        self.page.clock.run_for(180)
        self.assertEqual(self.page.locator(':focus').get_attribute('data-launch'),'mass|o|')
        self.page.evaluate('testPad.axes[0]=0;testPad.buttons[0].pressed=true');self.page.clock.run_for(700)
        self.page.wait_for_function("LectApp.current().rite==='o'")
        self.page.evaluate('testPad.buttons[0].pressed=false')
    def test_layouts_and_screenshots(self):
        output=pathlib.Path(os.environ.get('SCREENSHOT_DIR','/tmp/lectionarium-screenshots'));output.mkdir(parents=True,exist_ok=True)
        for width in [390,1920]:
            for theme in ['light','dark']:
                self.page.set_viewport_size({'width':width,'height':1080 if width==1920 else 844});self.page.emulate_media(color_scheme=theme,reduced_motion='reduce')
                self.open('#/t/catholic');self.sanctuary().get_by_role('heading',name='Catholic',exact=True,level=1).wait_for()
                self.assertTrue(self.page.evaluate('document.querySelector("#sanctuary").scrollWidth<=innerWidth'))
                self.page.screenshot(path=str(output/f'sanctuary-{width}-{theme}.png'))
        self.page.locator('[data-action="menu"]').click();self.page.locator('[data-action="theme"]').click();self.assertEqual(self.sanctuary().get_attribute('data-theme'),'vellum')
    def test_existing_flow_add_text_live_and_breviary(self):
        self.open();self.page.get_by_role('button',name="Pray today's Mass").click()
        self.page.get_by_role('link',name='Concluding Rites',exact=True).wait_for()
        self.page.locator('.mt-btn').first.click();self.page.locator('#mtT').fill('Acceptance test prayer')
        self.page.get_by_role('button',name='Save',exact=True).click();self.page.get_by_text('Acceptance test prayer',exact=True).wait_for()
        self.page.get_by_role('button',name='Live session',exact=True).click();self.page.get_by_role('button',name='Host with these settings',exact=True).wait_for()
        self.page.evaluate("LectApp.follow({type:'office',rite:'br62',hour:'vespers',iso:'2026-10-21'})")
        self.page.wait_for_function("document.querySelector('#session').textContent.includes('generated with the Divinum Officium engine')")
        self.assertGreater(len(self.page.locator('#session').inner_text()),5000)
    def test_keyboard_only_home_tradition_church_and_back(self):
        self.open('#/sanctuary');self.page.locator('[data-launch="mass|n|"]').wait_for()
        # Down from the Today shelf, past the list of complete texts, to the Traditions shelf.
        for _ in range(60):
            if self.page.locator(':focus').get_attribute('data-route')=='#/t/catholic': break
            self.page.keyboard.press('ArrowDown')
        self.page.keyboard.press('Enter')
        self.sanctuary().get_by_role('heading',name='Catholic',exact=True,level=1).wait_for()
        self.page.keyboard.press('ArrowDown');self.page.keyboard.press('Enter')
        self.sanctuary().get_by_role('heading',name='Latin Church',exact=True).wait_for()
        self.page.keyboard.press('Escape');self.sanctuary().get_by_role('heading',name='Catholic',exact=True,level=1).wait_for()
        self.page.keyboard.press('Backspace');self.sanctuary().get_by_role('heading',name='Sanctuary',exact=True).wait_for()
    def test_lay_default_local_priest_mode_and_office(self):
        self.page.add_init_script("localStorage.setItem('lect-mass-m',JSON.stringify({veil:false}));localStorage.setItem('lect-view',JSON.stringify({role:'cel',only:true}));")
        self.open();self.page.evaluate("LectApp.follow({type:'mass',rite:'m',iso:'2026-10-21'})")
        self.page.locator('#participation-mode').wait_for()
        self.assertEqual(self.page.locator('#participation-mode').input_value(),'lay')
        self.assertEqual(self.page.locator('#tRole option[value="cel"]').count(),0)
        self.assertEqual(self.page.locator('#tRole').input_value(),'')
        self.assertGreater(self.page.locator('.priest-reference').count(),0)
        self.page.set_viewport_size({'width':390,'height':844});self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        self.page.set_viewport_size({'width':1920,'height':1080})
        self.assertNotIn('HOC EST ENIM CORPUS',self.page.locator('.mbody').text_content())
        self.page.locator('#participation-mode').select_option('priest')
        self.page.locator('#tRole option[value="cel"]').wait_for(state='attached')
        self.page.wait_for_function("document.querySelector('.mbody').textContent.includes('HOC EST ENIM CORPUS')")
        self.page.locator('#tRole').select_option('cel')
        self.page.locator('#participation-mode').select_option('lay')
        self.page.wait_for_function("document.querySelector('#tRole').value==='' && !document.querySelector('#tRole option[value=cel]')")
        self.page.evaluate("LectApp.follow({type:'office',rite:'br62',hour:'vespers',iso:'2026-10-21'})")
        self.page.locator('#tRole option[value="cel"]').wait_for(state='attached')
        self.assertEqual(self.page.locator('#participation-mode').count(),0)
        self.page.locator('#tab-sources').click();self.page.locator('#canonical-guidance').wait_for()
        self.assertIn('permanent deacons',self.page.locator('#canonical-guidance').inner_text())
    def test_sanctuary_is_default_view_and_classic_is_remembered(self):
        ctx=self.browser.new_context(viewport={'width':1280,'height':900});ctx.route('https://**/*',lambda route: route.abort())
        ctx.add_init_script("localStorage.setItem('lect-participation-asked','1')")
        page=ctx.new_page();page.on('pageerror',lambda e:self.errors.append(str(e)))
        try:
            page.goto(self.url);page.locator('#sanctuary').get_by_role('heading',name='Sanctuary',exact=True).wait_for()
            self.assertEqual(page.evaluate('location.hash'),'#/sanctuary')
            page.evaluate("location.hash='#/t/oriental-coptic'");page.locator('[data-pray]').first.click()
            page.locator('.mbody .mpart').first.wait_for()
            self.assertEqual(page.evaluate('document.documentElement.dataset.skin'),'sanctuary')
            self.assertTrue(page.locator('#san-bar').is_visible())
            page.locator('#san-bar [data-bar=home]').click();page.locator('#sanctuary').get_by_role('heading',name='Sanctuary',exact=True).wait_for()
            page.locator('#sanctuary [data-action=exit]').click()
            page.wait_for_function("document.getElementById('sanctuary').hidden && !document.documentElement.dataset.skin")
            page.goto(self.url);page.wait_for_load_state('networkidle')
            self.assertTrue(page.evaluate("document.getElementById('sanctuary').hidden"))
            page.locator('#enter-sanctuary').click();page.locator('#sanctuary').get_by_role('heading',name='Sanctuary',exact=True).wait_for()
            self.assertEqual(page.evaluate("localStorage.getItem('lect-home')"),'"sanctuary"')
        finally:
            ctx.close()
    def test_first_time_question_and_consecration_veil(self):
        ctx=self.browser.new_context(viewport={'width':1280,'height':900});ctx.route('https://**/*',lambda route: route.abort())
        ctx.add_init_script("localStorage.setItem('lect-home',JSON.stringify('classic'))")
        page=ctx.new_page();page.on('pageerror',lambda e:self.errors.append(str(e)))
        try:
            page.goto(self.url);page.wait_for_load_state('networkidle')
            page.evaluate("LectApp.follow({type:'mass',rite:'copt',iso:'2026-10-25'})")
            page.get_by_role('heading',name='Are you a priest, or studying as a seminarian?').wait_for()
            # Lay study is drawn behind the question: no words of consecration, a notice in their place.
            self.assertNotIn('For this is my Body',page.locator('.mbody').text_content())
            self.assertGreater(page.locator('.mbody .veiled').count(),0)
            page.get_by_role('button',name='Yes',exact=True).click()
            page.locator('dialog.pq .pq-warn').get_by_text('can. 1379').wait_for()
            page.get_by_role('button',name='Back',exact=True).click()
            page.get_by_role('button',name='No',exact=True).click()
            self.assertEqual(page.locator('dialog').count(),0)
            self.assertEqual(page.locator('#participation-mode').input_value(),'lay')
            page.reload();page.wait_for_load_state('networkidle')
            page.evaluate("LectApp.follow({type:'mass',rite:'bcp62',iso:'2026-10-25'})");page.locator('#participation-mode').wait_for()
            self.assertEqual(page.locator('dialog').count(),0)
            self.assertNotIn('this is my Body',page.locator('.mbody').text_content())
            page.locator('#participation-mode').select_option('priest')
            page.wait_for_function("document.querySelector('.mbody').textContent.includes('this is my Body')")
            # The Prayer Book speaks of ministers and the words of institution, not of canon law.
            self.assertIn('words of institution',page.locator('.participation').text_content())
            self.assertNotIn('can. 1379',page.locator('.participation').text_content())
        finally:
            ctx.close()
    def test_priest_only_text_not_exported_or_read_aloud(self):
        self.page.add_init_script("""window.spoken=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{},speak:u=>{spoken.push(u.text);setTimeout(()=>u.onend?.(),0);}}});""")
        self.open();self.page.evaluate("LectApp.follow({type:'mass',rite:'n',iso:'2026-10-21'})")
        self.page.locator('#tRole').wait_for()
        # A user's pasted Eucharistic prayer can carry an incorrect 'all' role.
        self.page.evaluate("""document.querySelector('.mbody div[data-priest-only]:has(> h4.sub2)').insertAdjacentHTML('beforeend','<p data-r="all">Reserved Eucharistic sentinel.</p>');document.querySelector('.mbody .mpart').insertAdjacentHTML('afterbegin','<p data-r="ppl">Congregational sentinel.</p>');""")
        self.page.locator('[data-panel="script"]').click()
        self.assertNotIn('Reserved Eucharistic sentinel',self.page.locator('#tPanel').text_content())
        self.assertIn('Congregational sentinel',self.page.locator('#tPanel').text_content())
        self.page.locator('[data-panel="speak"]').click();self.page.locator('#spPlay').click()
        self.page.wait_for_function("spoken.some(t=>t.includes('Congregational sentinel'))")
        self.assertFalse(self.page.evaluate("spoken.some(t=>t.includes('Reserved Eucharistic sentinel'))"))
        self.page.locator('#participation-mode').select_option('priest');self.page.locator('#tRole option[value="cel"]').wait_for(state='attached')
        self.page.evaluate("""document.querySelector('.mbody div[data-priest-only]:has(> h4.sub2)').insertAdjacentHTML('beforeend','<p data-r="all">Priest mode reserved sentinel.</p>');document.querySelector('.mbody .mpart').insertAdjacentHTML('afterbegin','<p data-r="ppl">Second congregational sentinel.</p>');spoken=[];""")
        self.page.locator('[data-panel="script"]').click()
        self.assertIn('Priest mode reserved sentinel',self.page.locator('#tPanel').text_content())
        self.page.locator('[data-panel="speak"]').click();self.page.locator('#spPlay').click()
        self.page.wait_for_function("spoken.some(t=>t.includes('Second congregational sentinel'))")
        self.assertFalse(self.page.evaluate("spoken.some(t=>t.includes('Priest mode reserved sentinel'))"))
    def test_real_local_webrtc_host_join_and_sanctuary(self):
        # Respect managed browser policy; CI runs the real connection on standard Chromium.
        for policy_dir in [pathlib.Path('/etc/chromium/policies/managed'),pathlib.Path('/etc/opt/chrome/policies/managed')]:
            for policy in policy_dir.glob('*.json'):
                if json.loads(policy.read_text()).get('WebRtcIPHandling')=='disable_non_proxied_udp':
                    if os.environ.get('CI'):self.fail('CI must exercise real WebRTC without a restrictive managed policy')
                    self.skipTest('Managed Chromium policy blocks direct WebRTC; exercised in GitHub CI')
        client=ROOT/'node_modules/peerjs/dist/peerjs.min.js'
        self.assertTrue(client.is_file(),'Run npm ci to install the pinned local PeerJS test tools')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        log=tempfile.TemporaryFile(mode='w+')
        server=subprocess.Popen(['node','-e',f"require('peer').PeerServer({{host:'127.0.0.1',port:{port},path:'/'}})"],cwd=ROOT,stdout=log,stderr=log)
        follower_context=None;follower=None
        trace=';window.testPeers=[];const BasePeer=window.Peer;window.Peer=class extends BasePeer{constructor(...a){super(...a);window.testPeers.push(this);}};'
        script=client.read_text()+trace
        try:
            ready=False
            for _ in range(50):
                try:
                    with urllib.request.urlopen(f'http://127.0.0.1:{port}/peerjs/id',timeout=.3) as r:ready=r.status==200
                    if ready:break
                except OSError:time.sleep(.1)
            if not ready:
                log.seek(0);self.fail('Local PeerJS server failed: '+log.read())
            options={'host':'127.0.0.1','port':port,'path':'/','secure':False,'config':{'iceServers':[]}}
            init='window.LECT_PEER_OPTS='+json.dumps(options)+';'
            endpoint='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'
            self.context.route(endpoint,lambda route:route.fulfill(body=script,content_type='application/javascript'))
            self.page.add_init_script(init);self.open();self.page.get_by_role('button',name="Pray today's Mass").click()
            self.page.get_by_role('button',name='Live session',exact=True).click();self.page.locator('#lvHost').click()
            self.page.locator('.livecode').wait_for();code=self.page.locator('.livecode').inner_text()
            follower_context=self.browser.new_context(viewport={'width':1920,'height':1080})
            follower_context.route('https://**/*',lambda route:route.abort())
            follower_context.route(endpoint,lambda route:route.fulfill(body=script,content_type='application/javascript'))
            follower_context.add_init_script(init);follower_context.add_init_script("localStorage.setItem('lect-participation-asked','1');if(localStorage.getItem('lect-home')===null)localStorage.setItem('lect-home','\"classic\"')")
            follower=follower_context.new_page();follower.clock.install(time=datetime.datetime(2026,10,21,16,tzinfo=datetime.timezone.utc))
            follower.on('pageerror',lambda e:self.errors.append('Follower: '+str(e)))
            follower.goto(self.url);follower.locator('#joinCode').fill(code);follower.locator('#joinForm button').click()
            follower.wait_for_function("LectApp.current().rite==='n' && document.querySelector('#tFollow')")
            follower.locator('[data-panel="live"]').click();follower.locator('#lvReady').wait_for()
            self.page.locator('#enter-sanctuary').click();self.sanctuary().get_by_role('heading',name='Sanctuary',exact=True).wait_for()
            follower.locator('#lvReady').check();self.page.keyboard.press('s')
            self.page.get_by_text('1 of 1 ready.',exact=True).wait_for()
            self.assertEqual(self.page.locator('.cast select option[value="cel"]').count(),0)
            self.page.locator('#participation-mode').select_option('priest')
            self.page.locator('#tRole option[value="cel"]').wait_for(state='attached')
            follower.wait_for_function("document.querySelector('#participation-mode').value==='lay' && !document.querySelector('#tRole option[value=cel]')")
            # A hostile host can alter its own DOM; the recipient must still reject the assignment.
            self.page.locator('.cast select').evaluate("s=>s.add(new Option('Forged celebrant','cel'))")
            self.page.locator('.cast select').select_option('cel')
            follower.get_by_text('Priest-only parts cannot be assigned in lay study.',exact=True).wait_for()
            self.assertNotEqual(follower.locator('#tRole').input_value(),'cel')
            follower.locator('#participation-mode').select_option('priest')
            follower.wait_for_function("document.querySelector('#tRole').value==='cel'")
            follower.locator('#participation-mode').select_option('lay')
            follower.wait_for_function("document.querySelector('#tRole').value==='' && !document.querySelector('#tRole option[value=cel]')")
            self.page.locator('.cast select').select_option('lec');follower.wait_for_function("document.querySelector('#tRole').value==='lec'")
            self.page.locator('#tNext').click();follower.wait_for_function("document.querySelector('.runsheet li.now')?.textContent.includes('Liturgy of the Word')")
            self.page.locator('#lvEnd').click();follower.wait_for_function("!document.querySelector('#tFollow')")
        except Exception:
            for label,page in [('host',self.page),('follower',follower)]:
                if page:
                    print(label,page.evaluate('''({peers:(window.testPeers||[]).map(p=>({id:p.id,open:p.open,connections:Object.values(p.connections).flat().map(c=>({open:c.open,ice:c.peerConnection?.iceConnectionState,signaling:c.peerConnection?.signalingState,gathering:c.peerConnection?.iceGatheringState,candidates:(c.peerConnection?.localDescription?.sdp?.match(/a=candidate/g)||[]).length,remote:!!c.peerConnection?.remoteDescription}))})),message:document.querySelector('#joinMsg')?.textContent})'''),flush=True)
            raise
        finally:
            if follower_context:follower_context.close()
            # Close the host before stopping its signalling server.
            self.page.close()
            server.terminate()
            try:server.wait(timeout=5)
            except subprocess.TimeoutExpired:server.kill();server.wait()
            log.close()
    def test_guide_launch_from_scrolled_sources(self):
        self.open('#sources');self.page.evaluate('scrollTo(0,1200)')
        self.assertGreater(self.page.evaluate('scrollY'),0)
        self.page.keyboard.press('s');self.page.locator('.san-today [data-launch="mass|m|"]').wait_for()
        self.page.locator('.san-today [data-launch="mass|m|"]').click()
        self.page.wait_for_function("LectApp.current().rite==='m' && !document.body.classList.contains('san-open')")
        self.page.wait_for_timeout(100);self.assertLess(self.page.evaluate('scrollY'),100)
    def test_monastic_chant_at_end_of_supported_range(self):
        self.open();self.page.evaluate("LectApp.follow({type:'office',rite:'mon',hour:'vespers',iso:'2030-11-30'})")
        chant=self.page.locator('input[data-o="chant"]');chant.wait_for();chant.check()
        self.page.wait_for_function("document.querySelectorAll('#session figure.chantfig .score svg').length>0")
        self.assertGreater(len(self.page.locator('#session').inner_text()),3000)
    def test_sources_and_share_build(self):
        self.open('#/t/no-such-entry');self.sanctuary().get_by_role('heading',name='Entry not found',exact=True).wait_for()
        self.page.locator('[data-action="exit"]').click();self.page.locator('#tab-sources').click();self.page.get_by_role('heading',name='Tradition directory sources').wait_for()
        self.page.set_viewport_size({'width':390,'height':844});self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        catalog=json.loads((ROOT/'data/traditions.json').read_text());urls={u for n in catalog for u in n['sources']+[b['source'] for b in n['books']]}
        rendered=set(self.page.locator('#tradition-sources a').evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))'));self.assertEqual(urls,rendered)
        subprocess.run(['python3','tools/build_traditions.py','--check'],cwd=ROOT,check=True,capture_output=True)
        with tempfile.TemporaryDirectory() as d:
            import shutil
            shutil.copytree(ROOT/'src',pathlib.Path(d)/'src');subprocess.run(['python3',str(pathlib.Path(d)/'src/assemble.py')],check=True,capture_output=True)
            self.assertEqual((pathlib.Path(d)/'index.html').read_bytes(),(ROOT/'index.html').read_bytes())
    def test_1979_lectionary_cycles_and_appointments(self):
        self.open()
        values=self.page.evaluate('''async()=>{
          const get=(iso,office=false,eve=false)=>LectCalendar.pb79({iso},office,eve);
          return [await get('2025-11-30'),await get('2026-11-29',true),await get('2026-10-25',true),await get('2026-10-25',true,true),await get('2026-04-03'),await get('2026-04-05')];
        }''')
        self.assertIn('Year A',values[0]['src']);self.assertIn('Year 1',values[1]['src'])
        self.assertEqual([r['cite'] for r in values[0]['items']],['Isa 2:1-5','Rom 13:8-14','Matt 24:37-44'])
        self.assertEqual([r['cite'] for r in values[2]['items']],['Sir 18:19-33','Matt 18:15-20'])
        self.assertEqual([r['cite'] for r in values[3]['items']],['1 Cor 10:15-24'])
        self.assertEqual(values[4]['items'][-1]['cite'],'John 18:1-40;19:1-37')
        self.assertEqual(values[5]['items'][-1]['cite'],'John 20:1-10,11-18')
        self.page.evaluate("localStorage.setItem('lect-calendar-bcp79','1979')")
        self.page.evaluate("LectApp.follow({type:'mass',rite:'bcp79',iso:'2025-11-30'})")
        self.page.locator('.mbody .reading').first.wait_for()
        self.assertIn('Isa 2:1-5',self.page.locator('.mbody').inner_text())
        self.assertEqual(self.page.locator('.mbody .reading .scripture').count(),4)

    def test_local_calendar_readings_are_date_and_rite_scoped(self):
        self.open();self.page.evaluate("LectApp.follow({type:'mass',rite:'copt',iso:'2026-10-25'})")
        panel=self.page.locator('#lessonCalendar');panel.locator('summary').click()
        panel.locator('textarea').fill('Gospel | not a citation')
        panel.get_by_role('button',name='Save readings',exact=True).click()
        self.assertIn('No text found',panel.locator('[role="status"]').inner_text())
        panel.locator('textarea').fill('Gospel | John 1:1-14\nActs | Acts 2:1-11\nCatholic Epistle | Jas 1:1-12\nPsalm | Ps 23\nPauline Epistle | Rom 8:1-11')
        panel.get_by_role('button',name='Save readings',exact=True).click()
        self.page.wait_for_function("document.querySelector('.mbody .reading .rc')?.textContent==='Rom 8:1-11'")
        self.assertEqual(self.page.locator('.mbody .reading .rc').all_inner_texts(),['Rom 8:1-11','Jas 1:1-12','Acts 2:1-11','Ps 23','John 1:1-14'])
        self.page.locator('#nextDay').click();self.page.wait_for_function("LectApp.current().iso==='2026-10-26' && document.querySelector('.mbody .reading .rc')?.textContent==='Heb 4:14-16'")
        self.assertEqual(self.page.locator('.mbody .reading .rc').all_inner_texts(),['Heb 4:14-16','Heb 5:1-14','1 Pet 1:1-9','Acts 12:1-24','Ps 110:4,5,7','Matt 16:13-19'])
        self.page.evaluate("LectApp.follow({type:'mass',rite:'arm',iso:'2026-10-25'})")
        self.page.wait_for_function("document.querySelector('.mbody .mpart') && document.querySelector('.crumbs').textContent.includes('Armenian')")
        self.assertEqual(self.page.locator('.mbody .reading').count(),0)
        self.page.evaluate("LectApp.follow({type:'mass',rite:'copt',iso:'2026-10-25'})")
        self.page.wait_for_function("document.querySelector('.mbody .reading .rc')?.textContent==='Rom 8:1-11'")
        self.page.locator('#lessonCalendar summary').click();self.page.locator('.lesson-clear').click()
        self.page.wait_for_function("document.querySelector('.mbody .reading .rc')?.textContent==='1 Cor 16:12-24'")

    def test_byzantine_bright_week_and_sunday_gospel(self):
        self.open()
        rows=self.page.evaluate("()=>[LectCalendar.byzantine({iso:'2026-04-08'},'byzm'),LectCalendar.byzantine({iso:'2026-10-25'},'byzm'),LectCalendar.byzantine({iso:'2026-10-24'},'byzv')]")
        self.assertEqual(rows[0]['items'],[])
        self.assertTrue(any(r.get('slot')=='gospel' for r in rows[1]['items']))
        self.assertEqual([r['cite'] for r in rows[2]['items']],['Ps '+str(i) for i in range(1,9)])
        self.page.evaluate("LectApp.follow({type:'mass',rite:'byzm',iso:'2026-10-25'})")
        self.page.locator('.mbody .reading').first.wait_for()
        self.assertIn('Eothinon',self.page.locator('.mbody').inner_text())

if __name__=='__main__':unittest.main()
