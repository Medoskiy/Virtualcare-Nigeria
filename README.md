# Virtualcare Nigeria

Nigeria's most trusted telemedicine platform — connecting patients across all 36 states with MDCN-certified doctors.

## Features

- MDCN-verified doctor profiles
- Paystack payment integration (Cards, Bank Transfer, USSD, Mobile Money)
- Video/Audio consultations via Daily.co
- 25% returning patient discount
- 70/30 revenue split (doctor/platform)
- OctaAI medical assistant with Nigerian health context
- NDPR-compliant data handling
- All 36 Nigerian states + FCT coverage

## Demo Accounts

| Role    | Email                          | Password   |
|---------|--------------------------------|------------|
| Patient | patient@virtualcare.com        | patient123 |
| Doctor  | doctor@virtualcare.com         | doctor123  |
| Admin   | admin@virtualcare.com          | admin123   |

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo data seeds automatically on server start.

## Currency

All prices in Nigerian Naira (₦). Payments processed via Paystack.

## Compliance

- MDCN (Medical and Dental Council of Nigeria) verification
- NDPR (Nigeria Data Protection Regulation) 2019 compliant
- WAT (West Africa Time, UTC+1) timezone

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Payments:** Paystack (NGN)
- **Video:** Daily.co
- **AI:** OpenAI GPT-4o with Nigerian medical context
- **PWA:** Service Worker + Web App Manifest

## License

MIT
