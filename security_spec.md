# Security Specification - Warung Tomi User Photos

## Data Invariants
- A photo must have a valid user name as its document ID.
- The photo data must be a base64 string (size checked).

## The Dirty Dozen Payloads
1. Large payload (> 1MB) to `/userPhotos/test`
2. Invalid ID format for `/userPhotos/invalid name`
3. Missing `photo` field
4. Missing `nama` field
5. Invalid type for `updatedAt`
6. Non-string type for `photo`
7. Update attempt on `nama` field (immutable)
8. Unauthorized write (if auth was enforced, but here we use names)
9. Rapid fire updates (rate limiting - rule level)
10. Injecting script tags in `photo` string
11. Doc ID mismatch with `nama` field
12. Deleting someone else's photo (if ownership was strict)

## Test Runner
(Standard test file for verifying access)
