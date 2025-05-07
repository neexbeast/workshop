import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Option to disable HMR
        '*.intl': {
          loaders: ['next-intl/plugin'],
          watch: false
        }
      }
    }
  }
};

export default withNextIntl(nextConfig); 