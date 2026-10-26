# StealthOS — Stellar Frontend

StealthOS is a multichain financial privacy application powered by **Vanta, our proprietary zero-knowledge transaction protocol developed and owned by StealthOS**. The Stellar integration combines Soroban smart-contract settlement, encrypted private notes and cryptographic proofs to support private XLM transfers.

Users deposit XLM into a contract-backed pool, transfer ownership through private payments, and withdraw to a Stellar account. Transaction validity is verified while internal payment amounts and recipient identities remain concealed from public settlement fields.

The Stellar frontend is built with React and TypeScript and integrates Freighter for wallet connection, signing and deposit approval.

## Vanta — our proprietary privacy technology

We built Vanta to make private payments practical inside a multichain wallet. Our engineering priorities are fast proof generation, reliable transaction preparation and a consistent payment experience across networks. Developing our own protocol gives StealthOS control over the privacy architecture, performance and wallet integration.

**Our reported internal native benchmark generates the complete Vanta proof in approximately 2.7 seconds.** Fast proof generation is central to our design: users should be able to make private payments through an ordinary payment flow.

The 2.7-second result measures native proof generation. Browser preparation, browser proof generation and blockchain confirmation have separate timings; it is not an end-to-end transaction time.

Vanta, developed and owned by StealthOS, verifies that a private payment follows the protocol's rules while protecting internal recipient and amount information. The Stellar integration brings our proprietary technology to Soroban settlement and Freighter-connected wallets.

## Why Stellar?

Payments can reveal more than a balance: salaries, supplier relationships and personal spending can become visible through public transaction histories.

Using Vanta, our proprietary privacy technology, StealthOS adds a privacy layer for payroll, supplier payments and everyday transfers on Stellar. Users can transact privately within the pool and return funds to their Stellar accounts when needed.

## What we built on Stellar

We engineered the transaction pipeline that connects our proprietary Vanta protocol to browser-based proving, Soroban settlement and a recoverable private wallet.

### Vanta proof integration

Our Vanta architecture combines **ccGroth16, Caulk+ and CP_link**. Together, these establish transaction validity, prove private-note membership in an authenticated commitment table, and link the authorization and membership commitments. We adapted the existing Vanta development proof family to the Stellar transaction flow, keeping the prover, verification material and deployed pool configuration aligned.

### Browser proving with WebAssembly

We integrated a **Rust-based prover compiled to WebAssembly**, running through a dedicated browser worker. The browser engine loads and validates the matching proving resources, initializes the Vanta engine and prepares private-payment proofs without blocking the main interface. Resource integrity checks bind the loaded artifacts to the expected deployment.

### Soroban private-pool settlement

We implemented and deployed Stellar Testnet contracts for **XLM deposits, private transfers and public withdrawals**. The pool maintains note commitments and spent-note nullifiers so accepted private payments update the commitment state and spent inputs cannot be reused. The current demonstration pool has a 256-row commitment table.

### Deposit compatibility and storage-cost engineering

We built a compact-return deposit adapter to accommodate Soroban's transaction return-data limit while preserving the existing pool and its notes. Deposit receipt validation checks the adapter call, forwarding to the intended pool, the XLM transfer and the corresponding note commitment.

We also separated one-time deployment and prepaid-storage costs from recurring transaction costs. In the replacement-pool Testnet acceptance run, a private transfer charged **0.0097836 XLM in network fees**, with zero incremental storage rent. The protocol fee was a separate **0.01 XLM**.

### Submission, receipts and recovery

The transaction pipeline handles proof preparation, fee quotes, simulation, submission and ledger confirmation as distinct stages. The wallet authenticates settlement receipts before reporting success and reconciles uncertain submissions against ledger evidence. Expired-quote recovery can reuse an existing private proof, while persistent payment records protect against duplicate submission after reloads or backend restarts.

### Encrypted note discovery and recipient addressing

The recipient's wallet discovers and decrypts its payment notes and can spend them using its own credentials. We added a signed receiving-address directory so a user can enter a registered **Stellar G-address**, resolve its associated private receiving identity and use the existing Vanta private-transfer flow. Registration and lookup verification bind that association to the intended network, pool, asset and receiving address.

### Freighter and the shared wallet

We integrated these components into the existing React and TypeScript wallet: Freighter connection and unlock approval, Add XLM, private Send and Receive, authenticated balances, transaction history, encrypted recovery and a visible Withdraw action. Private payments and public exits have distinct review screens, fee information and confirmation states.

## Ecosystem and roadmap

StealthOS's ecosystem work and expansion plans span **Base, Arbitrum and DogeOS**, alongside our Stellar integration. Our shared wallet brings Base, Solana, DogeOS and Stellar into one interface, with network-specific transaction flows.

**StealthOS has a partnership with DogeOS, with integration planned to coincide with DogeOS's upcoming network launch.** The Stellar implementation presented at HackMeridian extends our proprietary Vanta technology to the Stellar ecosystem as part of this broader multichain strategy.

## User journey

**Choose Stellar → Connect Freighter → Add XLM → Send privately → Receive → Withdraw**

Freighter authorizes wallet access and public deposits. Our Vanta protocol powers private transfers, while StealthOS manages private balances, recipient discovery, payment confirmation and recovery. Withdrawals return XLM to the connected Stellar account.

## Privacy boundaries

Internal private payments are designed to keep the recipient and transferred amount out of public settlement fields. Blockchain metadata—including transaction hashes, contract activity, fees and timing—remains observable.

Deposits and withdrawals are public. A withdrawal reveals its destination and amount.

## Development status

The demonstrated integration uses faucet-funded Stellar Testnet assets. It uses development cryptography and is unsuitable for real-value custody or Mainnet use.

## Run the frontend
The passcode for entering the link is Demo@135 
Use Node.js 24 or newer.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite and select **Explore Stellar interface**. Navigate the wallet screens and preview the transaction forms.

```bash
npm test
npm run build
npm run preview
```

The production build is written to `dist/`.

## Ownership

Vanta is proprietary technology developed and owned by StealthOS.

© 2026 StealthOS. All rights reserved.
