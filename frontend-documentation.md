# GNC Group Invoice Extractor - Frontend Documentation

## Project Overview

The GNC Group Invoice Extractor is a React-based web application that processes invoice documents using AI-powered image analysis. The frontend provides a user-friendly interface for uploading images, configuring processing parameters, and viewing extracted data in various formats.

### Deployment Information
- **Hosting Platform**: Vercel
- **Production URL**: https://gnc-phase1-frontend.vercel.app
- **Deployment**: Automatic deployment from Git repository
- **Environment**: Production-optimized build with CDN distribution

## Technology Stack

### Core Technologies
- **React 18.x** - Component-based UI library
- **React Router Dom** - Client-side routing
- **Vite** - Build tool and development server
- **Axios** - HTTP client for API requests
- **Framer Motion** - Animation library for enhanced UX
- **Tailwind CSS** - Utility-first CSS framework

### Key Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "framer-motion": "^10.x",
  "tailwindcss": "^3.x"
}
```

## Application Architecture

### Component Hierarchy
```
App (Root Component)
├── Login
├── AuthCallback
├── Dashboard
└── InvoiceExtractor
    ├── FileUpload
    ├── ImageSelection
    ├── ConsolidatedView
    ├── DataTable
    └── TotalsSummary
```

### Routing Structure
- `/` - Root redirect to dashboard or login
- `/login` - Authentication page with Google OAuth
- `/auth/callback` - OAuth callback handler
- `/dashboard` - Main dashboard with tool selection
- `/invoice-extractor` - Invoice processing interface

## Component Documentation

### 1. App.jsx (Root Component)
**Purpose**: Main application container handling authentication state and routing.

**Key Features**:
- Authentication state management
- Route protection
- Token validation
- Loading states

**State Management**:
```javascript
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
```

**Key Functions**:
- `checkAuth()` - Validates authentication token
- `handleLogout()` - Clears session and redirects

### 2. Login.jsx
**Purpose**: Authentication interface with Google OAuth integration.

**Features**:
- Google OAuth button
- Domain restriction messaging (@gncgroup.ca only)
- Error handling for unauthorized domains
- Responsive design with animations

**Error Handling**:
```javascript
// Domain restriction error display
{error === 'domain_not_allowed' && (
  <ErrorModal message="Only @gncgroup.ca emails allowed" />
)}
```

### 3. AuthCallback.jsx
**Purpose**: Handles OAuth callback and token storage.

**Process Flow**:
1. Extract token from URL parameters
2. Store token in localStorage
3. Trigger parent authentication refresh
4. Redirect to dashboard

### 4. Dashboard.jsx
**Purpose**: Main navigation hub with tool selection.

**Features**:
- Tool cards with animations (Framer Motion)
- User profile display
- Navigation to invoice extractor
- Responsive grid layout

### 5. InvoiceExtractor.jsx (Main Processing Component)
**Purpose**: Core invoice processing interface with AI-powered data extraction.

**Key Features**:
- Multi-image upload and processing
- AI model selection (Gemini variants)
- Custom prompt configuration
- Real-time processing progress
- Data visualization in multiple views

**State Management**:
```javascript
const [images, setImages] = useState([]);
const [processing, setProcessing] = useState(false);
const [currentStep, setCurrentStep] = useState('upload');
const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
const [customPrompt, setCustomPrompt] = useState('');
const [collectedResult, setCollectedResult] = useState({
  labour: [],
  material: [],
  equipment: [],
  consumables: [],
  subtrade: [],
  labourTimesheet: [],
  equipmentLog: []
});
```

### 6. FileUpload.jsx
**Purpose**: Handles file upload and image conversion.

**Features**:
- Drag & drop interface
- Multiple file selection
- Base64 conversion
- File validation (image types only)
- Progress indication

**File Processing**:
```javascript
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

### 7. ImageSelection.jsx
**Purpose**: Image preview and page number assignment.

**Features**:
- Image thumbnails with page numbers
- Remove unwanted images
- Reorder functionality
- Batch processing preparation

### 8. ConsolidatedView.jsx
**Purpose**: Displays all extracted data in a unified table format.

**Features**:
- Cross-category data aggregation
- Page reference buttons
- Error indicators for problematic pages
- Grand total calculations

**Data Processing**:
```javascript
const processRawData = () => {
  const processedData = [];
  
  sortedPages.forEach(pageData => {
    if (pageData.rawOutput) {
      const rawEntries = JSON.parse(pageData.rawOutput);
      rawEntries.forEach(entry => {
        const flattenedEntry = {
          pageNumber: pageData.pageNumber,
          category: entry.category,
          referenceDocument: documentName,
          ...entry.data
        };
        processedData.push(flattenedEntry);
      });
    }
  });
  
  return processedData;
};
```

### 9. DataTable.jsx
**Purpose**: Category-specific data display with enhanced formatting.

**Features**:
- Sortable columns
- Page reference links
- Category totals
- Error warnings
- Export-ready format

### 10. TotalsSummary.jsx
**Purpose**: Financial summary across all categories.

**Features**:
- Category-wise totals
- Item counts
- Grand total calculation
- Error reporting
- Professional formatting

**Calculation Logic**:
```javascript
const calculateCategoryTotal = (categoryData) => {
  return categoryData.reduce((sum, item) => {
    const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
    return sum + amount;
  }, 0);
};
```

## API Integration

### Configuration (api.js)
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://srv1047946.hstgr.cloud:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Request Interceptor
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login?error=session_expired';
    }
    return Promise.reject(error);
  }
);
```

## State Management

### Authentication State
- User object with profile information
- Token management in localStorage
- Session validation on app initialization

### Processing State
- Upload progress tracking
- Processing status indicators
- Error handling and recovery

### Data State
- Raw extracted data storage
- Processed data aggregation
- Category-wise organization

## Styling and UI

### Tailwind CSS Classes
The application uses a consistent design system:

**Colors**:
- Background: `bg-black`, `bg-zinc-900`
- Text: `text-white`, `text-gray-400`
- Accents: `text-blue-400`, `text-green-400`

**Layout**:
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Cards: `bg-zinc-900 border border-zinc-800 rounded-2xl`
- Buttons: `bg-zinc-800 hover:bg-zinc-700 transition-colors`

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Flexible grid layouts
- Adaptive font sizes and spacing

## Performance Optimizations

### Code Splitting
```javascript
// Lazy loading for route components
const LazyDashboard = lazy(() => import('./pages/Dashboard'));
```

### Image Optimization
- Base64 conversion for API compatibility
- Thumbnail generation for previews
- Progressive loading indicators

### API Request Optimization
- Request interceptors for authentication
- Error boundaries for graceful failures
- Retry mechanisms for network issues

## Error Handling

### Component Error Boundaries
```javascript
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### API Error Handling
- Network timeout handling
- Server error responses
- User-friendly error messages
- Automatic retry mechanisms

## Security Considerations

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure token storage
- Domain-restricted access (@gncgroup.ca)

### Data Security
- HTTPS-only communication
- Token expiration handling
- XSS prevention
- CSRF protection

## Development Workflow

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
```env
VITE_API_URL=https://srv1047946.hstgr.cloud:5000
```

### Development Tools
- Vite dev server with HMR
- React Developer Tools
- Browser debugging capabilities
- Network request monitoring

## Testing Strategy

### Unit Testing
- Component functionality
- Utility functions
- API integration
- State management

### Integration Testing
- User workflows
- API interactions
- Route navigation
- Authentication flows

### End-to-End Testing
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarking

## Build and Deployment

### Production Build
```bash
npm run build
```

### Deployment Configuration
- Static file hosting (Vercel/Netlify)
- Environment variable configuration
- CORS handling
- SSL certificate requirements

### Performance Monitoring
- Core Web Vitals tracking
- Error logging
- User analytics
- API response monitoring

## Conclusion

This frontend application provides a comprehensive interface for invoice data extraction using modern React patterns and best practices. The modular architecture ensures maintainability while delivering a responsive and intuitive user experience. The application is hosted on Vercel with automatic deployment and CDN distribution for optimal performance.
