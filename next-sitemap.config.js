/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/seller/*', '/customer/*', '/checkout', '/order-confirmation/*', '/api/*', '/offline'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/seller/', '/customer/', '/checkout', '/api/'],
      },
    ],
  },
  additionalPaths: async (config) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const products = await prisma.product.findMany({ 
      where: { isActive: true }, 
      select: { slug: true, updatedAt: true } 
    });
    const categories = await prisma.category.findMany({ 
      where: { isActive: true }, 
      select: { slug: true } 
    });
    
    const paths = [];
    
    products.forEach((product) => {
      paths.push(await config.transform(config, `/products/${product.slug}`));
      paths[paths.length - 1].changefreq = 'weekly';
      paths[paths.length - 1].priority = 0.8;
      paths[paths.length - 1].lastmod = product.updatedAt.toISOString();
    });
    
    categories.forEach((category) => {
      // transform returns a promise in next-sitemap, but wait, next-sitemap additionalPaths should just return array of objects or use config.transform
      // Actually, returning standard objects is easier.
    });

    await prisma.$disconnect();
    
    const finalPaths = [];
    for (const p of products) {
      finalPaths.push(await config.transform(config, `/products/${p.slug}`));
    }
    for (const c of categories) {
      finalPaths.push(await config.transform(config, `/categories/${c.slug}`));
    }

    return finalPaths.map((p) => {
      if (p.loc.includes('/products/')) {
        p.changefreq = 'weekly';
        p.priority = 0.8;
        const prod = products.find(prod => p.loc.endsWith(`/products/${prod.slug}`));
        if (prod) p.lastmod = prod.updatedAt.toISOString();
      }
      if (p.loc.includes('/categories/')) {
        p.changefreq = 'weekly';
        p.priority = 0.7;
      }
      return p;
    });
  },
};
