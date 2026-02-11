# GitHub Actions ডেপ্লয় — ধাপওয়ারি চেকলিস্ট

আপনার সেটআপ অনুযায়ী মান যাচাই করুন।

---

## ✅ ধাপ ১: SSH কী — সম্পন্ন

- লোকালে `~/.ssh/id_ed25519_github_deploy` ও `.pub` তৈরি হয়েছে

---

## ⏳ ধাপ ২: সার্ভারে পাবলিক কী

**Plesk File Manager দিয়ে:**
1. **Files** → Home directory (বাম পাশে) → `.ssh` ফোল্ডার
2. `authorized_keys` ফাইল খুলুন (নেইলে Create → empty file)
3. লোকাল Terminal: `cat ~/.ssh/id_ed25519_github_deploy.pub` → আউটপুট কপি করুন
4. ফাইলের শেষে পেস্ট করুন → Save

---

## ⏳ ধাপ ৩: GitHub Secrets

GitHub → bikransnew repo → **Settings** → **Secrets and variables** → **Actions**

| Secret | আপনার মান |
|--------|------------|
| DEPLOY_HOST | `103.112.62.126` বা `bikrans.com` |
| DEPLOY_USER | `bikr4470zg84` *(SSH Terminal-এ যে নাম)* |
| DEPLOY_SSH_KEY | প্রাইভেট কী (`pbcopy < ~/.ssh/id_ed25519_github_deploy`) |
| DEPLOY_PATH | ধাপ ৪ থেকে `pwd` আউটপুট |
| DEPLOY_PORT | `22` (প্রয়োজন হলে) |

---

## ⏳ ধাপ ৪: সার্ভারে মান যাচাই

**Plesk SSH Terminal** খুলে চালান:

```bash
whoami
```
→ এটাই **DEPLOY_USER** (উদাহরণ: bikr4470zg84)

```bash
cd ~/httpdocs && pwd
```
→ এটাই **DEPLOY_PATH** (উদাহরণ: `/var/www/vhosts/bikrans.com/httpdocs`)

```bash
cd ~/httpdocs && git pull
```
→ কাজ করলে ঠিক আছে। fail করলে Git credential চেক করুন।

---

## ⏳ ধাপ ৫: টেস্ট ডেপ্লয়

সব সেটআপের পর একটা ছোট পরিবর্তন করে push করুন। GitHub → **Actions** ট্যাবে workflow রান দেখবেন।
