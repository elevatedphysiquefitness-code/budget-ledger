# Budget Ledger — Setup Guide

Thanks for trying this out! Budget Ledger is a personal budgeting app that runs entirely on
your own computer — it's never uploaded to any company's servers. It can optionally be opened
from your phone too, but only over your own home WiFi (see below), never over the internet.

## Installing

### On a Mac
1. Double-click the file `Budget Ledger-<version>-arm64.dmg` to open it.
2. Drag the **Budget Ledger** icon into the **Applications** folder shown in the window.
3. Open your **Applications** folder and double-click **Budget Ledger**.
4. You'll see a warning that says the app is from an "unidentified developer" — this is
   normal for apps not distributed through the Mac App Store. To open it anyway:
   - Right-click (or Control-click) the **Budget Ledger** app icon and choose **Open**.
   - Click **Open** again in the dialog that appears.
   - You only need to do this once — after that it opens normally.
5. macOS may also ask "Do you want the application 'Budget Ledger' to accept incoming
   network connections?" — click **Allow**. This is what lets you open the app from your
   phone (see below); it's not needed if you'll only ever use it on this computer.

### On Windows
1. Double-click `Budget Ledger Setup <version>.exe` to run the installer.
2. Windows may show a blue "Windows protected your PC" screen (SmartScreen). This is
   normal for apps that aren't signed with a paid certificate. Click **More info**, then
   click **Run anyway**.
3. Follow the install wizard, then launch **Budget Ledger** from the Start Menu.

## First time opening the app

The app starts empty — no bills, cards, or transactions are pre-loaded. Use the screens
in the app to add your own:
- **Bills** — recurring bills with due dates
- **Cards** — credit cards, balances, and limits
- **More → Pay schedule** — your paydays and paycheck amount
- **More → Where it goes** — how you want to split your leftover income
- **Transactions** — your account activity, or connect a bank in **More → Settings**
  (optional — the app works fine without it)

Everything you enter is saved automatically to a file on your own computer. Nothing is
uploaded anywhere.

## Using it on your phone

The computer running Budget Ledger needs to stay on and awake, and your phone needs to be
on the same WiFi network as that computer.

1. On the computer, open **More → Settings** in the app and look under **Access from your
   phone** for a web address (something like `http://192.168.1.23:47821`).
2. Type that address into your phone's browser (Safari or Chrome). Bookmark it or add it to
   your home screen for quick access.
3. Optional but recommended: set a PIN in **More → Settings → App Lock** first — without
   one, anyone on the same WiFi who knows or guesses that address could open the app too.

## Trouble opening it?

If the app won't open at all after following the steps above, it's likely a strict
security setting on your computer blocking unsigned apps. Let whoever gave you this app
know, along with any error message you see.
