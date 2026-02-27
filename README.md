## Withdraw Demo (Next.js + TypeScript)

This is a small Next.js 16 (App Router) demo implementing a withdraw flow with:

- **Withdraw page** at `/withdraw`
- **Zod + react-hook-form** validation
- **Zustand** state management (form state + request state + last withdrawal)
- **Typed API client** using `fetch`
- **Vitest + React Testing Library + MSW** tests

---

### Setup & Run

- **Install dependencies**

```bash
npm install
```

- **Run the dev server**

```bash
npm run dev
```

Then open `http://localhost:3000/withdraw` in your browser.

By default the app uses **Next.js Route Handlers** as a mock backend:

- `POST /api/v1/withdrawals`
- `GET /api/v1/withdrawals/{id}`

You can point the client to a real backend by setting `NEXT_PUBLIC_API_BASE_URL`, for example:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

---

### Running Tests

This project uses **Vitest** + **React Testing Library** + **MSW**.

- **Run the test suite**

```bash
npm test
```

- **Watch mode**

```bash
npm run test:watch
```

Tests live under `src/tests/` and include:

- **Happy-path submit** that shows success UI and fetched status
- **API conflict (409) error** that shows a clear message
- **Double-submit protection** that verifies only a single POST call is made

---

### Architecture & Key Decisions

- **App Router + TypeScript**
  - Uses `app` with `layout.tsx` and a dedicated `withdraw` route.
- **State management**
  - `src/features/withdraw/model/store.ts` uses **Zustand** with a clear state machine:
    - `idle | loading | success | error`
  - Store holds **form values**, **request status**, **error metadata**, and **last created withdrawal**.
- **Form & validation**
  - `WithdrawForm` (`src/features/withdraw/ui/WithdrawForm.tsx`) is a client component.
  - Uses **react-hook-form** with **Zod** resolver:
    - `amount`: number, must be **> 0**
    - `destination`: non-empty string
    - `confirm`: checkbox that must be checked
  - The **submit button is enabled only when the form is valid**, and is disabled while the request is in-flight.
- **API client**
  - `src/shared/api/client.ts` wraps `fetch` and:
    - Centralizes **base URL** via `NEXT_PUBLIC_API_BASE_URL`
    - Throws typed **`ApiError`** and **`NetworkError`**
  - `src/features/withdraw/api/withdrawApi.ts` provides typed helpers `createWithdrawal` and `getWithdrawal`.
- **Idempotency & double submit**
  - The store maintains a **`currentIdempotencyKey`**:
    - Generated per **submission attempt**
    - Sent as `idempotency_key` on `POST /v1/withdrawals`
    - Re-used on **network retry** so repeated transmissions for the same attempt remain idempotent.
  - Double submit is prevented by:
    - **UI guard**: submit button disabled while loading.
    - **Code guard**: store early-returns if state is `loading`.

---

### Error Handling & UI Resilience

- **Explicit state machine** in the store:
  - `idle` – initial form
  - `loading` – request in-flight
  - `success` – withdrawal created and status fetched
  - `error` – error encountered (conflict, network, or generic API error)
- **Error types**
  - `409` conflict → user-friendly message:
    - “This withdrawal request was already submitted. Please wait for status.”
  - **Network error** → keeps form values and exposes a **Retry** button without losing inputs.
  - Other API errors → generic safe message.
- After a **successful POST**, the app performs at least one **`GET /v1/withdrawals/{id}`** to show the latest status.

---

### Security Notes

This demo does **not** implement a real authentication system. No tokens are stored anywhere.

In a production application:

- **Authentication**
  - Use **httpOnly, secure cookies** to store access/refresh tokens instead of `localStorage` or `sessionStorage`.
  - Protect against **XSS** by never exposing raw tokens to JavaScript and by avoiding `dangerouslySetInnerHTML` (also not used in this demo).
- **CSRF protection**
  - Pair cookie-based auth with a robust **CSRF strategy**:
    - SameSite cookies (e.g. `SameSite=Lax`/`Strict`)
    - Anti-CSRF tokens (double-submit cookie or synchronizer token pattern)
    - CSRF protection on server-side routes handling state-changing requests (`POST /v1/withdrawals`, etc.).
- **Input validation & backend checks**
  - Backend must re-validate:
    - **Amount** (e.g. > 0, within account balance)
    - **Destination** (matches allowed formats, whitelisted accounts, etc.).
  - Backend must enforce **idempotency** keyed by `idempotency_key` + user/account to prevent duplicate withdrawals.

This implementation focuses on frontend concerns and testing, while respecting these constraints:

- No `dangerouslySetInnerHTML` is used.
- No credentials or tokens are stored in `localStorage` or similar browser storage.
