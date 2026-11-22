# Firestore Security Specification (Phase 0)

## Data Invariants
1. Every `/players/{uid}` document belongs strictly to `uid == request.auth.uid`, carries an immutable 8-character `playerCode` matching `^RK[0-9A-Z]{6}$`, and stores zero PII (`email` is isolated in `/usersPrivate/{uid}`).
2. Every `/playerCodes/{playerCode}` document is atomically paired with `/players/{uid}` (`existsAfter`), preventing orphaned or hijacked Player IDs.
3. Only the verified owner (`request.auth.token.email == 'rekarkurd1111@gmail.com' && request.auth.token.email_verified == true`) can create `/currencyGrants/{grantId}` or list all players/codes.
4. Regular users can only read/write their own `/usersPrivate/{uid}`, manage their own `/friendships/{uid}/list/{friendUid}`, look up friends by exact `get` on `/playerCodes/{playerCode}` or `/players/{uid}`, and mark their own unclaimed grants as `claimed = true`.
5. No client-provided timestamps (`createdAt`, `updatedAt`, `addedAt`, `claimedAt` must equal `request.time`) and strict `affectedKeys().hasOnly(...)` + `keys().hasOnly(...)` guards reject any ghost/shadow fields.
6. Every `/weeklyTop/{entryId}` record is keyed strictly as `{weekKey}_{uid}`, stores zero PII, enforces `isPublic == true` on public queries, and can only be created or updated by its verified owner (`uid == request.auth.uid`) or Admin.

## Dirty Dozen Adversarial Payloads (All MUST Return PERMISSION_DENIED)
1. **Unauthenticated read on `/players/u1`** -> Denied (`request.auth == null`).
2. **Email spoofing Admin (`email: 'rekarkurd1111@gmail.com', email_verified: false`)** -> Denied (`isAdmin()` requires `email_verified == true`).
3. **Shadow field on `/players/u1` create (`isAdmin: true`)** -> Denied (`keys().hasOnly(...)` blocks extra fields).
4. **UID spoofing on `/players/u2` create as `u1`** -> Denied (`isOwner(uid)` enforces `request.auth.uid == uid`).
5. **Mutating immutable `playerCode` on `/players/u1` update** -> Denied (`incoming().playerCode == existing().playerCode`).
6. **Non-owner reading PII `/usersPrivate/u2` as `u1`** -> Denied (`isOwner(uid) || isAdmin()`).
7. **Blanket list query on `/players` as non-admin** -> Denied (`allow list` requires `isAdmin()` or `resource.data.uid == request.auth.uid`).
8. **Blanket list query on `/currencyGrants` as `u1` without `targetUid == u1`** -> Denied (`resource.data.targetUid == request.auth.uid`).
9. **Non-admin forging `/currencyGrants/g1`** -> Denied (`allow create: if isAdmin()`).
10. **Target player inflating `coins` while claiming `/currencyGrants/g1`** -> Denied (`incoming().coins == existing().coins`).
11. **Oversized `displayName` (200 chars) or junk ID (`../bad`)** -> Denied (`isValidId` + `displayName.size() <= 24`).
12. **Client-forged `createdAt` timestamp not equal to `request.time`, or spoofing another user's `/weeklyTop/2026-W47_u2`** -> Denied (`incoming().createdAt == request.time` and `entryId == weekKey + '_' + request.auth.uid`).
