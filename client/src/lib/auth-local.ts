// Simple local authentication system for development/demo purposes
// In production, you would integrate with a proper authentication service

interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Simple in-memory storage for demo purposes
const USERS_KEY = 'surveyflow_users';
const CURRENT_USER_KEY = 'surveyflow_current_user';

class LocalAuthService {
  private listeners: Set<(authState: AuthState) => void> = new Set();

  // Get all registered users from localStorage
  private getUsers(): User[] {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  // Save users to localStorage
  private saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Get current authenticated user
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(CURRENT_USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Set current user and notify listeners
  private setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    
    this.notifyListeners({
      user,
      isAuthenticated: !!user
    });
  }

  // Sign up with email and password
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    // Basic validation
    if (!email || !password || !displayName) {
      throw new Error('All fields are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const users = this.getUsers();
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      displayName,
      createdAt: new Date()
    };

    // Save user (in real app, you'd hash the password)
    users.push(newUser);
    this.saveUsers(users);
    
    // Store password separately (in real app, this would be hashed and stored securely)
    localStorage.setItem(`password_${email}`, password);

    this.setCurrentUser(newUser);

    // Create sample data for new users
    this.createSampleDataForNewUser(newUser.id);

    return newUser;
  }

  // Create sample data for new users
  private createSampleDataForNewUser(userId: string): void {
    // Import and call the sample data creation function
    import('../components/demo/sample-data').then(({ createSampleSurveys }) => {
      createSampleSurveys(userId);
    }).catch(console.error);
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const users = this.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password (in real app, you'd compare with hashed password)
    const storedPassword = localStorage.getItem(`password_${email}`);
    if (storedPassword !== password) {
      throw new Error('Invalid email or password');
    }

    this.setCurrentUser(user);
    return user;
  }

  // Sign out
  async signOut(): Promise<void> {
    this.setCurrentUser(null);
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (authState: AuthState) => void): () => void {
    this.listeners.add(callback);
    
    // Call immediately with current state
    callback({
      user: this.getCurrentUser(),
      isAuthenticated: !!this.getCurrentUser()
    });

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of auth state changes
  private notifyListeners(authState: AuthState): void {
    this.listeners.forEach(callback => callback(authState));
  }
}

export const authService = new LocalAuthService();
export type { User, AuthState };