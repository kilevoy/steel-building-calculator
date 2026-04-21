# TODO

## Release Checklist

- [ ] validate `npm run build` on a clean machine
- [x] keep `npm test` green
- [x] keep `npm run test:e2e` green
- [x] keep `npm run lint` green without manual prep
- [x] keep `npm run generate:purlin-ref` stable against checked-in generated data
- [x] keep `npm run generate:column-ref` stable against checked-in generated data
- [ ] lock workbook source-of-truth and versioning policy
- [ ] approve 5-10 engineering reference scenarios against Excel manually using `docs/ENGINEERING_ACCEPTANCE_CASES.md`
- [ ] document accepted tolerances for profile, step, mass, and loads
- [x] show clear out-of-range and error states in the UI
- [x] document startup, generation, and verify cycle in `README.md`
- [ ] run final release smoke on the target delivery environment

## Next Priorities

1. Lock workbook source-of-truth and ownership
2. Approve engineering reference scenarios with domain stakeholders
3. Record release smoke results on the target machine
