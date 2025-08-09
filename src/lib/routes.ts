// Define all your app routes here for type safety
export const AppRoutes = {
  home: {
    path: '/',
  },
  dashboard: {
    path: '/dashboard',
  },
  generate: {
    path: '/generate',
  },
  // Add more routes as needed
} as const;

export type AppRoute = keyof typeof AppRoutes;
export type AppRoutePath = (typeof AppRoutes)[AppRoute]['path'];

export const ROUTES = {
  generate: () => '/generate' as const,
  // Add other route helper functions as needed
};
