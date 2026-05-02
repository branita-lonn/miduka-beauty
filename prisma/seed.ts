// prisma/seed.ts
// Database seeding script for development - Stage 11

import { PrismaClient, FontChoice, UserRole, OrderStatus, PaymentMethod, PaymentStatus, CouponType, BundleType } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // --- SECTION 1: Store Owner Account ---
  console.log("Seeding Store Owner...");
  const hashedOwnerPassword = await bcryptjs.hash("Password123!", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@miduka.co.ke" },
    update: { password: hashedOwnerPassword, role: UserRole.STORE_OWNER, name: "MiDuka Admin" },
    create: {
      email: "owner@miduka.co.ke",
      name: "MiDuka Admin",
      password: hashedOwnerPassword,
      role: UserRole.STORE_OWNER,
    },
  });
  console.log(`Store Owner ready: ${owner.email}`);

  // --- SECTION 2: Store Settings ---
  console.log("Seeding Store Settings...");
  const storeSettingsData = {
    storeName: "MiDuka",
    storeTagline: "Everything you need, delivered to your door",
    accentColor: "#4f46e5",
    fontChoice: FontChoice.INTER,
    enableStripe: true,
    enableMpesa: true,
    whatsappEnabled: false,
    loyaltyPointsPerKes: 1,
    loyaltyRedemptionRate: 100,
  };

  const existingSettings = await prisma.storeSettings.findFirst();
  if (existingSettings) {
    await prisma.storeSettings.update({
      where: { id: existingSettings.id },
      data: storeSettingsData,
    });
  } else {
    await prisma.storeSettings.create({
      data: storeSettingsData,
    });
  }
  console.log("Store Settings ready.");

  // --- SECTION 3: Categories ---
  console.log("Seeding Categories...");
  const topCategories = [
    { name: "Women's Fashion", slug: "womens-fashion" },
    { name: "Men's Fashion", slug: "mens-fashion" },
    { name: "Electronics", slug: "electronics" },
    { name: "Home & Living", slug: "home-living" },
    { name: "Beauty & Personal Care", slug: "beauty-personal-care" },
  ];

  const categoriesMap: Record<string, string> = {};

  for (const cat of topCategories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug, isActive: true },
    });
    categoriesMap[cat.slug] = created.id;
  }

  const subCategories = [
    { name: "Dresses", slug: "womens-dresses", parent: "womens-fashion" },
    { name: "Tops & Blouses", slug: "womens-tops", parent: "womens-fashion" },
    { name: "Trousers & Jeans", slug: "womens-trousers", parent: "womens-fashion" },
    { name: "Skirts", slug: "womens-skirts", parent: "womens-fashion" },
    { name: "Shoes", slug: "womens-shoes", parent: "womens-fashion" },
    { name: "Bags & Accessories", slug: "womens-bags", parent: "womens-fashion" },
    
    { name: "Shirts", slug: "mens-shirts", parent: "mens-fashion" },
    { name: "T-Shirts", slug: "mens-tshirts", parent: "mens-fashion" },
    { name: "Trousers & Jeans", slug: "mens-trousers", parent: "mens-fashion" },
    { name: "Shoes", slug: "mens-shoes", parent: "mens-fashion" },
    { name: "Watches", slug: "mens-watches", parent: "mens-fashion" },
    
    { name: "Phones & Tablets", slug: "phones-tablets", parent: "electronics" },
    { name: "Laptops", slug: "laptops", parent: "electronics" },
    { name: "Earphones & Headphones", slug: "earphones-headphones", parent: "electronics" },
    { name: "Accessories", slug: "electronic-accessories", parent: "electronics" },
    
    { name: "Kitchen", slug: "home-kitchen", parent: "home-living" },
    { name: "Bedding", slug: "home-bedding", parent: "home-living" },
    { name: "Decor", slug: "home-decor", parent: "home-living" },
    { name: "Storage", slug: "home-storage", parent: "home-living" },
    
    { name: "Skincare", slug: "beauty-skincare", parent: "beauty-personal-care" },
    { name: "Hair Care", slug: "beauty-haircare", parent: "beauty-personal-care" },
    { name: "Makeup", slug: "beauty-makeup", parent: "beauty-personal-care" },
  ];

  for (const sub of subCategories) {
    const created = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, parentId: categoriesMap[sub.parent] },
      create: { name: sub.name, slug: sub.slug, parentId: categoriesMap[sub.parent], isActive: true },
    });
    categoriesMap[sub.slug] = created.id;
  }
  console.log("Categories ready.");

  // --- SECTION 4: Products (30+ products) ---
  console.log("Seeding Products...");
  const products = [
    // Women's
    { name: "Ankara Print Wrap Dress", slug: "ankara-wrap-dress", cat: "womens-dresses", price: 3500, compare: 4500, feat: true, tags: ["ankara", "dress", "party"] },
    { name: "Floral Midi Sundress", slug: "floral-midi-sundress", cat: "womens-dresses", price: 2800, compare: null, feat: false, tags: ["summer", "casual"] },
    { name: "Office Bodycon Dress", slug: "office-bodycon-dress", cat: "womens-dresses", price: 4200, compare: 5000, feat: false, tags: ["office", "formal"] },
    { name: "Chiffon Blouse", slug: "chiffon-blouse", cat: "womens-tops", price: 1500, compare: null, feat: false, tags: ["office", "casual"] },
    { name: "High-Waist Mom Jeans", slug: "high-waist-mom-jeans", cat: "womens-trousers", price: 2200, compare: null, feat: true, tags: ["denim", "jeans"] },
    { name: "Pleated Maxi Skirt", slug: "pleated-maxi-skirt", cat: "womens-skirts", price: 1800, compare: 2500, feat: false, tags: ["skirt", "casual"] },
    { name: "Strappy Block Heels", slug: "strappy-block-heels", cat: "womens-shoes", price: 3000, compare: null, feat: false, tags: ["shoes", "heels"] },
    { name: "Leather Tote Bag", slug: "leather-tote-bag", cat: "womens-bags", price: 4500, compare: 6000, feat: true, tags: ["bag", "leather", "accessory"] },

    // Men's
    { name: "Slim Fit Linen Shirt", slug: "slim-fit-linen-shirt", cat: "mens-shirts", price: 2500, compare: null, feat: false, tags: ["linen", "casual"] },
    { name: "Classic Oxford Button-Down", slug: "classic-oxford-button-down", cat: "mens-shirts", price: 3200, compare: 4000, feat: true, tags: ["office", "formal"] },
    { name: "Graphic Cotton T-Shirt", slug: "graphic-cotton-tshirt", cat: "mens-tshirts", price: 1200, compare: null, feat: false, tags: ["casual", "tshirt"] },
    { name: "Slim Fit Chinos", slug: "slim-fit-chinos", cat: "mens-trousers", price: 2800, compare: 3500, feat: false, tags: ["trousers", "casual"] },
    { name: "Leather Loafers", slug: "leather-loafers", cat: "mens-shoes", price: 5500, compare: 7000, feat: true, tags: ["shoes", "leather", "formal"] },
    { name: "Minimalist Chronograph Watch", slug: "minimalist-watch", cat: "mens-watches", price: 8500, compare: 10000, feat: false, tags: ["watch", "accessory"] },

    // Electronics
    { name: "Wireless Earbuds Pro", slug: "wireless-earbuds-pro", cat: "earphones-headphones", price: 4500, compare: 6000, feat: true, tags: ["audio", "wireless"] },
    { name: "USB-C Fast Charger 65W", slug: "usb-c-fast-charger", cat: "electronic-accessories", price: 2200, compare: null, feat: false, tags: ["charger", "accessory"] },
    { name: "10000mAh Power Bank", slug: "power-bank-10000", cat: "electronic-accessories", price: 3000, compare: 3500, feat: false, tags: ["power", "accessory"] },
    { name: "Noise Cancelling Headphones", slug: "noise-cancelling-headphones", cat: "earphones-headphones", price: 8000, compare: 12000, feat: false, tags: ["audio", "premium"] },
    { name: "Smartphone Gimbal Stabilizer", slug: "smartphone-gimbal", cat: "electronic-accessories", price: 9500, compare: 11000, feat: false, tags: ["photography", "accessory"] },

    // Home & Living
    { name: "Non-Stick Sufuria Set", slug: "non-stick-sufuria-set", cat: "home-kitchen", price: 6500, compare: 8000, feat: true, tags: ["kitchen", "cooking"] },
    { name: "Printed Fleece Blanket", slug: "printed-fleece-blanket", cat: "home-bedding", price: 2500, compare: null, feat: false, tags: ["bedding", "warm"] },
    { name: "Ceramic Dinner Set (16 Piece)", slug: "ceramic-dinner-set", cat: "home-kitchen", price: 5500, compare: 7500, feat: false, tags: ["kitchen", "dining"] },
    { name: "Woven Storage Baskets (Set of 3)", slug: "woven-storage-baskets", cat: "home-storage", price: 3200, compare: null, feat: false, tags: ["storage", "decor"] },
    { name: "Scented Soy Candle", slug: "scented-soy-candle", cat: "home-decor", price: 1500, compare: null, feat: false, tags: ["decor", "fragrance"] },
    { name: "Microfiber Bath Towel Set", slug: "microfiber-towel-set", cat: "home-bedding", price: 2800, compare: 3500, feat: false, tags: ["bath", "towel"] },

    // Beauty
    { name: "Vitamin C Brightening Serum", slug: "vitamin-c-serum", cat: "beauty-skincare", price: 1800, compare: null, feat: false, tags: ["skincare", "serum"] },
    { name: "Edge Control Hair Gel", slug: "edge-control-gel", cat: "beauty-haircare", price: 800, compare: null, feat: false, tags: ["haircare", "styling"] },
    { name: "Matte Liquid Lipstick", slug: "matte-liquid-lipstick", cat: "beauty-makeup", price: 1200, compare: 1500, feat: false, tags: ["makeup", "lips"] },
    { name: "Hydrating Facial Cleanser", slug: "hydrating-cleanser", cat: "beauty-skincare", price: 1600, compare: null, feat: false, tags: ["skincare", "cleanser"] },
    { name: "Argan Oil Hair Treatment", slug: "argan-oil-treatment", cat: "beauty-haircare", price: 2200, compare: 2800, feat: false, tags: ["haircare", "oil"] },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      const prod = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: `This is a high-quality ${p.name.toLowerCase()} available for you. Perfect for everyday use and built to last. It comes highly recommended by our buyers.`,
          price: p.price,
          compareAtPrice: p.compare,
          isActive: true,
          isFeatured: p.feat,
          isOnSale: !!p.compare,
          stockQuantity: Math.floor(Math.random() * 50) + 10,
          categoryId: categoriesMap[p.cat],
          tags: p.tags,
          images: {
            create: [
              { url: `https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg`, altText: `${p.name} image 1`, sortOrder: 0 },
              { url: `https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/leather-bag-gray.jpg`, altText: `${p.name} image 2`, sortOrder: 1 },
              { url: `https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shoes.png`, altText: `${p.name} image 3`, sortOrder: 2 },
            ],
          },
          variants: p.cat.includes("dresses") || p.cat.includes("shirts") || p.cat.includes("trousers") ? {
            create: [
              { size: "S", stockQuantity: 10, isActive: true },
              { size: "M", stockQuantity: 15, isActive: true },
              { size: "L", stockQuantity: 20, isActive: true },
            ]
          } : undefined
        }
      });
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          price: p.price,
          compareAtPrice: p.compare,
          isFeatured: p.feat,
          isOnSale: !!p.compare,
        }
      })
    }
  }
  console.log("Products ready.");

  // --- SECTION 5: Sample Customers ---
  console.log("Seeding Customers...");
  const hashedCustomerPassword = await bcryptjs.hash("Password123!", 12);
  const customers = [
    { email: "amina.hassan@gmail.com", name: "Amina Hassan", city: "Mombasa", county: "Mombasa" },
    { email: "brian.otieno@gmail.com", name: "Brian Otieno", city: "Nairobi", county: "Nairobi" },
    { email: "cynthia.waweru@gmail.com", name: "Cynthia Waweru", city: "Kisumu", county: "Kisumu" },
    { email: "dennis.kiprop@gmail.com", name: "Dennis Kiprop", city: "Eldoret", county: "Uasin Gishu" },
    { email: "esther.njeri@gmail.com", name: "Esther Njeri", city: "Nakuru", county: "Nakuru" },
  ];

  const customerRecords = [];

  for (const c of customers) {
    const customer = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name, password: hashedCustomerPassword },
      create: {
        email: c.email,
        name: c.name,
        password: hashedCustomerPassword,
        role: UserRole.CUSTOMER,
        phone: "+254700000000",
        addresses: {
          create: {
            fullName: c.name,
            phone: "+254700000000",
            addressLine1: "123 Main St",
            city: c.city,
            county: c.county,
            isDefault: true,
          }
        }
      },
      include: { addresses: true }
    });
    customerRecords.push(customer);
  }
  console.log("Customers ready.");

  // --- SECTION 6: Sample Orders ---
  console.log("Seeding Orders...");
  const allProducts = await prisma.product.findMany({ include: { variants: true } });
  
  if (allProducts.length > 0) {
    const orderStatuses: OrderStatus[] = ["PLACED", "PLACED", "PLACED", "CONFIRMED", "CONFIRMED", "CONFIRMED", "SHIPPED", "SHIPPED", "SHIPPED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "CANCELLED"];
    
    // We only create orders if they don't exist yet to keep idempotency
    const existingOrdersCount = await prisma.order.count();
    
    if (existingOrdersCount < 5) {
      let orderIndex = 1;
      for (const status of orderStatuses) {
        const customer = customerRecords[orderIndex % customerRecords.length];
        const address = customer.addresses[0];
        const prod1 = allProducts[orderIndex % allProducts.length];
        const prod2 = allProducts[(orderIndex + 2) % allProducts.length];
        
        const isStripe = orderIndex % 2 === 0;

        const subtotal = Number(prod1.price) + Number(prod2.price);
        
        const createdOrder = await prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-${orderIndex}`,
            status: status,
            customerId: customer.id,
            shippingAddressId: address.id,
            subtotal: subtotal,
            total: subtotal + 300,
            shippingCost: 300,
            paymentMethod: isStripe ? PaymentMethod.STRIPE : PaymentMethod.MPESA,
            paymentStatus: status === "PLACED" ? PaymentStatus.PENDING : PaymentStatus.PAID,
            items: {
              create: [
                {
                  productId: prod1.id,
                  productName: prod1.name,
                  quantity: 1,
                  unitPrice: prod1.price,
                  total: prod1.price,
                  variantId: prod1.variants[0]?.id,
                  variantLabel: prod1.variants[0]?.size,
                },
                {
                  productId: prod2.id,
                  productName: prod2.name,
                  quantity: 1,
                  unitPrice: prod2.price,
                  total: prod2.price,
                  variantId: prod2.variants[0]?.id,
                  variantLabel: prod2.variants[0]?.size,
                }
              ]
            }
          }
        });

        // Add reviews for delivered orders
        if (status === "DELIVERED") {
          await prisma.review.upsert({
            where: { productId_customerId: { productId: prod1.id, customerId: customer.id } },
            update: {},
            create: {
              rating: 5,
              body: "Amazing product, exactly as described! Fast delivery too.",
              productId: prod1.id,
              customerId: customer.id,
              orderId: createdOrder.id,
              isVerifiedPurchase: true,
            }
          });
        }
        
        orderIndex++;
      }
    }
  }
  console.log("Orders ready.");

  // --- SECTION 7: Coupons ---
  console.log("Seeding Coupons...");
  const coupons = [
    { code: "WELCOME10", type: CouponType.PERCENTAGE, value: 10, isActive: true },
    { code: "FREESHIP", type: CouponType.FREE_SHIPPING, value: 0, isActive: true, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    { code: "SAVE500", type: CouponType.FIXED_AMOUNT, value: 500, isActive: true, minimumOrderAmount: 3000 },
  ];

  for (const coup of coupons) {
    await prisma.coupon.upsert({
      where: { code: coup.code },
      update: { value: coup.value, type: coup.type },
      create: coup,
    });
  }
  console.log("Coupons ready.");

  // --- SECTION 8: Flash Sale ---
  console.log("Seeding Flash Sale...");
  const flashProduct = allProducts.find(p => p.price > 3000);
  if (flashProduct) {
    const existingSale = await prisma.flashSale.findUnique({ where: { productId: flashProduct.id }});
    if (!existingSale) {
      await prisma.flashSale.create({
        data: {
          productId: flashProduct.id,
          salePrice: Number(flashProduct.price) * 0.8,
          startTime: new Date(),
          endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }
      });
    }
  }
  console.log("Flash Sale ready.");

  // --- SECTION 9: Loyalty Accounts ---
  console.log("Seeding Loyalty Accounts...");
  for (const customer of customerRecords) {
    await prisma.loyaltyAccount.upsert({
      where: { customerId: customer.id },
      update: {},
      create: {
        customerId: customer.id,
        points: 500,
        lifetimePoints: 500,
        transactions: {
          create: [
            { type: "EARN", points: 500, description: "Welcome Bonus" }
          ]
        }
      }
    });
  }
  console.log("Loyalty Accounts ready.");

  // --- SECTION 10: Static Pages ---
  console.log("Seeding Static Pages...");
  const pages = [
    { slug: "about", title: "About Us", content: "# About MiDuka\n\nWelcome to MiDuka, your neighbourhood store, online! We strive to provide the best products at the best prices." },
    { slug: "contact", title: "Contact Us", content: "# Contact Us\n\nReach out to us at support@miduka.co.ke or call us at +254 700 000 000." },
    { slug: "privacy", title: "Privacy Policy", content: "# Privacy Policy\n\nYour privacy is important to us. We will never sell your data." },
    { slug: "returns", title: "Returns Policy", content: "# Returns Policy\n\nYou can return any unused item within 14 days of delivery for a full refund." },
  ];

  for (const page of pages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log("Static Pages ready.");

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
