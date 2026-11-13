# Custom Gifts Studio

## Run locally with Razorpay test mode

1. Install Node.js (version 18 or newer).
2. Copy `.env.example` to `.env`.
3. Add your Razorpay **Test Mode** Key ID and Key Secret to `.env`.
4. In Razorpay Dashboard, enable automatic payment capture.
5. Run `npm install`, then `npm start`.
6. Open `http://localhost:3000` and test with Razorpay test payment details.

The backend calculates prices from its own product catalogue and verifies the
Razorpay signature and captured payment before showing success. Keep the
product prices in `server.js` in sync with the catalogue in `script.js`.
Each product's **Buy Now** button opens a customisation form for optional print
text, design instructions, and a JPG/PNG/WEBP image up to 8 MB. Images are
validated and stored privately in the local `uploads/` folder; their random
filenames are attached to Razorpay order notes. Back up `uploads/` and use
persistent private storage when deploying.

Email/password signup and sign-in are also served by the backend. Passwords are
stored as salted hashes in the local `accounts.json` file; active sessions are
kept in memory and will end when the server restarts. Google and Apple sign-in
are not shown because provider credentials have not been configured.

Never put the Key Secret in browser code or commit `.env`. Before accepting live
payments or customer accounts, deploy behind HTTPS with a persistent database,
backups, and appropriate production security controls. Replace test keys with
live keys only after Razorpay account activation.
