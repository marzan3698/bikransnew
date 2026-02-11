# প্লেক্সে Node অ্যাপ সবসময় চালু রাখার উপায়

যদি SSH Terminal এ `node server/index.js` চালালে সাইট কাজ করে, কিন্তু টার্মিনাল বন্ধ করলেই ৫০৩ আসে—এর মানে Node প্রক্রিয়া বন্ধ হয়ে যাচ্ছে। এটা ঠিক করতে নিচের একটিকে ব্যবহার করুন।

---

## ১. PM2 প্রজেক্টে ইনস্টল করুন (গ্লোবাল না)

`npm install -g pm2` পারমিশন এরর দিলে প্রজেক্টে ইনস্টল করুন:

```bash
cd ~/httpdocs
npm install pm2
npx pm2 start server/index.js --name bikrans
npx pm2 save
npx pm2 startup
```

`pm2 startup` চালানোর পর যে কমান্ড দেখাবে সেটা রান করুন। যদি `sudo` চায় এবং পারমিশন না থাকে, তাহলে Ctrl+C দিয়ে বাতিল করুন—অ্যাপ ইতিমধ্যে চালু আছে। পরবর্তী ধাপ (nohup) বিকল্প হিসেবে ব্যবহার করুন।

**কমান্ড:**
- `npx pm2 status` — অ্যাপ চালু আছে কিনা দেখুন
- `npx pm2 logs bikrans` — লগ দেখুন
- `npx pm2 restart bikrans` — রিস্টার্ট

---

## ২. যদি PM2 কাজ না করে — nohup

কোনো ইনস্টল ছাড়াই ব্যাকগ্রাউন্ডে চালান:

```bash
cd ~/httpdocs
nohup node server/index.js > ~/bikrans.log 2>&1 &
```

এর পর টার্মিনাল বন্ধ করলেও অ্যাপ চলতে থাকবে। ⚠️ **সতর্কতা:** সার্ভার রিবুট হলে আবার এই কমান্ড দিতে হবে।

---

## ৩. Plesk Scheduled Tasks (সার্ভার রিবুটে অটো চালু)

PM2-এর `pm2 startup` যদি sudo ছাড়া কাজ না করে, Plesk-এর **Scheduled Tasks** থেকে একটি ক্রন জব সেট করুন, যা প্রতিদিন বা প্রতি ঘণ্টায় এই কমান্ডগুলো চালায় (যদি PM2 বন্ধ থাকে):

1. Plesk → **Scheduled Tasks** (বা **Tools & Settings** → **Scheduled Tasks**)
2. **Add Task** ক্লিক করুন
3. **Run:** `Custom` সিলেক্ট করুন
4. **Command:** নিচের লাইন দিন (এক লাইনে):

```bash
cd /var/www/vhosts/bikrans.com/httpdocs && npx pm2 start server/index.js --name bikrans --update-env 2>/dev/null || true
```

অথবা nohup ব্যবহার করলে:

```bash
cd /var/www/vhosts/bikrans.com/httpdocs && nohup node server/index.js > ~/bikrans.log 2>&1 &
```

**Schedule:** প্রতিদিন ভোর (যেমন ০৪:০০) অথবা প্রতি ঘণ্টায় চালান। তাহলে সার্ভার রিবুট হলে পরবর্তী রানেই অ্যাপ আবার চালু হবে। অটো রিস্টার্টের জন্য হোস্টিং সাপোর্টকে cron job বা scheduled task দিয়ে চালানোর ব্যবস্থা করতে বলুন।

---

## ৪. প্লেক্স Node.js এক্সটেনশন

প্লেক্সের **Node.js** সেকশনে গিয়ে:
- অ্যাপ **Enable** আছে কিনা দেখুন
- **Restart App** চাপুন
- কোন **"Run as service"** বা **"Always running"** অপশন আছে কিনা চেক করুন

যদি প্লেক্স অটোমেটিক প্রক্রিয়া চালু রাখে, তাহলে আলাদাভাবে PM2/nohup লাগবে না।
