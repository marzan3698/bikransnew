# GitHub Actions দিয়ে অটো ডেপ্লয়মেন্ট

`main` ব্রাঞ্চে push করলে GitHub Actions স্বয়ংক্রিয়ভাবে Plesk সার্ভারে deploy করবে।

## সেটআপ (একবার)

### ১. SSH কী তৈরি করুন

লোকাল Terminal এ:

```bash
ssh-keygen -t ed25519 -a 200 -C "github-deploy"
```

ফাইলগুলো: `~/.ssh/id_ed25519_github_deploy` (private), `~/.ssh/id_ed25519_github_deploy.pub` (public)

### ২. সার্ভারে পাবলিক কী যোগ করুন

```bash
cat ~/.ssh/id_ed25519_github_deploy.pub | ssh bikr4470zg84@103.112.62.126 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```
*(আপনার SSH user ও host দিয়ে পরিবর্তন করুন। লোকাল থেকে SSH না গেলে File Manager ব্যবহার করুন।)*

অথবা Plesk **File Manager** → Home directory → `.ssh` → `authorized_keys` এডিট করে লোকালে `cat ~/.ssh/id_ed25519_github_deploy.pub` এর আউটপুট যোগ করুন।

### ৩. GitHub Secrets যোগ করুন

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret নাম | মান | উদাহরণ |
|------------|-----|--------|
| `DEPLOY_HOST` | সার্ভার আইপি অথবা ডোমেইন | `bikrans.com` বা `103.112.62.126` |
| `DEPLOY_USER` | **SSH ইউজারনেম** (Terminal prompt-এ যে নাম দেখায়, যেমন `bikr4470zg84`) | `bikr4470zg84` |
| `DEPLOY_SSH_KEY` | প্রাইভেট কীের পুরো কনটেন্ট | `-----BEGIN OPENSSH PRIVATE KEY-----` থেকে `-----END OPENSSH PRIVATE KEY-----` |
| `DEPLOY_PORT` | SSH পোর্ট (অপশনাল) | `22` (ডিফল্ট) |
| `DEPLOY_PATH` | প্রজেক্ট ফোল্ডার পাথ | `~/httpdocs` অথবা `/var/www/vhosts/bikrans.com/httpdocs` |

**প্রাইভেট কী কপি করুন (macOS):**

```bash
pbcopy < ~/.ssh/id_ed25519_github_deploy
```

তারপর GitHub-এ `DEPLOY_SSH_KEY` সিক্রেটে পেস্ট করুন।

### ৪. মান যাচাই করুন (সার্ভারে Plesk SSH Terminal)

এই কমান্ডগুলো চালান এবং ফলাফল নোট করুন:

```bash
whoami                    # DEPLOY_USER = এটা (যেমন bikr4470zg84)
cd ~/httpdocs && pwd      # DEPLOY_PATH = এটা (যেমন /var/www/vhosts/bikrans.com/httpdocs)
```

### ৫. Git pull পারমিশন চেক করুন

`cd ~/httpdocs && git pull` চালান। যদি কাজ করে তবে GitHub Actions-ও করবে। Private repo হলে credential সেট থাকতে হবে।

---

## কিভাবে কাজ করে

1. আপনি `git push origin main` করলেই
2. GitHub Actions ওয়ার্কফ্লো চালু হবে
3. ওয়ার্কফ্লো SSH দিয়ে সার্ভারে কানেক্ট করে:
   - `cd` প্রজেক্ট ফোল্ডারে
   - `git pull origin main`
   - `npm run build`
   - `npx pm2 restart bikrans`

---

## ট্রাবলশ্যুটিং

**"Permission denied (publickey)"**
- `DEPLOY_SSH_KEY` সঠিকভাবে কপি হয়েছে কিনা চেক করুন (শুরু-শেষ লাইন সহ)
- সার্ভারের `~/.ssh/authorized_keys`-এ পাবলিক কী আছে কিনা দেখুন

**"command not found: npm"**
- Plesk-এ Node.js পাথ আলাদা হতে পারে। SSH-এ `which npm` চালিয়ে পাথ নোট করুন। ওয়ার্কফ্লোতে সেই পাথ ব্যবহার করুন বা `~/.bashrc` / `~/.profile` সোর্স করুন।

**"git pull" fails**
- Private repo হলে সার্ভারে Git credential বা deploy token সেট করুন।

**"pm2 restart" fails**
- PM2 না থাকলে `2>/dev/null || true` দিয়ে skip হবে। nohup দিয়ে চালালে pm2 কমান্ড সরিয়ে দিতে পারেন।
