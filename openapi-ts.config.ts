import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8111/openapi.json',
  output: './src/client',
});
