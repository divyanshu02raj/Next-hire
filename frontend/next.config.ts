/** @type {import('next').NextConfig} */
const nextConfig = {
  // This webpack configuration is the key to fixing the "canvas" module error.
  // It tells Next.js's bundler to ignore the 'canvas' library, which is a
  // server-side dependency that pdfjs-dist tries to import unnecessarily
  // in a browser environment.
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
