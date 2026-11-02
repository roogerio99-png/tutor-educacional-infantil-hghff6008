# Security Specification — Lumi IA (Tutor Educacional Inteligente)

## 1. Authentication & Identity Model
- **Primary Auth**: Firebase Authentication (Google Sign-In via `signInWithPopup` and Email/Password).
- **Principal Isolation**: Each authenticated parent (`request.auth.uid`) owns a single isolated document at `/families/{userId}` where `userId == request.auth.uid`.
- **Admin Override**: The project owner (`roogerio99@gmail.com` with `email_verified == true`) has administrative audit/read capability if required.

## 2. Paths & Access Control Matrix
| Path | Read (`get`, `list`) | Create (`create`) | Update (`update`) | Delete (`delete`) |
| :--- | :--- | :--- | :--- | :--- |
| `/families/{userId}` | Owner (`request.auth.uid == userId`) | Owner (`request.auth.uid == userId`) + valid schema | Owner (`request.auth.uid == userId`) + valid schema + immutable `ownerId`, `createdAt` | Owner (`request.auth.uid == userId`) |
| `/{document=**}` | Deny (`false`) | Deny (`false`) | Deny (`false`) | Deny (`false`) |

## 3. Data Validation & Bounds (`FamilyWorkspace`)
- Exact keys enforced via `.keys().hasAll(...)` and `.keys().hasOnly(...)`:
  - `ownerId`: `string`, must equal `userId` and `request.auth.uid`, length `1..128`.
  - `email`: `string`, valid email format, length `3..254`.
  - `name`: `string`, length `1..120`.
  - `payloadJson`: `string`, serialized JSON of the family's children, agenda, memories, and emotional check-ins, length `2..900000` (~900KB max to prevent document bloat).
  - `createdAt`: `string`, length `10..40`, immutable on update.
  - `updatedAt`: `string`, length `10..40`.
