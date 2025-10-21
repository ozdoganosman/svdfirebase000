const admin = require("firebase-admin");

// Initialize admin SDK
const serviceAccount = require("../svdfirebase000-firebase-adminsdk-fbsvc-92df2d7279.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "svdfirebase000"
  });
}

const db = admin.firestore();

const categories = [
  {
    id: "paper-bags",
    name: "Kağıt Poşetler",
    description: "Çevre dostu kağıt poşetler",
    image: "/images/categories/paper-bags.jpg"
  },
  {
    id: "plastic-bags",
    name: "Plastik Poşetler",
    description: "Dayanıklı plastik poşetler",
    image: "/images/categories/plastic-bags.jpg"
  }
];

const products = [
  {
    id: "kraft-paper-bag",
    name: "Kraft Kağıt Poşet",
    description: "Doğa dostu kraft kağıt poşet",
    price: 2.50,
    categoryId: "paper-bags",
    images: ["/images/products/kraft-paper-bag-1.jpg"],
    stock: 1000
  },
  {
    id: "hdpe-plastic-bag",
    name: "HDPE Plastik Poşet",
    description: "Yüksek dayanıklı plastik poşet",
    price: 1.75,
    categoryId: "plastic-bags",
    images: ["/images/products/hdpe-plastic-bag-1.jpg"],
    stock: 2000
  }
];

async function seedData() {
  try {
    // Add categories
    for (const category of categories) {
      await db.collection("categories").doc(category.id).set(category);
      console.log(`Added category: ${category.name}`);
    }

    // Add products
    for (const product of products) {
      await db.collection("products").doc(product.id).set(product);
      console.log(`Added product: ${product.name}`);
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

seedData();
