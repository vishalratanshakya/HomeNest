# HomeNest 

A full-stack scalable React.js application with Firebase and Cloudinary for a real estate marketplace platform.

## Features

### User Portal
- Browse and search properties
- View property details with images
- Place orders and track in real-time
- Payment integration (Razorpay/Stripe)
- Order history and management
- Profile management
- Notifications

### Owner Portal
- Dashboard with analytics
- Add/Edit/Delete products
- Image upload via Cloudinary
- Manage orders (Accept/Reject/Complete)
- Online/Offline toggle
- Earnings tracking
- Document upload

### Admin Portal
- Dashboard with charts and statistics
- User management (Block/Unblock/Delete)
- Owner management (Approve/Reject/Suspend)
- Order management
- Category management
- Send notifications
- View logs
- Settings management

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage, Cloud Messaging)
- **Image Upload**: Cloudinary
- **Payment**: Razorpay / Stripe
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## Project Structure

```
/
├── src/ (core system only)
│   ├── core/
│   │   ├── services/
│   │   │   ├── firebaseService.js
│   │   │   ├── cloudinaryService.js
│   │   │   ├── notificationService.js
│   │   │   └── paymentService.js
│   │   ├── components/ (shared UI)
│   │   ├── utils/
│   │   │   ├── dummyData.js
│   │   │   └── helpers.js
│   │   └── hooks/
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── admin/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Owners.jsx
│   │   ├── Orders.jsx
│   │   ├── Analytics.jsx
│   │   └── Settings.jsx
│   ├── components/
│   ├── services/
│   │   └── adminService.js
│   └── store/
├── owner/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── AddProduct.jsx
│   │   ├── EditProduct.jsx
│   │   ├── ProductList.jsx
│   │   ├── Orders.jsx
│   │   ├── Earnings.jsx
│   │   └── Profile.jsx
│   ├── components/
│   ├── services/
│   │   ├── ownerService.js
│   │   └── productService.js
│   └── store/
├── user/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Search.jsx
│   │   ├── ProductDetails.jsx
│   │   ├── OrderPage.jsx
│   │   ├── OrderTracking.jsx
│   │   ├── Payment.jsx
│   │   ├── Profile.jsx
│   │   └── Notifications.jsx
│   ├── components/
│   ├── services/
│   │   ├── userService.js
│   │   └── orderService.js
│   └── store/
└── auth/
    └── pages/
        ├── Login.jsx
        ├── OTP.jsx
        └── Signup.jsx
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account
- Cloudinary account
- Razorpay/Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd homenest
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your credentials:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Firebase Setup

1. Create a new project in [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Phone)
3. Create Firestore database
4. Enable Storage
5. Enable Cloud Messaging (for push notifications)
6. Add your web app to get configuration credentials

### Cloudinary Setup

1. Create an account at [Cloudinary](https://cloudinary.com/)
2. Create an upload preset (unsigned for development)
3. Note your cloud name and upload preset

### Payment Setup

**For Razorpay:**
1. Create an account at [Razorpay](https://razorpay.com/)
2. Get your key ID from the dashboard

**For Stripe:**
1. Create an account at [Stripe](https://stripe.com/)
2. Get your publishable key from the dashboard

### Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Authentication

The application supports:
- Email/Password authentication
- Phone authentication with OTP
- Role-based access control (Admin, Owner, User)

After login, users are redirected based on their role:
- Admin → `/admin/dashboard`
- Owner → `/owner/dashboard`
- User → `/user/home`

## Firestore Security Rules

Make sure to set up proper Firestore security rules in your Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && request.auth.token.role == 'owner';
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || resource.data.ownerId == request.auth.uid || request.auth.token.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && (resource.data.ownerId == request.auth.uid || request.auth.token.role == 'admin');
    }
    
    // Owners collection
    match /owners/{ownerId} {
      allow read: if true;
      allow update: if request.auth != null && (request.auth.uid == ownerId || request.auth.token.role == 'admin');
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Real-time Features

The application uses Firestore's `onSnapshot` listeners for real-time updates:
- Live order status updates
- Owner receives instant order notifications
- User sees real-time order tracking

## Dummy Data

The application includes dummy data for:
- Products
- Users
- Owners
- Orders
- Categories
- Notifications

This data is loaded initially and can be synced to Firestore.

## Advanced Features

- **Dark Mode**: Toggle between light and dark themes
- **Multi-language**: Support for multiple languages
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading Skeletons**: Skeleton loaders for better UX during data loading
- **Code Splitting**: Lazy loading for optimal performance
- **Responsive Design**: Fully responsive UI for all screen sizes

## Performance Optimizations

- Lazy loading of routes
- Code splitting
- Optimized Firestore queries
- Image optimization via Cloudinary
- Debounced search

## Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the dist folder
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@homenest.com or open an issue in the repository.
