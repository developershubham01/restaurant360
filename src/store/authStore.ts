import { create } from 'zustand';

interface User {
  username: string;
  uuid: string;
  roles: string[];
  permissions: string[];
  fullName?: string;
  email?: string;
  phone?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  outletId: number;
  terminalId: number;
  shiftId: number;
  features: Record<string, boolean>;
  isImpersonating: boolean;
  originalToken: string | null;
  setFeatures: (features: Record<string, boolean>) => void;
  setLoginData: (data: {
    accessToken: string;
    refreshToken: string;
    username: string;
    uuid: string;
    roles: string[];
    permissions: string[];
  }) => void;
  setOutletId: (id: number) => void;
  logout: () => void;
  setImpersonation: (token: string, originalToken: string) => void;
  exitImpersonation: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from localStorage
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userJson = localStorage.getItem('user');
  let user: User | null = null;
  
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }

  return {
    isAuthenticated: !!accessToken,
    user,
    accessToken,
    refreshToken,
    outletId: 1, // Default outlet seeded in DB
    terminalId: 1, // Default terminal seeded in DB
    shiftId: 1, // Default open shift seeded in DB
    features: {},
    isImpersonating: !!localStorage.getItem('originalToken'),
    originalToken: localStorage.getItem('originalToken'),
    setFeatures: (features) => set({ features }),
    setLoginData: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      const userPayload: User = {
        username: data.username,
        uuid: data.uuid,
        roles: data.roles,
        permissions: data.permissions,
      };
      localStorage.setItem('user', JSON.stringify(userPayload));

      set({
        isAuthenticated: true,
        user: userPayload,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
    setOutletId: (id) => {
      set({ outletId: id });
    },
    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('originalToken');
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isImpersonating: false,
        originalToken: null,
        features: {},
      });
    },
    setImpersonation: (token, originalToken) => {
      localStorage.setItem('originalToken', originalToken);
      localStorage.setItem('accessToken', token);
      
      // Parse claims to populate user details in store
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const claims = JSON.parse(jsonPayload);
        const impersonatedUser: User = {
          username: claims.sub,
          uuid: claims.sub,
          roles: ['OWNER'], // Mimic owner privileges
          permissions: []
        };
        
        localStorage.setItem('user', JSON.stringify(impersonatedUser));
        set({
          isAuthenticated: true,
          user: impersonatedUser,
          accessToken: token,
          isImpersonating: true,
          originalToken: originalToken
        });
      } catch (err) {
        console.error('Failed to parse token claims during impersonation', err);
      }
    },
    exitImpersonation: () => {
      const origToken = localStorage.getItem('originalToken');
      localStorage.removeItem('originalToken');
      if (origToken) {
        localStorage.setItem('accessToken', origToken);
        
        try {
          const base64Url = origToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const claims = JSON.parse(jsonPayload);
          const adminUser: User = {
            username: claims.sub,
            uuid: claims.sub,
            roles: ['ADMIN'],
            permissions: []
          };
          localStorage.setItem('user', JSON.stringify(adminUser));
          set({
            isAuthenticated: true,
            user: adminUser,
            accessToken: origToken,
            isImpersonating: false,
            originalToken: null
          });
        } catch (err) {
          console.error('Failed to restore original token claims', err);
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          isImpersonating: false,
          originalToken: null,
          features: {}
        });
      }
    }
  };
});
