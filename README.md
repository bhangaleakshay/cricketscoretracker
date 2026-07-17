# CrickTrack — Cricket Score Tracker

A React app for managing a master player list, teams (with captain/vice-captain),
scheduling matches, and live ball-by-ball scoring — including gully-cricket rules
like last-man-batting. Data is stored in [JSONBin.io](https://jsonbin.io), a free,
card-free JSON storage service, so it syncs across any device/browser you open
the app on.

## 1. Create your JSONBin account and bin

1. Go to https://jsonbin.io and sign up (email only — no card required).
2. Go to the **API Keys** page and copy your **Master Key**. Keep this
   private — you'll only use it once, to set things up. It never goes into
   the app itself.
3. Create a bin: on your dashboard click **Create Bin**, and paste this as
   the starting content:
   ```json
   { "players": [], "teams": [], "matches": [] }
   ```
   Save it, then note the **Bin ID** shown on the bin's page (also visible
   in the URL).
4. Create a scoped **Access Key**: go to **API Keys → Access Keys → Create
   Access Key**. Give it Read + Update permission on **only this bin**
   (leave out Create/Delete/Access-Keys permissions). This is the key that
   will actually ship inside your deployed app — scoping it like this means
   that even though it's visible in your site's JS bundle, the worst
   someone could do is read or overwrite this one bin's data, nothing else
   in your account.

## 2. Run it locally

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
VITE_JSONBIN_BIN_ID=<your bin id>
VITE_JSONBIN_ACCESS_KEY='<your scoped access key>'
```

If your access key contains `$`, use single quotes so dotenv does not expand it.

Then:

```bash
npm run dev
```

Open the printed local URL — the app should load, and anything you create
should show up when you view the bin's content on jsonbin.io.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(`.env` is git-ignored on purpose — the deployed site's config is set via
GitHub Secrets instead, next step.)

## 4. Add your JSONBin config as GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions → New repository
secret**. Add:

- `VITE_JSONBIN_BIN_ID`
- `VITE_JSONBIN_ACCESS_KEY`

(Use the same scoped Access Key from step 1 — not the Master Key.)

## 5. Turn on GitHub Pages

In your repo: **Settings → Pages → Build and deployment → Source →
GitHub Actions**.

That's it — the included workflow (`.github/workflows/deploy.yml`) builds and
deploys automatically on every push to `main`. Check the **Actions** tab for
progress. Once it finishes, your app is live at:

```
https://<your-username>.github.io/<your-repo>/
```

## Notes

- **Rate limits**: JSONBin's free tier limits how many requests you can make.
  Team/player setup barely uses any. Live scoring writes on every ball, so
  the app batches rapid updates together and only sends one save to JSONBin
  about 700ms after you stop tapping, to stay well within the free limits.
- **Security**: the Access Key is visible to anyone who inspects your
  deployed site (this is unavoidable for any app with no backend server).
  Scoping it to Read + Update on just one bin, as set up above, keeps the
  blast radius small — worst case someone could see or overwrite your
  cricket data, nothing else.
- **Single bin, single "workspace"**: all data lives in one bin. If you want
  fully separate data for different groups, create a separate bin (and
  Access Key) per group and swap the `.env` values.
