import { authService, firestoreService } from '../core/services/firebaseService';

/**
 * Creates a default admin account if it does not already exist.
 * Email: adminhomenest@gmail.com
 * Password: admin1234
 */
async function ensureAdminUser() {
  const email = 'adminhomenest@gmail.com';
  const password = 'admin1234';
  try {
    // Try signing in – if succeeds, user exists.
    await authService.signInWithEmail(email, password);
    console.log('Admin user already exists.');
  } catch (err) {
    // If sign‑in fails, attempt to create the user.
    console.log('Creating admin user...');
    try {
      const user = await authService.signUpWithEmail(email, password);
      // Create admin Firestore doc with role admin.
      await firestoreService.createAdminDocument(user.uid, {
        uid: user.uid,
        email: user.email,
        displayName: 'Admin',
        role: 'admin'
      });
      console.log('Admin user created successfully.');
    } catch (createErr) {
      console.error('Failed to create admin user:', createErr);
    }
  }
}

// Run immediately when this script is imported.
ensureAdminUser();
