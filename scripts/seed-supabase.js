import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres.pgefuifzakvratosuqoy',
  password: '160205@Ammar',
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: 'PL Baby 2 Pk Zipper Romper Dino and Boat Print',
    price: 3290,
    images: [
      'https://hipkids.pk/cdn/shop/files/29_f1f4d31f-0985-4ddc-83c9-32db12e49bc1.webp?v=1782287979&width=800',
      'https://hipkids.pk/cdn/shop/files/4_069d22b4-3562-4332-8e30-3d6e4bc3df12.webp?v=1781799877&width=800',
      'https://hipkids.pk/cdn/shop/files/1_aa3150de-0067-4da9-bb13-74f6f55e891b.webp?v=1781798469&width=800'
    ],
    description: 'A stylish and comfortable zipper romper for baby boys, featuring adorable dinosaur and boat prints. Made of 100% breathable organic cotton.',
    sizes: ['3-6M', '6-9M', '9-12M'],
    categories: ['baby-boy', 'rompers'],
    tags: ['new-arrivals', 'new-born']
  },
  {
    id: 'p2',
    name: 'Baby Boy Paw Print Romper',
    price: 1990,
    images: [
      'https://hipkids.pk/cdn/shop/files/4_069d22b4-3562-4332-8e30-3d6e4bc3df12.webp?v=1781799877&width=800',
      'https://hipkids.pk/cdn/shop/files/29_f1f4d31f-0985-4ddc-83c9-32db12e49bc1.webp?v=1782287979&width=800'
    ],
    description: 'Soft cotton fabric puppy paw print design romper. Designed for ultimate comfort, diaper changes are super easy with snap buttons.',
    sizes: ['NB', '0-3M', '3-6M', '6-9M'],
    categories: ['baby-boy', 'rompers'],
    tags: ['new-arrivals']
  },
  {
    id: 'p3',
    name: 'Baby Boy Green I Love Summer Romper',
    price: 1990,
    oldPrice: 2490,
    images: [
      'https://hipkids.pk/cdn/shop/files/1_aa3150de-0067-4da9-bb13-74f6f55e891b.webp?v=1781798469&width=800',
      'https://hipkids.pk/cdn/shop/files/4_069d22b4-3562-4332-8e30-3d6e4bc3df12.webp?v=1781799877&width=800'
    ],
    description: 'Bring in the summer vibes with this comfortable light green romper. Featuring standard buttons for easy diaper change.',
    sizes: ['3-6M', '6-9M', '12-18M'],
    categories: ['baby-boy', 'rompers'],
    tags: ['new-arrivals', 'sale']
  },
  {
    id: 'p4',
    name: 'Baby Girl Mid Blue Embroidered Flower Short',
    price: 2490,
    images: [
      'https://hipkids.pk/cdn/shop/files/29_2982b358-cf68-44ff-b273-ed359e19be35.webp?v=1775561386&width=800',
      'https://hipkids.pk/cdn/shop/files/5_17c586c1-307f-4d73-8031-efd53f7dd33c.webp?v=1775553258&width=800'
    ],
    description: 'Mid blue shorts with cute embroidered flowers. Soft elastic waistband offers comfortable snug fit. Pairs beautifully with any simple tee.',
    sizes: ['1Y', '2Y', '3Y'],
    categories: ['baby-girl'],
    tags: ['new-arrivals']
  },
  {
    id: 'p5',
    name: 'Baby Girl 3 Piece Set Watch Me Fly',
    price: 2990,
    oldPrice: 3490,
    images: [
      'https://hipkids.pk/cdn/shop/files/5_17c586c1-307f-4d73-8031-efd53f7dd33c.webp?v=1775553258&width=800',
      'https://hipkids.pk/cdn/shop/files/29_2982b358-cf68-44ff-b273-ed359e19be35.webp?v=1775561386&width=800'
    ],
    description: 'Adorable 3-piece clothing set for baby girls featuring a "Watch Me Fly" text print, matching diaper cover, and matching cute head band.',
    sizes: ['1Y', '2Y'],
    categories: ['baby-girl'],
    tags: ['new-arrivals', 'sale']
  },
  {
    id: 'p6',
    name: 'Boy Polo Stripe Cotton Set',
    price: 3190,
    images: [
      'https://hipkids.pk/cdn/shop/files/11_83771680-1eaa-4422-809a-94c664f10dc0.webp?v=1781784029&width=800',
      'https://hipkids.pk/cdn/shop/files/4_69501cda-4a3c-4386-8398-174da10db790.webp?v=1775554413&width=800'
    ],
    description: 'Striped polo tee and shorts set made of premium combed cotton. Keeps active boys cool and styled all day long.',
    sizes: ['3-4Y', '4-5Y', '6-7Y'],
    categories: ['boy'],
    tags: ['new-arrivals', 'bestsellers']
  },
  {
    id: 'p7',
    name: 'Girl Floral Co-ord Set Summer',
    price: 2790,
    images: [
      'https://hipkids.pk/cdn/shop/files/3_a8c20e30-240f-4c9f-8a79-4ef2813bf2de.webp?v=1775554042&width=800',
      'https://hipkids.pk/cdn/shop/files/5_17c586c1-307f-4d73-8031-efd53f7dd33c.webp?v=1775553258&width=800'
    ],
    description: 'Perfect summery two-piece coordinates set featuring vibrant flower graphics and light-weight breathable cotton.',
    sizes: ['3-4Y', '4-5Y', '5-6Y'],
    categories: ['girl'],
    tags: ['new-arrivals', 'trending']
  },
  {
    id: 'f1',
    name: 'CT Baby Girl Brown Rainbow Shoes',
    price: 4990,
    images: [
      'https://hipkids.pk/cdn/shop/files/29_2982b358-cf68-44ff-b273-ed359e19be35.webp?v=1775561386&width=800',
      'https://hipkids.pk/cdn/shop/files/5_17c586c1-307f-4d73-8031-efd53f7dd33c.webp?v=1775553258&width=800'
    ],
    description: 'Stylish rainbow-embroidered toddler footwear with soft sole backing. Prevents slipping while walking.',
    sizes: ['17', '18'],
    categories: ['footwear'],
    tags: ['new-arrivals']
  },
  {
    id: 'f2',
    name: 'All In Motion Unisex Black Slip-on Sneakers',
    price: 5990,
    images: [
      'https://hipkids.pk/cdn/shop/files/4_69501cda-4a3c-4386-8398-174da10db790.webp?v=1775554413&width=800',
      'https://hipkids.pk/cdn/shop/files/3_a8c20e30-240f-4c9f-8a79-4ef2813bf2de.webp?v=1775554042&width=800'
    ],
    description: 'Super comfy black sneakers. Stretch collar and slip-on style make putting them on a breeze. Lightweight sole for optimal support.',
    sizes: ['32', '33', '34'],
    categories: ['footwear'],
    tags: ['trending']
  },
  {
    id: 'f3',
    name: 'All In Motion Girl Peach Slip-on Sneakers',
    price: 5990,
    images: [
      'https://hipkids.pk/cdn/shop/files/3_a8c20e30-240f-4c9f-8a79-4ef2813bf2de.webp?v=1775554042&width=800',
      'https://hipkids.pk/cdn/shop/files/4_69501cda-4a3c-4386-8398-174da10db790.webp?v=1775554413&width=800'
    ],
    description: 'Fabulous peach slip-on sneakers for active girls. Breathable knit design with cushioned insole for comfort.',
    sizes: ['31', '32', '33', '34'],
    categories: ['footwear'],
    tags: []
  },
  {
    id: 'f4',
    name: 'C&J Girl Pink Belt Slip-On Sneakers',
    price: 4990,
    oldPrice: 5490,
    images: [
      'https://hipkids.pk/cdn/shop/files/5_17c586c1-307f-4d73-8031-efd53f7dd33c.webp?v=1775553258&width=800',
      'https://hipkids.pk/cdn/shop/files/29_2982b358-cf68-44ff-b273-ed359e19be35.webp?v=1775561386&width=800'
    ],
    description: 'Pink fashion sneakers with secure elastic belt strap for custom fit and comfort. Anti-skid sole.',
    sizes: ['20', '23', '24', '25'],
    categories: ['footwear'],
    tags: ['sale']
  },
  {
    id: 'a1',
    name: 'Kids Cute Animal Sunglasses',
    price: 990,
    images: [
      'https://hipkids.pk/cdn/shop/files/8_c37c229f-3d61-419b-a01f-df8497d3dc71.jpg?v=1719572621&width=800',
      'https://hipkids.pk/cdn/shop/files/7_70d2f093-9c86-455b-91cc-c66af6241b21.jpg?v=1719572621&width=800'
    ],
    description: 'Fun animal ears shape sunglasses with UV400 protection. Safe, durable frames for toddlers.',
    sizes: ['OS'],
    categories: ['accessories'],
    tags: ['trending']
  },
  {
    id: 'a2',
    name: 'Baby Soft Cotton Socks 3-Pack',
    price: 790,
    images: [
      'https://hipkids.pk/cdn/shop/files/9_ab5e7552-094d-44a5-9273-df5b4b1c2b5f.jpg?v=1719572621&width=800'
    ],
    description: 'Super soft socks bundle for newborns, designed with skid-resistant rubber grips at the bottom.',
    sizes: ['0-6M', '6-12M'],
    categories: ['accessories'],
    tags: ['new-born']
  },
  {
    id: 'h1',
    name: 'Boys Premium Kurta Shalwar',
    price: 4490,
    images: [
      'https://hipkids.pk/cdn/shop/files/1_3e00b8cd-8a30-4e3a-b850-2f3b9c6a1d13.jpg?v=1710926831&width=800',
      'https://hipkids.pk/cdn/shop/files/2_9c2d15d4-42b7-4c07-9e06-5b4d90e2df45.jpg?v=1710926831&width=800'
    ],
    description: 'Elegant formal Eastern Kurta Shalwar, tailored for ultimate class and sophistication. Perfect for Eid and weddings.',
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
    categories: ['hadid'],
    tags: ['bestsellers']
  },
  {
    id: 'h2',
    name: 'Girls Embroidered Kurti',
    price: 3990,
    images: [
      'https://hipkids.pk/cdn/shop/files/2_9c2d15d4-42b7-4c07-9e06-5b4d90e2df45.jpg?v=1710926831&width=800',
      'https://hipkids.pk/cdn/shop/files/1_3e00b8cd-8a30-4e3a-b850-2f3b9c6a1d13.jpg?v=1710926831&width=800'
    ],
    description: 'Beautiful traditional Pakistani kurti with delicate mirror-work and embroidery on neckline.',
    sizes: ['4-5Y', '6-7Y', '8-9Y'],
    categories: ['hadid'],
    tags: []
  },
  {
    id: 'n1',
    name: 'Newborn Sleepsuit with Mittens',
    price: 1890,
    images: [
      'https://hipkids.pk/cdn/shop/files/7_70d2f093-9c86-455b-91cc-c66af6241b21.jpg?v=1719572621&width=800'
    ],
    description: 'Cuddly newborn footie sleepsuit with fold-over scratch mittens. Crafted with double zippers.',
    sizes: ['NB', '0-3M'],
    categories: ['new-born'],
    tags: ['new-born']
  },
  {
    id: 'p8',
    name: 'Kids Casual Denim Jacket',
    price: 3490,
    oldPrice: 4290,
    images: [
      'https://hipkids.pk/cdn/shop/files/1_aa3150de-0067-4da9-bb13-74f6f55e891b.webp?v=1781798469&width=800'
    ],
    description: 'Classic denim jacket for kids. Perfect for layering during mild winters and chilly evenings.',
    sizes: ['3-4Y', '4-5Y', '5-6Y'],
    categories: ['boy', 'girl'],
    tags: ['trending', 'sale']
  },
  {
    id: 'p9',
    name: 'Baby Boy Graphic Print Tee',
    price: 1290,
    images: [
      'https://hipkids.pk/cdn/shop/files/4_069d22b4-3562-4332-8e30-3d6e4bc3df12.webp?v=1781799877&width=800'
    ],
    description: 'Comfortable everyday cotton tee with a fun graphic print. Durable and easy to wash.',
    sizes: ['1Y', '2Y', '3Y'],
    categories: ['baby-boy'],
    tags: ['new-arrivals']
  },
  {
    id: 'p10',
    name: 'Baby Girl Ruffled Party Dress',
    price: 4990,
    images: [
      'https://hipkids.pk/cdn/shop/files/29_2982b358-cf68-44ff-b273-ed359e19be35.webp?v=1775561386&width=800'
    ],
    description: 'Elegant ruffled party dress with delicate lace details. Perfect for special occasions and birthdays.',
    sizes: ['1Y', '2Y', '3Y', '4Y'],
    categories: ['baby-girl'],
    tags: ['bestsellers']
  },
  {
    id: 'bb-set1',
    name: 'Baby Boy Summer Set',
    price: 2490,
    images: [
      'https://hipkids.pk/cdn/shop/files/11_83771680-1eaa-4422-809a-94c664f10dc0.webp?v=1781784029&width=800'
    ],
    description: 'Cool and comfy 2-piece summer set.',
    sizes: ['1Y', '2Y'],
    categories: ['baby-boy', 'sets'],
    tags: ['new-arrivals', 'summer-sale']
  },
  {
    id: 'bb-polo1',
    name: 'Classic Pique Polo',
    price: 1890,
    images: [
      'https://hipkids.pk/cdn/shop/files/4_69501cda-4a3c-4386-8398-174da10db790.webp?v=1775554413&width=800'
    ],
    description: 'A classic polo shirt in breathable pique cotton.',
    sizes: ['2Y', '3Y', '4Y'],
    categories: ['baby-boy', 'polos', 'shirts'],
    tags: []
  },
  {
    id: 'bb-formal1',
    name: 'Baby Boy 3-Piece Formal Suit',
    price: 5990,
    images: [
      'https://hipkids.pk/cdn/shop/files/1_3e00b8cd-8a30-4e3a-b850-2f3b9c6a1d13.jpg?v=1710926831&width=800'
    ],
    description: 'Dapper 3-piece suit including waistcoat, shirt, and trousers.',
    sizes: ['1Y', '2Y', '3Y'],
    categories: ['baby-boy', 'formal-suits'],
    tags: ['trending']
  },
  {
    id: 'acc-sun1',
    name: 'Retro UV400 Sunglasses',
    price: 890,
    images: [
      'https://hipkids.pk/cdn/shop/files/8_c37c229f-3d61-419b-a01f-df8497d3dc71.jpg?v=1719572621&width=800'
    ],
    description: 'Stylish retro sunglasses offering full UV protection.',
    sizes: ['OS'],
    categories: ['accessories', 'sunglasses'],
    tags: ['sale']
  },
  {
    id: 'acc-sock1',
    name: 'Cotton Ankle Socks 5-Pack',
    price: 990,
    images: [
      'https://hipkids.pk/cdn/shop/files/9_ab5e7552-094d-44a5-9273-df5b4b1c2b5f.jpg?v=1719572621&width=800'
    ],
    description: 'Everyday comfortable cotton socks with anti-slip grip.',
    sizes: ['1-3Y', '4-6Y'],
    categories: ['accessories', 'socks'],
    tags: ['bestsellers']
  }
];

async function seed() {
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        "oldPrice" INTEGER,
        images JSONB NOT NULL,
        description TEXT NOT NULL,
        sizes JSONB NOT NULL,
        categories JSONB NOT NULL,
        tags JSONB NOT NULL
      );
    `);
    console.log('Table "products" ensured.');

    await client.query('DROP TABLE IF EXISTS products;');
    await client.query(`
      CREATE TABLE products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        "oldPrice" INTEGER,
        images JSONB NOT NULL,
        description TEXT NOT NULL,
        sizes JSONB NOT NULL,
        categories JSONB NOT NULL,
        tags JSONB NOT NULL
      );
    `);
    console.log('Recreated table "products" with categories array.');

    for (const p of INITIAL_PRODUCTS) {
      await client.query(`
        INSERT INTO products (id, name, price, "oldPrice", images, description, sizes, categories, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [p.id, p.name, p.price, p.oldPrice || null, JSON.stringify(p.images), p.description, JSON.stringify(p.sizes), JSON.stringify(p.categories), JSON.stringify(p.tags || [])]);
    }
    console.log('Inserted seed products successfully!');

  } catch (err) {
    console.error('Error executing seed script:', err);
  } finally {
    await client.end();
  }
}

seed();
