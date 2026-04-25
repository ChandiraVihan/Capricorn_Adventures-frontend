# Capricorn Adventures Frontend

Production React frontend for Capricorn Adventures customer and admin workflows.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
echo "VITE_BACKEND_BASE_URL=https://potential-space-parakeet-rx94wj5q9pq35w6w-8080.app.github.dev" > .env.local
```

3. Start development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Admin Dashboard Routes

- `/manager/operations` (MANAGER)
- `/owner/finance` (OWNER)
- `/manager/room-service` (MANAGER, ADMIN, STAFF)

## Role Testing Instructions

1. Sign in with a user account in each role (OWNER, MANAGER, ADMIN, STAFF).
2. Confirm route guard behavior:
- OWNER can access `/owner/finance`.
- MANAGER can access `/manager/operations` and `/manager/room-service`.
- ADMIN can access `/manager/room-service`.
- STAFF can access `/manager/room-service` and update order status.
3. Validate API-backed behavior:
- Manager Operations auto-refresh, issue priority badges, guide assignment-required row highlighting.
- Owner Finance month picker refetch, variance colors, export XLSX.
- Room Service SSE live updates, 60s polling fallback, stale order highlighting, assignment/status actions.
4. Shift overview owner warning handling:
- If shift-overview returns 401 for OWNER, UI shows access warning without crashing.
