# Finzo - Personal Finance & Task Management

A modern web application for managing personal finances and tasks with Google authentication, built with Next.js, Firebase, and Tailwind CSS.

## Features

### Finance Mode
- Track income and expenses with intuitive list view
- Month-by-month navigation with running balance
- Recurring transactions that auto-generate each month
- Add, edit, and delete transactions
- Group transactions by date
- Color-coded amounts (green for income, red for expenses)

### Task Mode
- Kanban board with drag-and-drop functionality
- Three columns: To Do, In Progress, Done
- Add, edit, and delete tasks
- Reorder tasks within and across columns
- Real-time updates across devices

## Tech Stack

- **Framework**: Next.js 14+ with App Router & TypeScript
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Database**: Cloud Firestore
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project with:
  - Google Authentication enabled
  - Cloud Firestore database created
  - Web app registered

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd finzo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

4. Deploy Firestore security rules:
```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
finzo/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/          # Login page
│   │   ├── (dashboard)/
│   │   │   ├── finance/        # Finance mode
│   │   │   └── tasks/          # Task mode
│   │   └── layout.tsx          # Root layout with AuthProvider
│   ├── components/
│   │   ├── auth/               # Authentication components
│   │   ├── finance/            # Finance mode components
│   │   ├── tasks/              # Task mode components
│   │   ├── layout/             # Layout components
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # shadcn/ui components
│   └── lib/
│       ├── firebase/           # Firebase configuration
│       ├── hooks/              # Custom React hooks
│       ├── schemas/            # Zod validation schemas
│       └── types/              # TypeScript type definitions
├── firestore.rules             # Firestore security rules
└── .env.local                  # Environment variables (gitignored)
```

## Usage

### Finance Mode

1. **Add Transaction**: Click the floating + button or click on a date header
2. **Edit Transaction**: Click the edit icon on any transaction
3. **Delete Transaction**: Click the trash icon on any transaction
4. **Navigate Months**: Use the arrow buttons in the month navigator
5. **Recurring Transactions**: Check the "Recurring transaction" box when adding a transaction

### Task Mode

1. **Add Task**: Click the + button in any column header
2. **Edit Task**: Click the edit icon on any task card
3. **Delete Task**: Click the trash icon on any task card
4. **Move Task**: Drag and drop tasks between columns or reorder within a column

## Data Models

### Transaction
- `description`: String (required)
- `amount`: Number (positive = income, negative = expense)
- `date`: Date (required)
- `status`: String (optional)
- `isRecurring`: Boolean (default: false)

### Task
- `title`: String (required)
- `description`: String (optional)
- `status`: 'todo' | 'in-progress' | 'done'
- `order`: Number (for sorting)

## Security

The app uses Firestore security rules to ensure:
- Users can only access their own data
- All operations require authentication
- Data validation at the database level

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create types in `src/lib/types/`
2. Add Zod schemas in `src/lib/schemas/`
3. Create hooks in `src/lib/hooks/`
4. Build UI components in `src/components/`
5. Update Firestore rules if needed

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- etc.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
