# ASN Rush v27 - Top 50 + Admin Reset

This build is connected to Firebase project `asn-rush-commercial-day`.

## What changed
- In-game leaderboard: Top 10, live + explicit refresh every 5 seconds.
- Big-screen leaderboard: Top 50, live + explicit refresh every 5 seconds.
- Admin panel on `leaderboard.html`.
- Admin can log in with Firebase Email/Password and reset all scores.

## One-time Firebase setup for Admin Reset
1. Firebase Console -> Build -> Authentication.
2. Click Get started.
3. Sign-in method -> Email/Password -> Enable.
4. Users -> Add user.
5. Create your admin email/password.
6. Realtime Database -> Rules -> replace with the contents of `firebase-rules.json` -> Publish.

Normal players do NOT need to sign in. They can submit new scores.
Authenticated admin users can delete/reset leaderboard data.

## Pages
- Game: `index.html`
- Big-screen Top 50: `leaderboard.html`
