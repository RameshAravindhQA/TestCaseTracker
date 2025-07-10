
# Project Dependencies

## Backend Dependencies

### Core Framework
```bash
npm install express cors helmet morgan
npm install @types/express @types/cors @types/helmet @types/morgan --save-dev
```

### Database
```bash
npm install postgres drizzle-orm drizzle-kit
npm install @types/pg --save-dev
```

### Authentication & Security
```bash
npm install jsonwebtoken bcryptjs
npm install @types/jsonwebtoken @types/bcryptjs --save-dev
```

### File Upload & Storage
```bash
npm install multer sharp
npm install @types/multer --save-dev
```

### Utilities
```bash
npm install dotenv uuid date-fns
npm install @types/uuid --save-dev
```

### Development Tools
```bash
npm install typescript ts-node nodemon concurrently --save-dev
npm install @types/node --save-dev
```

## Frontend Dependencies

### Core Framework
```bash
npm install react react-dom react-router-dom
npm install @types/react @types/react-dom --save-dev
```

### Build Tools
```bash
npm install vite @vitejs/plugin-react
npm install typescript --save-dev
```

### UI Components
```bash
npm install @radix-ui/react-alert-dialog @radix-ui/react-avatar
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-select
npm install @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-tooltip @radix-ui/react-slot
```

### Styling
```bash
npm install tailwindcss postcss autoprefixer
npm install @tailwindcss/forms @tailwindcss/typography
npm install clsx tailwind-merge
npm install lucide-react
```

### State Management & Data Fetching
```bash
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools --save-dev
```

### Forms & Validation
```bash
npm install react-hook-form @hookform/resolvers
npm install zod
```

### Charts & Visualization
```bash
npm install recharts
```

### Drag & Drop
```bash
npm install react-dnd react-dnd-html5-backend
npm install @types/react-dnd --save-dev
```

### Date & Time
```bash
npm install date-fns react-day-picker
```

### File Processing
```bash
npm install papaparse jspdf jspdf-autotable
npm install @types/papaparse --save-dev
```

### Flow Diagrams
```bash
npm install reactflow
```

## Complete Installation Script

Create this script to install all dependencies:

```bash
#!/bin/bash
# install-dependencies.sh

echo "Installing backend dependencies..."
npm install express cors helmet morgan
npm install postgres drizzle-orm drizzle-kit
npm install jsonwebtoken bcryptjs
npm install multer sharp
npm install dotenv uuid date-fns

echo "Installing frontend dependencies..."
npm install react react-dom react-router-dom
npm install vite @vitejs/plugin-react
npm install @radix-ui/react-alert-dialog @radix-ui/react-avatar
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-select
npm install @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-tooltip @radix-ui/react-slot
npm install tailwindcss postcss autoprefixer
npm install @tailwindcss/forms @tailwindcss/typography
npm install clsx tailwind-merge lucide-react
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install recharts react-dnd react-dnd-html5-backend
npm install date-fns react-day-picker
npm install papaparse jspdf jspdf-autotable
npm install reactflow

echo "Installing development dependencies..."
npm install --save-dev typescript ts-node nodemon concurrently
npm install --save-dev @types/node @types/express @types/cors
npm install --save-dev @types/helmet @types/morgan @types/pg
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
npm install --save-dev @types/multer @types/uuid
npm install --save-dev @types/react @types/react-dom
npm install --save-dev @types/papaparse @types/react-dnd
npm install --save-dev @tanstack/react-query-devtools

echo "All dependencies installed successfully!"
```
