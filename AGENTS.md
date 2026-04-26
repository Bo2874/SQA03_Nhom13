# Agent Instructions

This repository contains three application surfaces plus a dedicated test harness. Keep changes inside the owning area unless the task explicitly crosses boundaries.

- [src_code/README.md](src_code/README.md) is the top-level entry point for setup and linked project docs.
- [src_code/elearning-backend/](src_code/elearning-backend/) is the NestJS API. The main ownership boundaries are `src/modules/`, `src/entities/`, `src/config/`, and `src/common/`.
- [src_code/elearning-frontend/](src_code/elearning-frontend/) is the Next.js app. The main ownership boundaries are `src/app/`, `src/apis/`, `src/store/`, `src/services/`, and `src/middleware.ts`.
- [src_code/elearning-admin/](src_code/elearning-admin/) is the Vite admin app. The main ownership boundaries are `src/pages/`, `src/components/`, `src/contexts/`, and `src/utils/`.
- [src_test/unit_test/Unit_test_script_16_24/](src_test/unit_test/Unit_test_script_16_24/) contains the unit/coverage harness and per-STT scripts.

Before editing, read the closest package README and package.json so validation matches the touched surface.

## Prefer These References

- [src_code/elearning-backend/README.md](src_code/elearning-backend/README.md)
- [src_code/elearning-frontend/README.md](src_code/elearning-frontend/README.md)
- [src_code/elearning-frontend/TEST_UI_CHEATSHEET.md](src_code/elearning-frontend/TEST_UI_CHEATSHEET.md)
- [src_code/elearning-frontend/MOCK_MODE_GUIDE.md](src_code/elearning-frontend/MOCK_MODE_GUIDE.md)
- [src_code/elearning-admin/README.md](src_code/elearning-admin/README.md)
- [src_test/unit_test/Unit_test_script_16_24/HTML_COVERAGE_CHUAN_HOA_PLAN.md](src_test/unit_test/Unit_test_script_16_24/HTML_COVERAGE_CHUAN_HOA_PLAN.md)
- [src_test/unit_test/Unit_test_script_16_24/package.json](src_test/unit_test/Unit_test_script_16_24/package.json)

## Common Commands

- Backend: `cd src_code/elearning-backend && npm run start:dev`, `npm run build`, `npm run test`, `npm run test:e2e`, `npm run lint`
- Frontend: `cd src_code/elearning-frontend && npm run dev`, `npm run build`, `npm run lint`
- Admin: `cd src_code/elearning-admin && npm run dev`, `npm run build`, `npm run lint`
- Unit test harness: `cd src_test/unit_test/Unit_test_script_16_24 && npm run test:17` through `npm run test:27`, plus the matching `coverage:*` scripts when working on coverage output

## Working Rules

- Prefer the narrowest validation command for the slice you touched.
- Keep frontend auth and route work aligned with the mock-mode docs until the real API toggle is intentionally changed.
- Treat backend changes as module-local unless the task clearly needs cross-module refactoring.
- Do not duplicate longer procedures here; link to the source docs instead.