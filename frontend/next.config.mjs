/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => {
        return [
          {
            source: '/backend/:path*',
            destination:
              process.env.NODE_ENV === 'development'
                ? 'http://127.0.0.1:8080/backend/:path*'
                : '/backend',
          },
        ]
      },
};

export default nextConfig;
