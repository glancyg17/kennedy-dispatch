# Setting up online payments

This teaches your dispatch app how to create a Stripe payment link (for a
deposit or balance) without putting your secret Stripe password ("secret
key") anywhere someone could find it by looking at the website's code.

You'll do two things:
1. Put one file in the right place in your GitHub folder
2. Run a handful of commands in Terminal, one time, to switch it on

Nothing here touches your existing `index.html` — this is a separate,
self-contained piece. We'll wire it into the app afterwards, as its own
task.

---

## Step 1 — Put the file in place

Unzip this download. You'll see a folder called `supabase`. Drag that whole
folder into your `kennedy-dispatch` project folder, next to `index.html`, so
it looks like this:

```
kennedy-dispatch/
├── index.html
├── logo.png
├── app-icon.png
├── manifest.json
├── sw.js
└── supabase/                  ← the folder you just added
```

Commit and push it up like normal (GitHub Desktop: Commit, then Push). It
won't show up on the live website — it's just there so it's backed up and
so Supabase can find it in the next step.

## Step 2 — Install one tool (one-time, on your computer)

Open Terminal (on a Mac: press Cmd+Space, type "Terminal", press Enter) and
paste this in, then press Enter:

```bash
npm install -g supabase
```

This installs a small tool that lets you talk to your Supabase account from
Terminal. If it asks for your Mac password, that's normal — type it (it
won't show on screen as you type) and press Enter.

## Step 3 — Connect Terminal to your Supabase account

```bash
supabase login
```

This opens a browser window — click to approve it, then come back to
Terminal.

Then run:

```bash
supabase link --project-ref mpdrshyxefrptitbqnbi
```

This just tells the tool "use my dispatch app's database."

## Step 4 — Store your Stripe secret key safely

This is the important bit. Your Stripe secret key should never be pasted
into `index.html` or anywhere public. This command stores it securely on
Supabase's own servers instead, where only this one function can use it.

Use your **test** key first (it starts with `sk_test_`, not `sk_live_`) so
we can prove everything works before any real money is involved:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_paste_your_key_here
```

## Step 5 — Switch it on

```bash
supabase functions deploy create-payment-link
```

This uploads the file from Step 1 and turns it into a working link-creator.
When it finishes, it'll print a web address — something like:

```
https://mpdrshyxefrptitbqnbi.functions.supabase.co/create-payment-link
```

That's the address the dispatch app will call whenever it needs to create a
payment link. Keep it handy for later — wiring it into `index.html` is a
separate task, not something to do right now.

## Step 6 — Test that it actually works

Paste this into Terminal (it's all one line, even though it wraps on
screen), then press Enter:

```bash
curl -X POST https://mpdrshyxefrptitbqnbi.functions.supabase.co/create-payment-link -H "Content-Type: application/json" -d '{"amount_pence": 2450, "description": "Test deposit", "job_id": "test-1", "customer_name": "Test Customer"}'
```

You should see something like:

```json
{"url": "https://buy.stripe.com/...", "link_id": "plink_..."}
```

Copy that `url` into a browser. It should open a Stripe payment page asking
for £24.50. Pay it using Stripe's fake test card:

- Card number: `4242 4242 4242 4242`
- Expiry: any date in the future
- CVC: any 3 digits

Then check Stripe → Payments in your browser (make sure the little toggle
in the top-right says **test mode**) — you should see the £24.50 payment
sitting there. If you see it, this part is done and working.

---

## When you're ready to take real payments

Run Step 4 again, but with your **live** key instead (starts with
`sk_live_`):

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_paste_your_live_key_here
```

No need to repeat the other steps — it takes effect immediately.

## If something goes wrong

Whatever Terminal prints back will usually explain what's wrong in fairly
plain English (e.g. "invalid API key" means Step 4 needs redoing). Copy the
exact message and send it over — that's all that's needed to fix it, no
need to guess what happened.
