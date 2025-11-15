# TODO: Enhance Connect Wallet Functionality

## Information Gathered
- The `ConnectWallet` component in `projects/yield_router-frontend/src/components/ConnectWallet.tsx` renders available wallets from the `useWallet` hook.
- Wallets are configured in `main.tsx` with DeflyWalletConnect and PeraWalletConnect.
- The modal displays wallet icons from `wallet.metadata.icon` and handles connection via `wallet.connect()`.
- Currently supports Defly and Pera wallets; Petra wallet needs to be added (assuming it's another Algorand wallet like MyAlgo).
- No QR code popup exists; connection is direct.
- No persistence for wallet choice; disconnection clears localStorage.
- Error handling is basic; needs improvement to eliminate connection errors.

## Plan
1. **Add More Wallet Support**
   - Install additional wallet packages: `@randlabs/myalgo-connect` (MyAlgo/Petra).
   - Update `main.tsx` to include MyAlgo wallet in the wallets array.
   - Update `package.json` with the new dependencies.

2. **Implement QR Code Popup**
   - Install `qrcode.react` for generating QR codes.
   - Modify `ConnectWallet.tsx` to add state for `selectedWallet` and `showQR`.
   - Add a QR modal component that displays a QR code for wallet connection.
   - On wallet click, set `selectedWallet`, show QR modal, and initiate `wallet.connect()`.
   - Use a placeholder URI for QR (e.g., wallet-specific connection URI if available).

3. **Add Wallet Choice Persistence**
   - Modify `ConnectWallet.tsx` to store the last connected wallet ID in localStorage on successful connection.
   - On component mount, if no active address, retrieve last wallet ID from localStorage and auto-connect.
   - On disconnect, remove the stored wallet ID.

4. **Improve Error Handling**
   - Enhance try-catch blocks in `ConnectWallet.tsx` with specific error messages.
   - Add retry logic or user-friendly prompts for connection failures.
   - Ensure no errors occur during connection by validating wallet availability.

## Dependent Files to be Edited
- `projects/yield_router-frontend/package.json`: Add `qrcode.react`, `@randlabs/myalgo-connect`.
- `projects/yield_router-frontend/src/main.tsx`: Add MyAlgo wallet to wallets array.
- `projects/yield_router-frontend/src/components/ConnectWallet.tsx`: Add QR modal, persistence logic, and improved error handling.

## Followup Steps
- Install new dependencies using `npm install`. ✅ Done
- Test wallet connections to ensure QR popup appears and persistence works.
- Verify that connection errors are handled gracefully without breaking the app.
- Run the app and check for any runtime errors or missing icons.
