/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // 👈 Bu muammoni hal qiladi
  },
};

module.exports = nextConfig;
