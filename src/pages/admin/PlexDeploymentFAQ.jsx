import { useState } from 'react'
import './PlexDeploymentFAQ.css'

function PlexDeploymentFAQ() {
  const [expanded, setExpanded] = useState({ step1: false, step2: false, step3: false, step4: false, step5: false })
  const [jwtWidgetOpen, setJwtWidgetOpen] = useState(false)
  const [terminalWidgetOpen, setTerminalWidgetOpen] = useState(false)
  const [pm2NohupWidgetOpen, setPm2NohupWidgetOpen] = useState(false)
  const [githubPushPullWidgetOpen, setGithubPushPullWidgetOpen] = useState(false)
  const [githubActionsWidgetOpen, setGithubActionsWidgetOpen] = useState(false)

  const toggle = (step) => setExpanded((p) => ({ ...p, [step]: !p[step] }))

  return (
    <div className="plex-faq">
      <div className="plex-faq-header">
        <h1>Plex Auto Deployment গাইড</h1>
        <p>প্লেক্স প্যানেলে GitHub থেকে অটোমেটিক ডেপ্লয়মেন্ট সেটআপের ধাপওয়ারি নির্দেশনা</p>
      </div>

      <div className="plex-widget plex-jwt-widget">
        <button
          type="button"
          className="plex-widget-toggle"
          onClick={() => setJwtWidgetOpen(!jwtWidgetOpen)}
        >
          <span className="plex-widget-icon">🔐</span>
          <span className="plex-widget-title">JWT Secret কী? (বাংলায় ব্যাখ্যা)</span>
          <span className={`plex-widget-chevron ${jwtWidgetOpen ? 'open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={jwtWidgetOpen ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
            </svg>
          </span>
        </button>
        {jwtWidgetOpen && (
          <div className="plex-widget-body">
            <p><strong>JWT</strong> মানে <em>JSON Web Token</em>—এটি একটি বিশেষ টোকেন যা দিয়ে লগইন করা ইউজারকে শনাক্ত করা হয়। ইউজার লগইন করলে সার্ভার তাকে একটি টোকেন দেয়; পরবর্তী প্রতিটি রিকোয়েস্টে সেই টোকেন দেখিয়ে ইউজার নিজেকে প্রমাণ করে।</p>
            <p><strong>JWT Secret</strong> হলো সেই <em>গোপন চাবি</em> যেটা দিয়ে সার্ভার টোকেনটিকে &quot;সই&quot; (sign) করে। লগইনের সময় সার্ভার একটি টোকেন তৈরি করে এবং এই Secret দিয়ে সই করে—যাতে পরে কেউ টোকেন জাল করতে না পারে।</p>
            <p><strong>কেন গুরুত্বপূর্ণ?</strong> যদি কেউ আপনার JWT Secret জানতে পারে, তাহলে সে ভুয়া টোকেন বানিয়ে নিজেকে যেকোনো ইউজার বলে দাবি করতে পারবে। তাই এটি অবশ্যই গোপন, শক্তিশালী ও অনন্য রাখতে হবে এবং কখনো পাবলিকভাবে শেয়ার করা যাবে না।</p>
          </div>
        )}
      </div>

      <div className="plex-widget plex-terminal-widget">
        <button
          type="button"
          className="plex-widget-toggle"
          onClick={() => setTerminalWidgetOpen(!terminalWidgetOpen)}
        >
          <span className="plex-widget-icon">🖥️</span>
          <span className="plex-widget-title">Terminal অ্যাক্সেস ও Migration কিভাবে করবেন</span>
          <span className={`plex-widget-chevron ${terminalWidgetOpen ? 'open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={terminalWidgetOpen ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
            </svg>
          </span>
        </button>
        {terminalWidgetOpen && (
          <div className="plex-widget-body">
            <p><strong>Terminal অ্যাক্সেস:</strong> Plesk প্যানেলে <strong>Tools &amp; Settings</strong> → <strong>SSH Terminal</strong> অথবা <strong>Websites &amp; Domains</strong> → bikrans.com → <strong>SSH Access</strong> দিয়ে টার্মিনালে যান। কখনও <strong>Files</strong> → উপরে <strong>Terminal</strong> ট্যাব থাকতে পারে।</p>
            <p><strong>Migration চালাতে:</strong> টার্মিনালে লগইন হয়ে নিচের কমান্ড চালান:</p>
            <div className="plex-code-block">
              <code>cd ~/httpdocs</code>
              <code>npm run migrate</code>
            </div>
            <p>কিছু হোস্টে পাথ <code>/var/www/vhosts/bikrans.com/httpdocs</code> বা অনুরূপ হতে পারে। সাইটের ডকুমেন্ট রুট যেখানে, সেখানে যান।</p>

            <h4>Plesk / সার্ভারে Migration ও Seed চালানোর সময় (শেষ ধাপ)</h4>
            <p>SSH দিয়ে লগইন হয়ে নিচের কমান্ডগুলো ক্রমে চালান। প্রথমে migrate দিয়ে টেবিল তৈরি করুন, তারপর seed দিয়ে প্রথম admin ও user তৈরি করুন:</p>
            <div className="plex-code-block">
              <code>cd ~/httpdocs</code>
              <code># অথবা: cd /var/www/vhosts/bikrans.com/httpdocs</code>
              <code>npm run migrate</code>
              <code>npm run seed</code>
            </div>
            <p>আপনি চাইলে <code>.env</code> ফাইলে DB credentials পরিবর্তন করে নিজের admin email/password দিয়ে <code>server/seeders/seed.js</code> এ যোগ করা যেতে পারে।</p>
          </div>
        )}
      </div>

      <div className="plex-widget plex-pm2-nohup-widget">
        <button
          type="button"
          className="plex-widget-toggle"
          onClick={() => setPm2NohupWidgetOpen(!pm2NohupWidgetOpen)}
        >
          <span className="plex-widget-icon">🔄</span>
          <span className="plex-widget-title">PM2 না হলে nohup — বিস্তারিত ব্যবহার ও কমান্ড</span>
          <span className={`plex-widget-chevron ${pm2NohupWidgetOpen ? 'open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={pm2NohupWidgetOpen ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
            </svg>
          </span>
        </button>
        {pm2NohupWidgetOpen && (
          <div className="plex-widget-body">
            <h4>PM2 vs nohup — কখন কী ব্যবহার করবেন?</h4>
            <p><strong>PM2</strong> হলো Node.js অ্যাপ চালু রাখার জন্য সবচেয়ে ভালো টুল। অটো রিস্টার্ট, লগ ম্যানেজমেন্ট, মাল্টিপল অ্যাপ চালানোর সুবিধা দেয়। তবে <code>npm install -g pm2</code> পারমিশন এরর (EACCES) দিলে অথবা <code>pm2 startup</code> যদি <code>sudo</code> চায়—তখন <strong>nohup</strong> দ্রুত বিকল্প।</p>
            <p><strong>nohup</strong> হলো বিল্ট-ইন কমান্ড; কোনো ইনস্টল লাগে না। টার্মিনাল বন্ধ করলেও প্রক্রিয়া চালু থাকে। কিন্তু সার্ভার রিবুট হলে আবার চালাতে হবে; PM2-এর মতো অটো রিস্টার্ট নেই।</p>

            <h4>PM2 প্রজেক্টে ইনস্টল (গ্লোবাল না)</h4>
            <p>যদি <code>npm install -g pm2</code> কাজ না করে, প্রজেক্টে ইনস্টল করুন। <code>npx</code> দিয়ে চালান:</p>
            <div className="plex-code-block">
              <code>cd ~/httpdocs</code>
              <code>npm install pm2</code>
              <code>npx pm2 start server/index.js --name bikrans</code>
              <code>npx pm2 save</code>
              <code>npx pm2 startup</code>
            </div>
            <p><strong>pm2 startup</strong> এর পর যে কমান্ড দেখাবে সেটা রান করুন। <code>sudo</code> পারমিশন না থাকলে Ctrl+C দিয়ে বাতিল করুন—nohup বিকল্প নিন।</p>

            <h4>nohup দিয়ে চালান (ইনস্টল ছাড়াই)</h4>
            <p>কোনো এক্সটার্নাল প্যাকেজ ছাড়াই ব্যাকগ্রাউন্ডে অ্যাপ চালান। লগ <code>~/bikrans.log</code> এ সেভ হবে:</p>
            <div className="plex-code-block">
              <code>cd ~/httpdocs</code>
              <code>nohup node server/index.js &gt; ~/bikrans.log 2&gt;&amp;1 &amp;</code>
            </div>
            <p><strong>ব্যাখ্যা:</strong> <code>nohup</code> = টার্মিনাল বন্ধ হলেও প্রক্রিয়া চলবে; <code>&gt; ~/bikrans.log</code> = আউটপুট লগ ফাইলে; <code>2&gt;&amp;1</code> = এররও একই ফাইলে; <code>&amp;</code> = ব্যাকগ্রাউন্ডে চালান।</p>

            <h4>Plesk Scheduled Task / Cron-এ কী লিখবেন?</h4>
            <p>Plesk-এর <strong>Schedule a Task</strong> → <strong>Run a command</strong> → <strong>Command</strong> ফিল্ডে এক লাইনে দিন:</p>
            <p><strong>PM2 দিয়ে:</strong></p>
            <div className="plex-code-block">
              <code>cd /var/www/vhosts/bikrans.com/httpdocs &amp;&amp; npx pm2 start server/index.js --name bikrans --update-env 2&gt;/dev/null || true</code>
            </div>
            <p><strong>nohup দিয়ে:</strong></p>
            <div className="plex-code-block">
              <code>cd /var/www/vhosts/bikrans.com/httpdocs &amp;&amp; nohup node server/index.js &gt; ~/bikrans.log 2&gt;&amp;1 &amp;</code>
            </div>
            <p><strong>Schedule:</strong> প্রতিদিন ভোর (যেমন ০৪:০০) অথবা প্রতি ঘণ্টায় রাখুন। সার্ভার রিবুট হলে পরবর্তী রানে অ্যাপ আবার চালু হবে।</p>

            <div className="plex-tip plex-tip-warning" style={{ marginTop: '1rem' }}>
              <span className="plex-tip-icon">⚠️</span>
              <div>
                <p className="plex-tip-title">সতর্কতা</p>
                <p>nohup দিয়ে চালালে সার্ভার রিবুটের পর manually আবার কমান্ড চালাতে হবে—অথবা Plesk Scheduled Task দিয়ে অটো চালান। PM2 + Scheduled Task হলে সবচেয়ে ভালো।</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="plex-widget plex-github-push-pull-widget">
        <button
          type="button"
          className="plex-widget-toggle"
          onClick={() => setGithubPushPullWidgetOpen(!githubPushPullWidgetOpen)}
        >
          <span className="plex-widget-icon">📤</span>
          <span className="plex-widget-title">Github manual push and pull setup</span>
          <span className={`plex-widget-chevron ${githubPushPullWidgetOpen ? 'open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={githubPushPullWidgetOpen ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
            </svg>
          </span>
        </button>
        {githubPushPullWidgetOpen && (
          <div className="plex-widget-body">
            <p>কোড আপডেট করার পর সার্ভারে লেটেস্ট ভার্সন দেখাতে নিচের ধাপগুলো অনুসরণ করুন।</p>

            <h4>১. লোকালে Push করুন</h4>
            <p>আপনার কম্পিউটারে Terminal খুলে প্রজেক্ট ফোল্ডারে গিয়ে:</p>
            <div className="plex-code-block">
              <code>cd bikrans-homepage</code>
              <code>git add .</code>
              <code>git commit -m &quot;আপনার commit মেসেজ&quot;</code>
              <code>git push origin main</code>
            </div>

            <h4>২. Plesk-এ Pull করুন</h4>
            <p>Plesk প্যানেলে <strong>Websites &amp; Domains</strong> → bikrans.com → <strong>Git</strong> → <strong>Pull</strong> বাটনে ক্লিক করুন।</p>

            <h4>৩. Build চালান (গুরুত্বপূর্ণ)</h4>
            <p>Git pull শুধু সোর্স কোড আপডেট করে। লাইভ সাইট <code>dist/</code> ফোল্ডার থেকে serve হয়। তাই SSH দিয়ে:</p>
            <div className="plex-code-block">
              <code>cd ~/httpdocs</code>
              <code># অথবা: cd /var/www/vhosts/bikrans.com/httpdocs</code>
              <code>npm run build</code>
            </div>

            <h4>৪. (প্রয়োজন হলে) Node Restart</h4>
            <p>কিছু ক্ষেত্রে পরিবর্তন দেখাতে Node অ্যাপ রিস্টার্ট করুন:</p>
            <div className="plex-code-block">
              <code>npx pm2 restart bikrans</code>
            </div>

            <p><strong>সংক্ষেপে:</strong> Push → Pull → Build → (প্রয়োজন হলে) Restart</p>

            <div className="plex-tip plex-deploy-tip" style={{ marginTop: '1rem' }}>
              <span className="plex-tip-icon">📌</span>
              <div>
                <p className="plex-tip-title">পরবর্তী ধাপ</p>
                <ol>
                  <li>Plesk থেকে Pull করুন</li>
                  <li>SSH এ <code>npm run build</code> চালান</li>
                  <li>প্রয়োজনে <code>npx pm2 restart bikrans</code></li>
                </ol>
                <p>প্রথমে প্রজেক্ট ফোল্ডারে যান (যেকোনো একটি):</p>
                <div className="plex-code-block">
                  <code>cd ~/httpdocs</code>
                  <code># অথবা</code>
                  <code>cd /var/www/vhosts/bikrans.com/httpdocs</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="plex-widget plex-github-actions-widget">
        <button
          type="button"
          className="plex-widget-toggle"
          onClick={() => setGithubActionsWidgetOpen(!githubActionsWidgetOpen)}
        >
          <span className="plex-widget-icon">⚡</span>
          <span className="plex-widget-title">GitHub Actions অটো ডেপ্লয়মেন্ট</span>
          <span className={`plex-widget-chevron ${githubActionsWidgetOpen ? 'open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={githubActionsWidgetOpen ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
            </svg>
          </span>
        </button>
        {githubActionsWidgetOpen && (
          <div className="plex-widget-body">
            <p><code>main</code> ব্রাঞ্চে push করলে GitHub Actions স্বয়ংক্রিয়ভাবে pull → build → restart করবে। একবার সেটআপ করলেই আর manually deploy করতে হবে না।</p>

            <h4>সেটআপ (একবার)</h4>
            <ol>
              <li><strong>SSH কী:</strong> <code>ssh-keygen -t ed25519 -a 200 -C &quot;github-deploy&quot;</code></li>
              <li><strong>সার্ভারে পাবলিক কী:</strong> <code>~/.ssh/authorized_keys</code> তে যোগ করুন</li>
              <li><strong>GitHub Secrets:</strong> repo → Settings → Secrets → Actions</li>
            </ol>

            <h4>প্রয়োজনীয় Secrets</h4>
            <div className="plex-code-block">
              <code>DEPLOY_HOST = bikrans.com (বা সার্ভার IP)</code>
              <code>DEPLOY_USER = SSH ইউজারনেম (Terminal-এ যে নাম দেখায়, যেমন bikr4470zg84)</code>
              <code>DEPLOY_SSH_KEY = প্রাইভেট কী পুরো কনটেন্ট</code>
              <code>DEPLOY_PATH = ~/httpdocs (বা /var/www/vhosts/bikrans.com/httpdocs)</code>
              <code>DEPLOY_PORT = 22 (অপশনাল)</code>
            </div>

            <p>বিস্তারিত গাইড: প্রজেক্টে <code>GITHUB_ACTIONS_DEPLOY.md</code> ফাইল দেখুন।</p>
          </div>
        )}
      </div>

      <div className="plex-faq-steps">
        {/* ধাপ ১ */}
        <section className={`plex-step-card ${expanded.step1 ? 'expanded' : 'collapsed'}`}>
          <button type="button" className="plex-step-header" onClick={() => toggle('step1')}>
            <div className="plex-step-badge">ধাপ ১</div>
            <h2>কিভাবে প্রজেক্ট পুশ করবেন</h2>
            <span className="plex-chevron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={expanded.step1 ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
              </svg>
            </span>
          </button>
          <div className="plex-step-body">
          <p>লোকাল প্রজেক্ট GitHub-এ পুশ করার জন্য নিচের কমান্ডগুলো Terminal-এ চালান:</p>
          <div className="plex-code-block">
            <code>cd bikrans-homepage</code>
            <code>git add .</code>
            <code>git commit -m "আপনার commit মেসেজ"</code>
            <code>git push origin main</code>
          </div>
          <div className="plex-tip">
            <span className="plex-tip-icon">💡</span>
            <p>প্রথমবার push এর আগে নিশ্চিত করুন <code>git remote -v</code> দিয়ে remote ঠিক আছে এবং <code> origin</code> এ <code>https://github.com/marzan3698/bikransnew.git</code> সেট করা আছে।</p>
          </div>
          </div>
        </section>

        {/* ধাপ ২ */}
        <section className={`plex-step-card ${expanded.step2 ? 'expanded' : 'collapsed'}`}>
          <button type="button" className="plex-step-header" onClick={() => toggle('step2')}>
            <div className="plex-step-badge">ধাপ ২</div>
            <h2>প্লেক্সে Git Repository সংযুক্ত করুন</h2>
            <span className="plex-chevron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={expanded.step2 ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
              </svg>
            </span>
          </button>
          <div className="plex-step-body">

          <div className="plex-nav-guide">
            <h3>যেভাবে যাবেন</h3>
            <ol>
              <li><strong>Websites & Domains</strong> এ ক্লিক করুন</li>
              <li><strong>bikrans.com</strong> সিলেক্ট করুন</li>
              <li>বাম দিকে <strong>Git</strong> এ ক্লিক করুন</li>
              <li><strong>Add Repository</strong> ক্লিক করুন</li>
              <li>নিচের তথ্য দিয়ে <strong>Create repository</strong> ফরম পূরণ করুন</li>
            </ol>
          </div>

          <h3 className="plex-form-title">Create repository ফরমে পূরণ করবেন</h3>
          <p className="plex-form-desc">ছবিতে দেখানো ফরমের প্রতিটি ফিল্ডে নিচের মান দিন:</p>

          <div className="plex-field-grid">
            <div className="plex-field-card required">
              <span className="plex-field-label">Repository URL *</span>
              <span className="plex-field-value">https://github.com/marzan3698/bikransnew.git</span>
              <span className="plex-field-note">HTTP(S) এবং SSH উভয় প্রোটোকল সমর্থিত</span>
            </div>

            <div className="plex-field-card">
              <span className="plex-field-label">Username</span>
              <span className="plex-field-value optional">খালি রাখুন</span>
              <span className="plex-field-note">Public repository এর জন্য প্রয়োজন নেই</span>
            </div>

            <div className="plex-field-card">
              <span className="plex-field-label">Password</span>
              <span className="plex-field-value optional">খালি রাখুন</span>
              <span className="plex-field-note">Public repository এর জন্য প্রয়োজন নেই</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Repository name *</span>
              <span className="plex-field-value">bikransnew.git</span>
              <span className="plex-field-note">ডোমেইনের মধ্যে অনন্য নাম নির্দিষ্ট করুন</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Deployment mode *</span>
              <span className="plex-field-value">Automatic</span>
              <span className="plex-field-note">Plesk রিপোজিটরিতে ফাইল এলে সঙ্গে সঙ্গে প্রোডাকশনে ডেপ্লয় হবে</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Server path *</span>
              <span className="plex-field-value">/httpdocs</span>
              <span className="plex-field-note">ফাইলগুলো ডেপ্লয় হবে যে ডিরেক্টরিতে</span>
            </div>

            <div className="plex-field-card full-width">
              <span className="plex-field-label">Enable additional deployment actions</span>
              <span className="plex-field-value">প্রাথমিকভাবে unchecked রাখুন</span>
              <span className="plex-field-note">ডেপ্লয়মেন্টের সময় চালানোর জন্য শেল কমান্ড (পরবর্তী ধাপে সেট করা যাবে)</span>
            </div>
          </div>

          <div className="plex-action-row">
            <p><strong>Save করার পর</strong> <span className="plex-highlight">Update</span> বা <span className="plex-highlight">Deploy</span> বাটনে ক্লিক করুন।</p>
          </div>

          <div className="plex-tip plex-deploy-tip">
            <span className="plex-tip-icon">📌</span>
            <div>
              <p className="plex-tip-title">Deploy ক্লিক করার পর কী ঘটে?</p>
              <p>ক্লিক করলেই প্লেক্সে <strong>“Deploying files to bikrans.com”</strong> মেসেজ দেখা যাবে। ডেপ্লয় শেষ হলে GitHub-এর <code>main</code> ব্রাঞ্চের সব ফাইল <code>/httpdocs</code> ফোল্ডারে চলে আসবে এবং আপনার সাইটে লেটেস্ট কোড আপডেট হয়ে যাবে।</p>
              <p className="plex-tip-next">পরবর্তী ধাপ: Database তৈরি, <code>.env</code> সেটআপ এবং Node.js অ্যাপ কনফিগার করা।</p>
            </div>
          </div>

          <div className="plex-ref-images">
            <p className="plex-ref-label">📷 প্লেক্স Create repository ফরমের উদাহরণ</p>
            <p className="plex-ref-hint">উপরের তথ্য দিয়ে ফরমের প্রতিটি ফিল্ড পূরণ করুন</p>
          </div>
          </div>
        </section>

        {/* ধাপ ৩ - Database Setup */}
        <section className={`plex-step-card ${expanded.step3 ? 'expanded' : 'collapsed'}`}>
          <button type="button" className="plex-step-header" onClick={() => toggle('step3')}>
            <div className="plex-step-badge">ধাপ ৩</div>
            <h2>MySQL Database সেটআপ (প্লেক্স প্যানেল)</h2>
            <span className="plex-chevron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={expanded.step3 ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
              </svg>
            </span>
          </button>
          <div className="plex-step-body">

          <div className="plex-nav-guide">
            <h3>কোথায় যাবেন</h3>
            <ol>
              <li>বাম সাইডবার থেকে <strong>Databases</strong> এ ক্লিক করুন</li>
              <li>ডোমেইন হিসেবে <strong>bikrans.com</strong> নির্বাচিত থাকলে ভালো (নিজেই সিলেক্ট হয়ে থাকে)</li>
              <li>যদি "Looks like there's nothing here" দেখান, তাহলে নীল <strong>+ Add Database</strong> বাটনে ক্লিক করুন</li>
            </ol>
          </div>

          <h3>Add Database ফরমে পূরণ করুন</h3>

          <div className="plex-field-grid">
            <div className="plex-field-card required full-width">
              <span className="plex-field-label">Database type</span>
              <span className="plex-field-value">MySQL</span>
              <span className="plex-field-note">প্রজেক্ট MySQL ব্যবহার করে, তাই MySQL সিলেক্ট করুন</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Database name *</span>
              <span className="plex-field-value">bikrans_db</span>
              <span className="plex-field-note">অন্য নাম দিলে .env এ তাই লিখতে হবে। প্লেক্স প্রিফিক্স যোগ করতে পারে (যেমন bikrans_bikrans_db)</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Database server</span>
              <span className="plex-field-value">localhost</span>
              <span className="plex-field-note">সাধারণত localhost-ই থাকে। ড্রপডাউন থেকে নির্বাচন করুন</span>
            </div>

            <div className="plex-field-card full-width">
              <span className="plex-field-label">Create a database user</span>
              <span className="plex-field-value">চেক করুন ✓</span>
              <span className="plex-field-note">এই ডাটাবেস ব্যবহার করার জন্য ইউজার প্রয়োজন। "Create a database user" চেকবক্স চালু রাখুন</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Username *</span>
              <span className="plex-field-value">bikrans_user</span>
              <span className="plex-field-note">প্লেক্স প্রিফিক্স দিয়ে হতে পারে। মনে রাখুন—.env এ এই নাম দেবেন</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Password *</span>
              <span className="plex-field-value">নিরাপদ পাসওয়ার্ড দিন</span>
              <span className="plex-field-note">কমপক্ষে ১২ ক্যারেক্টার, বড় হাতের, ছোট হাতের, সংখ্যা ও চিহ্ন মিশ্রিত। মনে রাখুন—.env এ লিখতে হবে</span>
            </div>

            <div className="plex-field-card full-width">
              <span className="plex-field-label">Access permissions</span>
              <span className="plex-field-value">Full access / All privileges</span>
              <span className="plex-field-note">ডাটাবেসের উপর সম্পূর্ণ অ্যাক্সেস দিন (CREATE, SELECT, INSERT, UPDATE, DELETE ইত্যাদি)</span>
            </div>

            <div className="plex-field-card full-width plex-field-warning">
              <span className="plex-field-label">Access control (গুরুত্বপূর্ণ)</span>
              <span className="plex-field-value">Allow local connections only</span>
              <span className="plex-field-note">বিক্রান্স অ্যাপ ও ডাটাবেস দুইটাই একই সার্ভারে চলবে, তাই অ্যাপ localhost দিয়েই কানেক্ট করবে। রিমোট অ্যাক্সেসের দরকার নেই। <strong>"Allow local connections only"</strong> সিলেক্ট করুন—এতে শুধু একই সার্ভার থেকে কানেক্ট করা যাবে, বাইরের নেটওয়ার্ক থেকে নয়। সুরক্ষা বেশি থাকবে। "Allow remote connections from any host" নির্বাচন করবেন না।</span>
            </div>
          </div>

          <div className="plex-action-row">
            <p><strong>OK</strong> বা <strong>Create</strong> বাটনে ক্লিক করুন। ডাটাবেস ও ইউজার তৈরি হয়ে যাবে।</p>
          </div>

          <h3>ইউজারকে ডাটাবেসের সাথে সংযুক্ত করা (Edit Database User)</h3>
          <p>ডাটাবেস তৈরির পর ইউজার ঠিকভাবে সংযুক্ত ও সেট আছে কিনা দেখুন। <strong>Databases</strong> → <strong>User Management</strong> → আপনার ইউজার (যেমন <code>bikrans_user</code>) → <strong>Edit</strong> এ যান।</p>

          <div className="plex-field-grid">
            <div className="plex-field-card full-width">
              <span className="plex-field-label">Database *</span>
              <span className="plex-field-value">আপনার ডাটাবেস সিলেক্ট করুন</span>
              <span className="plex-field-note">ড্রপডাউন থেকে সঠিক ডাটাবেস (যেমন <code>marzan3698_bikrans</code>) বেছে নিন। এতে ইউজার ওই ডাটাবেসের সাথে সংযুক্ত থাকবে।</span>
            </div>

            <div className="plex-field-card">
              <span className="plex-field-label">Role</span>
              <span className="plex-field-value">Read and Write</span>
              <span className="plex-field-note">মাইগ্রেশন ও অ্যাপের জন্য প্রয়োজনীয়</span>
            </div>

            <div className="plex-field-card">
              <span className="plex-field-label">Data Access</span>
              <span className="plex-field-value">Select, Insert, Update, Delete</span>
              <span className="plex-field-note">চারটি চেকবক্সই চালু রাখুন</span>
            </div>

            <div className="plex-field-card full-width">
              <span className="plex-field-label">Structure Access</span>
              <span className="plex-field-value">Create, Drop, Alter, Index, Create View, Create Routine, Execute ইত্যাদি</span>
              <span className="plex-field-note">মাইগ্রেশন চালানোর জন্য Create, Drop, Alter প্রয়োজন। সব স্ট্রাকচার প্রিভিলেজ চালু রাখুন অথবা "Read and Write" রোল দিলে অটোমেটিক সেট হয়ে যায়।</span>
            </div>

            <div className="plex-field-card full-width plex-field-warning">
              <span className="plex-field-label">Access control</span>
              <span className="plex-field-value">Allow local connections only</span>
              <span className="plex-field-note">এই অপশন সিলেক্ট করুন। রিমোট কানেকশন নির্বাচন করবেন না।</span>
            </div>
          </div>

          <div className="plex-action-row">
            <p><strong>OK</strong> বা <strong>Apply</strong> ক্লিক করুন এবং পরিবর্তনগুলো সেভ করুন।</p>
          </div>

          <h3>.env ফাইলে যোগ করতে হবে</h3>
          <p>ডাটাবেস তৈরি হওয়ার পর <code>httpdocs</code> ফোল্ডারে <code>.env</code> ফাইল তৈরি করুন (File Manager বা SSH দিয়ে) এবং নিচের লাইনগুলো যোগ করুন। <strong>আপনার দেওয়া নাম ও পাসওয়ার্ড</strong> দিয়ে প্রতিস্থাপন করুন:</p>
          <div className="plex-code-block">
            <code>NODE_ENV=production</code>
            <code>DB_HOST=localhost</code>
            <code>DB_USER=আপনার_database_username</code>
            <code>DB_PASSWORD=আপনার_database_password</code>
            <code>DB_NAME=আপনার_database_name</code>
            <code>JWT_SECRET=আপনার-নিরাপদ-র‍্যান্ডম-স্ট্রিং</code>
            <code>PORT=3001</code>
            <code>ALLOWED_ORIGIN=https://bikrans.com</code>
          </div>

          <div className="plex-tip plex-deploy-tip">
            <span className="plex-tip-icon">🔐</span>
            <div>
              <p className="plex-tip-title">JWT_SECRET কী দেবেন? (র‍্যান্ডম স্ট্রিং)</p>
              <p><strong>JWT_SECRET</strong> লগইন টোকেন সাইনের জন্য ব্যবহার হয়। অবশ্যই একটি শক্তিশালী, অনন্য র‍্যান্ডম স্ট্রিং ব্যবহার করুন (কমপক্ষে ৩২ ক্যারেক্টার)।</p>
              <p><strong>উৎপন্ন করার উপায়:</strong></p>
              <ul>
                <li><strong>Terminal:</strong> <code>openssl rand -base64 32</code> চালান—একটি নিরাপদ স্ট্রিং পাবেন</li>
                <li><strong>অথবা Node.js:</strong> <code>node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"</code></li>
                <li><strong>উদাহরণ ফরম্যাট:</strong> <code>bK9_xR2mP4nQ7vL1wY8zA3cE6fH0jS5tU9</code> (কপি করবেন না—নিজের তৈরি করুন)</li>
              </ul>
              <p>যে স্ট্রিং পাবেন সেটা কপি করে <code>JWT_SECRET=</code> এর পরে পেস্ট করুন। কখনই পাবলিকভাবে শেয়ার করবেন না।</p>
            </div>
          </div>

          <div className="plex-tip plex-deploy-tip">
            <span className="plex-tip-icon">📌</span>
            <div>
              <p className="plex-tip-title">প্লেক্স প্রিফিক্স সম্পর্কে</p>
              <p>প্লেক্স কখনও কখনও ডাটাবেস ও ইউজারনেমে প্রিফিক্স যোগ করে (যেমন <code>bikrans_bikrans_db</code>, <code>bikrans_bikrans_user</code>)। তৈরির পর ডাটাবেস পেজে গিয়ে <strong>ঠিক যে নাম দেখা যাচ্ছে</strong> সেই নামই .env এ ব্যবহার করুন।</p>
            </div>
          </div>

          <p className="plex-tip-next">পরবর্তী ধাপ: Node.js অ্যাপ কনফিগার করা।</p>
          </div>
        </section>

        {/* ধাপ ৪ - Node.js Setup */}
        <section className={`plex-step-card ${expanded.step4 ? 'expanded' : 'collapsed'}`}>
          <button type="button" className="plex-step-header" onClick={() => toggle('step4')}>
            <div className="plex-step-badge">ধাপ ৪</div>
            <h2>Node.js অ্যাপ সেটআপ (প্লেক্স প্যানেল)</h2>
            <span className="plex-chevron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={expanded.step4 ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
              </svg>
            </span>
          </button>
          <div className="plex-step-body">

          <div className="plex-nav-guide">
            <h3>কোথায় যাবেন</h3>
            <ol>
              <li><strong>Websites & Domains</strong> → <strong>bikrans.com</strong> ক্লিক করুন</li>
              <li><strong>Node.js</strong> সেকশনে যান (বা Dev Tools → Node.js)</li>
              <li>নিচের সেটিংগুলো ঠিক করুন</li>
            </ol>
          </div>

          <div className="plex-field-grid">
            <div className="plex-field-card required full-width plex-field-warning">
              <span className="plex-field-label">Application Startup File (গুরুত্বপূর্ণ)</span>
              <span className="plex-field-value">server/index.js</span>
              <span className="plex-field-note"><strong>app.js নয়!</strong> বিক্রান্স প্রজেক্টের এন্ট্রি পয়েন্ট হলো <code>server/index.js</code>। যদি <code>app.js</code> লেখা থাকে এবং "The file does not exist" ওয়ার্নিং আসে, তাহলে এটি <code>server/index.js</code> এ পরিবর্তন করুন।</span>
            </div>

            <div className="plex-field-card required">
              <span className="plex-field-label">Application Root</span>
              <span className="plex-field-value">/httpdocs</span>
              <span className="plex-field-note">যেখানে package.json, server/, .env আছে</span>
            </div>

            <div className="plex-field-card">
              <span className="plex-field-label">Document Root</span>
              <span className="plex-field-value">/httpdocs</span>
              <span className="plex-field-note">এই প্রজেক্টে Node সার্ভার নিজেই static ফাইল সরবরাহ করে। ওয়ার্নিং উপেক্ষা করে httpdocs রাখতে পারেন।</span>
            </div>

            <div className="plex-field-card">
              <span className="plex-field-label">Node.js Version</span>
              <span className="plex-field-value">18 বা তার উপরে</span>
              <span className="plex-field-note">২৩.১১.১ সঠিক। ১৮+ থাকলেই হবে।</span>
            </div>

            <div className="plex-field-card">
              <span className="plex-field-label">Application Mode</span>
              <span className="plex-field-value">production</span>
              <span className="plex-field-note">Production মোডেই চলবে</span>
            </div>

            <div className="plex-field-card full-width">
              <span className="plex-field-label">Enable Node.js</span>
              <span className="plex-field-value">Enable বাটনে ক্লিক করুন</span>
              <span className="plex-field-note">সেটিং সেভ করার পর <strong>Enable Node.js</strong> বাটনে ক্লিক করুন। অ্যাপ চালু হবে।</span>
            </div>
          </div>

          <h3>NPM Install ও Build চালানো</h3>
          <ol className="plex-numbered-list">
            <li><strong>+ NPM install</strong> বাটনে ক্লিক করুন। "Installing the application dependencies" চলে—সম্পূর্ণ হলে "Done" দেখাবে। Close করুন।</li>
            <li><strong>▷ Run script</strong> বাটনে ক্লিক করুন।</li>
            <li><strong>Script name</strong> ফিল্ডে লিখুন: <code>build</code> → <strong>Run</strong> ক্লিক করুন। React frontend বিল্ড হবে (dist/ তৈরি)।</li>
            <li>Build শেষ হলে আবার <strong>Run script</strong> → Script name এ লিখুন: <code>migrate</code> → <strong>Run</strong> করুন। ডাটাবেস টেবিল তৈরি হবে।</li>
          </ol>

          <div className="plex-tip plex-deploy-tip">
            <span className="plex-tip-icon">📌</span>
            <div>
              <p className="plex-tip-title">Run script এ কী লিখবেন?</p>
              <ul>
                <li><strong>build</strong> — ফ্রন্টএন্ড বিল্ড (Vite → dist/)</li>
                <li><strong>migrate</strong> — ডাটাবেস মাইগ্রেশন (টেবিল তৈরি)</li>
              </ul>
              <p>উপরের উইজেট দেখুন: <strong>Terminal অ্যাক্সেস ও Migration</strong> — SSH দিয়ে সরাসরি <code>npm run migrate</code> চালাতে চাইলে সেখানে গাইড আছে।</p>
            </div>
          </div>

          <h3>.htaccess দিয়ে Proxy সেটআপ</h3>
          <p>Apache-কে Node.js অ্যাপে (port 3001) ফরওয়ার্ড করতে <code>httpdocs</code> ফোল্ডারে <code>.htaccess</code> ফাইল তৈরি বা এডিট করুন। Plesk File Manager → httpdocs → .htaccess (নেইলে Create) → এডিট করুন।</p>
          <div className="plex-code-block">
            <code># Proxy ALL requests to Node.js app (port 3001)</code>
            <code>RewriteEngine On</code>
            <code>RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]</code>
          </div>
          <p><strong>গুরুত্বপূর্ণ:</strong> শুধু এই তিন লাইন রাখুন। <code>RewriteCond</code> দিয়ে শর্ত দিলে Apache dev index.html সerve করবে—MIME type এরর হবে। সব রিকোয়েস্ট Node-এ যাওয়া জরুরি। <code>mod_proxy</code> চালু থাকতে হবে।</p>

          <h3>SSH দিয়ে সরাসরি চালান (টেস্টিং)</h3>
          <p>যদি ৫০৩ বা সাইট লোড না হয়, SSH Terminal এ গিয়ে অ্যাপ ম্যানুয়ালি চালিয়ে দেখা যাক ক্র্যাশ হচ্ছে কিনা:</p>
          <div className="plex-code-block">
            <code>cd ~/httpdocs</code>
            <code>node server/index.js</code>
          </div>
          <p>যদি এরর আসে (যেমন module not found, database connection) তাহলে সেটা ঠিক করুন। চালু থাকলে <code>Server running on http://localhost:3001</code> দেখাবে। বন্ধ করতে Ctrl+C চাপুন।</p>

          <div className="plex-tip plex-tip-warning">
            <span className="plex-tip-icon">⚠️</span>
            <div>
              <p className="plex-tip-title">টার্মিনাল বন্ধ করলে ৫০৩ আসে — কী করবেন?</p>
              <p><code>node server/index.js</code> ফোরগ্রাউন্ডে চালালে টার্মিনাল বন্ধ হলে প্রক্রিয়া বন্ধ হয়ে যায়। অ্যাপ সবসময় চালু রাখতে <strong>PM2</strong> ব্যবহার করুন:</p>
              <div className="plex-code-block">
                <code>cd ~/httpdocs</code>
                <code>npm install -g pm2</code>
                <code>pm2 start server/index.js --name bikrans</code>
                <code>pm2 save</code>
                <code>pm2 startup</code>
              </div>
              <p><code>pm2 startup</code> এর পরে যে কমান্ড দেখাবে সেটা আবার রান করুন। তাহলে সার্ভার রিস্টার্টে অ্যাপ অটো চালু হবে। <code>pm2 status</code> দিয়ে চালু আছে কিনা দেখুন।</p>
            </div>
          </div>

          <h3>৫০৩ / MIME এরর এলে</h3>
          <ul className="plex-numbered-list">
            <li><strong>Restart App</strong> — Node.js ড্যাশবোর্ডে Restart App ক্লিক করুন।</li>
            <li><strong>.htaccess চেক</strong> — উপরের তিন লাইন আছে কিনা, অন্য কিছু যোগ করা আছে কিনা।</li>
            <li><strong>Node চালু আছে কিনা</strong> — Enable Node.js বাটনে স্ট্যাটাস দেখুন।</li>
            <li><strong>mod_proxy</strong> — ৫০৩ হলে হোস্টিং সাপোর্টকে বলুন Apache <code>mod_proxy</code> চালু করতে।</li>
          </ul>

          <div className="plex-action-row">
            <p>সব শেষে <strong>Restart App</strong> বাটনে ক্লিক করুন। তারপর bikrans.com এ গিয়ে সাইট চেক করুন।</p>
          </div>

          <p className="plex-tip-next">সেটআপ সম্পন্ন। এখন bikrans.com এ গিয়ে সাইট চেক করুন।</p>
          </div>
        </section>

        {/* ধাপ ৫ - Node অ্যাপ চালু রাখা (PM2 / nohup / Scheduled Tasks) */}
        <section className={`plex-step-card ${expanded.step5 ? 'expanded' : 'collapsed'}`}>
          <button type="button" className="plex-step-header" onClick={() => toggle('step5')}>
            <div className="plex-step-badge">ধাপ ৫</div>
            <h2>Node অ্যাপ সবসময় চালু রাখা (PM2, nohup, Scheduled Tasks)</h2>
            <span className="plex-chevron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={expanded.step5 ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
              </svg>
            </span>
          </button>
          <div className="plex-step-body">

          <p>টার্মিনাল বন্ধ করলে অ্যাপ বন্ধ হয়ে ৫০৩ আসলে নিচের ধাপগুলো অনুসরণ করুন।</p>

          <h3>১. PM2 প্রজেক্টে ইনস্টল করুন (গ্লোবাল না)</h3>
          <p><code>npm install -g pm2</code> পারমিশন এরর দিলে প্রজেক্টে ইনস্টল করুন:</p>
          <div className="plex-code-block">
            <code>cd ~/httpdocs</code>
            <code>npm install pm2</code>
            <code>npx pm2 start server/index.js --name bikrans</code>
            <code>npx pm2 save</code>
            <code>npx pm2 startup</code>
          </div>
          <p><strong>pm2 startup</strong> চালানোর পর যে কমান্ড দেখাবে সেটা রান করুন। যদি <code>sudo</code> চায় এবং পারমিশন না থাকে, তাহলে Ctrl+C দিয়ে বাতিল করুন—অ্যাপ ইতিমধ্যে চালু আছে। পরবর্তী ধাপ (nohup) বিকল্প হিসেবে ব্যবহার করুন।</p>

          <h3>২. যদি PM2 কাজ না করে — nohup</h3>
          <p>কোনো ইনস্টল ছাড়াই ব্যাকগ্রাউন্ডে চালান:</p>
          <div className="plex-code-block">
            <code>cd ~/httpdocs</code>
            <code>nohup node server/index.js &gt; ~/bikrans.log 2&gt;&amp;1 &amp;</code>
          </div>
          <p>এর পর টার্মিনাল বন্ধ করলেও অ্যাপ চলতে থাকবে। ⚠️ <strong>সতর্কতা:</strong> সার্ভার রিবুট হলে আবার এই কমান্ড দিতে হবে।</p>

          <h3>৩. Scheduled Tasks (সার্ভার রিবুটে অটো চালু)</h3>
          <p>PM2-এর <code>pm2 startup</code> যদি sudo ছাড়া কাজ না করে, Plesk-এর <strong>Scheduled Tasks</strong> থেকে একটি ক্রন জব সেট করুন।</p>
          <div className="plex-nav-guide">
            <ol>
              <li>Plesk → <strong>Scheduled Tasks</strong> (বা <strong>Tools &amp; Settings</strong> → <strong>Scheduled Tasks</strong>)</li>
              <li><strong>Add Task</strong> ক্লিক করুন</li>
              <li><strong>Run:</strong> <code>Custom</code> সিলেক্ট করুন</li>
              <li><strong>Command:</strong> নিচের লাইন দিন (এক লাইনে):</li>
            </ol>
          </div>
          <div className="plex-code-block">
            <code>cd /var/www/vhosts/bikrans.com/httpdocs &amp;&amp; npx pm2 start server/index.js --name bikrans --update-env 2&gt;/dev/null || true</code>
          </div>
          <p>অথবা nohup ব্যবহার করলে:</p>
          <div className="plex-code-block">
            <code>cd /var/www/vhosts/bikrans.com/httpdocs &amp;&amp; nohup node server/index.js &gt; ~/bikrans.log 2&gt;&amp;1 &amp;</code>
          </div>
          <p><strong>Schedule:</strong> প্রতিদিন ভোর (যেমন ০৪:০০) অথবা প্রতি ঘণ্টায় চালান। তাহলে সার্ভার রিবুট হলে পরবর্তী রানেই অ্যাপ আবার চালু হবে।</p>

          </div>
        </section>
      </div>
    </div>
  )
}

export default PlexDeploymentFAQ
