import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Variables d'environnement requises par config.ts pendant les tests
    env: {
      SECRET_KEY: 'test-secret-key-for-vitest',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'TestAdmin123!',
      NODE_ENV: 'test',
    },
  },
});
