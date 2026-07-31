# FISOKUT-KAZAN (Receipt OCR & Cashback) - System Architecture & Development Guidelines

This document serves as the single source of truth for the AI Developer Agent.

## AGENT BEHAVIOR & STRICT RULES
1. DO NOT make assumptions when uncertain.
2. DO NOT hallucinate APIs, libraries, or architectural patterns not defined in this document.
3. IF UNCERTAIN OR BLOCKED: Stop immediately and ask the human supervisor for clarification before taking action.
4. Keep all responses clear, concise, and direct. Single sentence per idea. No fluff words.

---
---

## SYSTEM ARCHITECTURE OVERVIEW
A high-throughput, serverless PWA application that enables users to scan shopping receipts, validates receipt uniqueness via composite hashing, processes OCR using a hybrid approach, and grants cashbacks.

* Target Throughput: Designed to scale up to 1M daily active users (~300 RPS peak).
* Primary Stack: Next.js (App Router), PWA/TWA, Cloudflare R2, Upstash Redis, PostgreSQL (Neon/Supabase) via Prisma.
* OCR Strategy: Hybrid Engine (Primary: Open-Source OpenCV + PaddleOCR, Fallback: Google Cloud Vision API).

---

## SYSTEM FLOW

1. **Client (PWA):** Requests a presigned upload URL from Next.js API.
2. **Storage:** Client uploads image directly to Cloudflare R2 bucket.
3. **Queue:** Client notifies Next.js API. API pushes a job to Upstash Redis queue.
4. **Processing (Python Worker):** Worker pulls job, performs OpenCV preprocessing, and runs Primary OCR (PaddleOCR).
5. **Fallback Check:** If local OCR fails to extract VKN or Total Amount, worker routes image to Google Cloud Vision API.
6. **Validation:** System computes `SHA-256(VKN + Date + ReceiptNo + TotalAmount)` and checks database for duplicate hash.
7. **Persistence & Reward:** Stores transaction in PostgreSQL, credits user wallet atomically, and returns status via WebSocket/Polling.

---

## FOLDER STRUCTURE


```

.
├── .well-known/
│   └── assetlinks.json
├── public/
│   ├── manifest.json
│   └── icons/
├── src/                        # Next.js App Router (Fullstack Gateway)
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── receipts/
│   │   │       │   ├── upload-url/route.ts
│   │   │       │   └── process/route.ts
│   │   │       └── wallet/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # UI Components (Atomic Design)
│   │   ├── ui/
│   │   ├── camera/
│   │   └── receipt/
│   ├── core/                   # SOLID Core Domain & Business Logic
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── value-objects/
│   │   ├── use-cases/
│   │   ├── interfaces/
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   └── errors/
│   ├── infrastructure/         # External Implementations
│   │   ├── db/
│   │   ├── storage/
│   │   └── queue/
│   └── shared/                 # Utilities, Constants, Helpers
├── worker/                     # Python OCR Worker Service
│   ├── main.py
│   ├── preprocessing/
│   │   └── cv_cleaner.py
│   ├── ocr/
│   │   ├── base_engine.py
│   │   ├── paddle_engine.py
│   │   └── google_vision_engine.py
│   ├── parsers/
│   │   └── receipt_parser.py
│   ├── requirements.txt
│   └── Dockerfile
├── prisma/
│   └── schema.prisma
├── PROMPT.md
└── package.json

```

---

## HYBRID OCR PIPELINE STRATEGY

1. **Preprocessing (OpenCV):**
   * Convert image to grayscale.
   * Apply adaptive thresholding for thermal paper contrast enhancement.
   * Perform deskewing and perspective correction.
2. **Primary Execution (PaddleOCR):**
   * Run local PaddleOCR model on preprocessed buffer.
   * Extract key metadata via Regex:
     - VKN: `\b\d{10}\b`
     - Date/Time: `\d{2}[\/\.-]\d{2}[\/\.-]\d{4}`
     - Total Amount: Keyword matching (`TOPLAM`, `ÖDENEN`) + currency regex.
3. **Fallback Execution (Google Cloud Vision API):**
   * IF Primary Execution fails to reliably extract both `VKN` and `TotalAmount`:
     - Dispatch image buffer to Google Cloud Vision API.
     - Extract metadata from Vision text annotations.
     - Log execution flag as `fallback_used: true`.
4. **Composite Hash Generation:**
   $$\text{Hash} = \text{SHA256}(\text{VKN} + \text{Tarih/Saat} + \text{Fiş No} + \text{Toplam Tutar})$$

---

## SOLID & OOP STANDARDS

* **Single Responsibility Principle (SRP):** API routes handle HTTP concerns only. Core business logic stays strictly inside `core/use-cases`. Python worker handles image processing only.
* **Open/Closed Principle (OCP):** Worker OCR modules must extend an abstract `BaseOCREngine` class. New OCR engines can be integrated without modifying the worker execution pipeline.
* **Liskov Substitution Principle (LSP):** Concrete repository implementations (`PrismaReceiptRepository`, `MockReceiptRepository`) must be fully interchangeable via dependency injection.
* **Interface Segregation Principle (ISP):** Keep interfaces granular. Separate `IReceiptReader` from `IReceiptWriter`.
* **Dependency Inversion Principle (DIP):** High-level domain modules must not depend on low-level infrastructure modules. Both must depend on abstractions.

---

## FRONTEND DESIGN & UX SPECIFICATIONS

* **Tech:** React, Tailwind CSS, Lucide Icons, Framer Motion.
* **PWA / TWA Setup:** Responsive layout optimized for mobile viewports (`mobile-first`). Must include `manifest.json` and `.well-known/assetlinks.json`.
* **Camera Module:** WebRTC stream with custom document overlay bounds. Autocrop and compression prior to upload.
* **State Management:** Zustand for client state, TanStack Query (React Query) for server state management.

---

## OPTIMIZATION & SECURITY HARDENING

1. **Direct Uploads:** Clients upload directly to Cloudflare R2 using short-lived Presigned URLs (60-second validity). Never proxy file streams through Next.js server instances.
2. **Duplicate Prevention:** Database schema enforces a `@unique` index on `receipt_hash`.
3. **Atomic Transactions:** Wallet updates and receipt logs must execute within a single PostgreSQL transaction boundary (`prisma.$transaction`).
4. **Rate Limiting:** Protect upload URL endpoints using Upstash Rate Limiting.
5. **Reentrancy Protection:** Wallet balance mutations must be strictly locked to prevent race conditions during concurrent submissions.

---

## EXECUTION STEPS FOR AGENT

1. Configure Next.js App Router API gateway and Prisma schemas.
2. Setup Upstash Redis queue producer in Node.js infrastructure layer.
3. Construct Python Docker worker with OpenCV, PaddleOCR, and Google Vision SDK dependencies.
4. Implement hybrid OCR pipeline with regex parsing logic for Turkish thermal receipts.
5. Build PWA client with WebRTC camera capture and document crop guidelines.
6. Run integration tests to verify queue ingestion, OCR fallback triggers, and database persistence.

```