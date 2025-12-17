import { Configuration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This webpack configuration is the key to fixing the "canvas" module error.
  // It tells Next.js's bundler to ignore the 'canvas' library, which is a
  // server-side dependency that pdfjs-dist tries to import unnecessarily
  // in a browser environment.
  webpack: (
    config: Configuration
  ) => {
    // Ensure the resolve object and its alias property exist.
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // The type of `config.resolve.alias` can be complex.
    // This safely handles the common case where it's an object.
    if (typeof config.resolve.alias === 'object' && !Array.isArray(config.resolve.alias)) {
      // By setting 'canvas' to false, we tell Webpack to treat it as an empty module.
      config.resolve.alias.canvas = false;
    }
    
    return config;
  },
};

export default nextConfig;
