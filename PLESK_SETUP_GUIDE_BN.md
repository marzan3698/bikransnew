# প্লেক্স প্যানেল সেটআপ গাইড (বিক্রান্স.কম)

প্রতিটি ধাপ সম্পূর্ণ হলে এই ডকুমেন্ট আপডেট করা হবে।

---

## সম্পন্ন ধাপ: দুইটি Commit বক্স অপসারণ (২০২৬-০২-১১)

**সমস্যা:** Cursor-এ Source Control-এ দুইটি আলাদা "Message" ও Commit বক্স দেখা যাচ্ছিল।

**কারণ:** `Bikrans website` (প্যারেন্ট ফোল্ডার) এবং `bikrans-homepage` (চাইল্ড ফোল্ডার) উভয়েই নিজস্ব `.git` থাকায় দুটি Git repository হিসেবে ধরা হচ্ছিল।

**সমাধান:** প্যারেন্ট ফোল্ডার `Bikrans website` থেকে `.git` সরিয়ে দেওয়া হয়েছে। এখন শুধুমাত্র `bikrans-homepage` একটি Git repo, তাই **একটি Commit বক্স** দেখা যাবে।

**কৃত কাজ:**
- `rm -rf "/Applications/XAMPP/xamppfiles/htdocs/Bikrans website/.git"` চালানো হয়েছে
- Cursor পুনরায় লোড করলে শুধু একটি Commit বক্স দেখা যাবে

---

## নতুন GitHub Repo তৈরি ও Push করার ধাপ

যদি বর্তমান `BikransOfficialSite` রিপো থেকে নতুন রিপোতে যেতে চান:

### ধাপ ১: GitHub-এ নতুন Repository তৈরি করুন

1. GitHub.com → আপনার প্রোফাইল → **Repositories** → **New**
2. Repository নাম দিন (যেমন: `BikransOfficialSite-v2` বা `bikrans-website`)
3. **Public** সিলেক্ট করুন
4. ⚠️ **"Add a README file"** চেক করবেন না – খালি রিপো রাখুন
5. **Create repository** ক্লিক করুন
6. নতুন রিপোর URL কপি করুন (যেমন: `https://github.com/marzan3698/bikrans-website.git`)

### ধাপ ২: লোকাল প্রজেক্টে Remote পরিবর্তন ও Push

Terminal-এ চালান (bikrans-homepage ফোল্ডারে):

```bash
cd "/Applications/XAMPP/xamppfiles/htdocs/Bikrans website/bikrans-homepage"

# নতুন repo URL দিয়ে remote পরিবর্তন করুন (আপনার URL দিয়ে প্রতিস্থাপন করুন)
git remote set-url origin https://github.com/marzan3698/YOUR_NEW_REPO_NAME.git

# সব পরিবর্তন add ও commit করুন
git add .
git commit -m "Add deployment files, InstantVideoEditor, Music, Frame features"

# নতুন repo-তে push করুন
git push -u origin main
```

### ধাপ ৩: (ঐচ্ছিক) পুরনো Repository মুছুন

পুরনো `BikransOfficialSite` রিপো আর লাগবে না এমন হলে:

1. GitHub.com → **marzan3698/BikransOfficialSite** → **Settings**
2. নিচে **Danger Zone** → **Delete this repository**
3. রিপো নাম লিখে confirm করুন

---

## স্থিতি চেক (শুরু করার আগে)

### লোকাল প্রজেক্ট এবং GitHub সংযোগ

- **GitHub Repository:** https://github.com/marzan3698/BikransOfficialSite.git
- **Branch:** main
- **স্থিতি:** সংযুক্ত আছে (fetch ও push উভয়েই কাজ করছে)
- **চেক তারিখ:** ২০২৬-০২-১১

**নোট:** কিছু নতুন ফাইল (যেমন DEPLOYMENT.md, deploy.sh, InstantVideoEditor ইত্যাদি) এখনও commit হয়নি। Plesk-এ deploy করার আগে এই পরিবর্তনগুলো GitHub-এ push করতে হবে।

---

## ধাপ ১: প্লেক্সে Git Repository সংযুক্ত করা

**কাজ:** Plesk Git সেকশনে GitHub repository যোগ করুন।

**কিভাবে করবেন:**
1. Websites & Domains → bikrans.com → Git
2. Add Repository ক্লিক করুন
3. Repository URL দিন: `https://github.com/marzan3698/BikransOfficialSite.git`
4. Deployment path: `httpdocs`
5. Branch: `main`
6. Deploy করুন / Pull করুন

**সম্পন্ন হয়েছে কিনা:** [ ] হ্যাঁ  [ ] না

**সমস্যা বা নোট:** *(এখানে লিখুন)*

---

## ধাপ ২: *(পরবর্তী ধাপ)*

*(ধাপ ১ সম্পূর্ণ হলে এখানে যোগ করা হবে)*

---

## ধাপ ৩: *(পরবর্তী ধাপ)*

*(ধাপ ২ সম্পূর্ণ হলে এখানে যোগ করা হবে)*
