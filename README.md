# Meridian Banking — Zheng Shaotong

- Deployed: [Vercel](https://meridian-banking-seven.vercel.app/)
- Run locally: `npm install && npm run dev`

## Project structure

- .github/workflows: GitHub Actions CI and deployment
- src/api: API requests and types
- src/components: UI components, including Dashboard and TransferDialog
- src/hooks: Search debounce hook
- src/lib: Debug settings and formatting
- src/test: Test setup
- src/utils: Form validation

## Decisions and trade-offs

- Server state and UI state: TanStack Query manages API data. React local state manages search input, account selection, and transfer steps. Totals and remaining limits are calculated from API data to avoid duplicate state.
- Transaction search: Search uses the API parameters q and accountId. This includes transactions beyond the first eight rows. A 250 ms debounce reduces requests. Query keys include both filters. This approach requires loading and error states during search.
- Data after a transfer: After a successful transfer, the app refreshes dashboard data before it shows the success screen. This avoids manual cache updates but adds a delay. If the refresh fails, the success screen hides “Make another transfer” because balances may be outdated.
- Forms and validation: React Hook Form manages field state. Zod defines each validation rule once. Validation runs on blur and Continue. Amount checks use the selected account balance and remaining daily limit. Bank options and validation share one constant. Editing clears displayed errors, but this can also hide errors in unchanged fields.
- Components and loading layouts: Dashboard sections and transfer steps use separate components. The transfer dialog keeps shared form state and submission logic. Loading placeholders reuse the dashboard structure to reduce layout differences. This adds loading properties to presentation components.
- Native interaction: The app uses native `<dialog>`, radio inputs, and buttons for keyboard interaction. The dialog also locks background scrolling and restores focus when closed.
- Account selection: The design does not specify whether account cards are clickable. The API supports filtering transactions by accountId. I made the cards clickable so users can view transactions for one account. Clicking the selected card again clears the account filter.

## Loading, empty and error states

Open **Debug**, change the API settings, then click **Apply**.

- **Loading:** The dashboard, transactions, and payees show skeletons. Dashboard controls are disabled during initial loading. Set an API delay to `5000` ms to see this state.
- **Empty:** Lists show an empty message. Transaction searches with no matches also offer **Clear search**. Set the accounts, transactions, or payees API to `empty` to see the state.
- **Errors:** Failed data requests show an error and a retry button. Set a GET API to `error` to see this state. To test a transfer failure, enter `#fail` in the note and confirm. The form keeps your input so you can edit and retry.

## Tests

Tests use Vitest, React Testing Library, and MSW. They check user actions and visible results, including the three required cases.

- **Happy flow:** The dashboard shows account data. A successful transfer updates balances, transactions, and the daily limit.
- **API failures:** Failed requests show errors. A failed transfer does not show success or change balances.
- **Validation:** An amount over the balance shows an error, focuses the field, and sends no request.
- **Retry:** The dashboard loads after Retry. A failed transfer keeps its details and can succeed on retry.
- **Theme changes:** All four theme and segment combinations work. Preferences are saved.
- **Loading skeletons:** Skeletons appear during loading. Dashboard controls remain disabled until data arrives.

I chose these cases to check financial accuracy, recovery from failures, and the main UI states.

## AI use

I used ChatGPT (Codex) with GPT-6 Astra and GPT-6.1 Sol to build the basic components and their CSS styles. I also used AI to build test cases.

I reviewed the AI output and requested these changes:

- **Component structure:** The AI initially kept dashboard sections and transfer steps in large components. I extracted them into into separate components. This makes the code easier to read and change without duplicating state.
- **Bank validation:** The AI added length limits to a field with fixed options. I changed to use `z.enum()` and share the list with the dropdown. This made the rule simpler and kept validation consistent with the options.
- **Transfer dialog:** Escape could still close the dialog during a transfer. I found the issue when testing in browsers and added a correction because it could leave dashboard showing outdated data to user and scrolling locked.

## Not done / known issues

- The app does not track system theme changes while it is open.
- The transfer success screen waits for the dashboard refresh.
