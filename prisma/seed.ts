import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing old data...");
  await prisma.message.deleteMany();
  await prisma.rescueRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.disaster.deleteMany();
  await prisma.shelter.deleteMany();
  await prisma.hospital.deleteMany();

  console.log("Seeding database...");

  // Seed Users
  const hashedPassword = await bcrypt.hash("1234", 10);


  await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: hashedPassword,
      name: "Admin Command",
      role: "ADMIN",
      phone: "+91-999-999-9999"
    }
  });

  await prisma.user.create({
    data: {
      email: "rescuer@test.com",
      password: hashedPassword,
      name: "Bengaluru Rescue Alpha",
      role: "RESCUE_TEAM",
      phone: "+91-888-888-8888"
    }
  });

  await prisma.user.create({
    data: {
      email: "citizen@test.com",
      password: hashedPassword,
      name: "John Citizen",
      role: "CITIZEN",
      phone: "+91-777-777-7777"
    }
  });


  // Seed Disasters
  const disasters = [
    {
      title: "Category 4 Hurricane Flash Floods",
      type: "FLOOD" as const,
      description: "Severe flooding in the downtown valley. Water levels rising rapidly.",
      latitude: 12.9716,
      longitude: 77.5946,
      radius: 5.5,
      severity: "CRITICAL",
    },
    {
      title: "Magnitude 6.5 Earthquake",
      type: "EARTHQUAKE" as const,
      description: "Strong tremors detected. Infrastructure damage expected.",
      latitude: 12.9800,
      longitude: 77.5800,
      radius: 10.0,
      severity: "HIGH",
    },
    {
      title: "Canyon Wildfire",
      type: "WILDFIRE" as const,
      description: "Fast-moving brush fire driven by high winds.",
      latitude: 12.9600,
      longitude: 77.6000,
      radius: 8.0,
      severity: "MEDIUM",
    }
  ];

  for (const d of disasters) {
    await prisma.disaster.create({ data: d });
  }

  // Seed Shelters
  const shelters = [
    {
      name: "Central High School Relief Center",
      latitude: 12.9750,
      longitude: 77.5900,
      capacity: 500,
      occupancy: 120,
      resourcesAvailable: ["Food", "Water", "Blankets", "Medical Kits"],
      contactNumber: "+91-800-555-0199",
    },
    {
      name: "Westside Community Hall",
      latitude: 12.9650,
      longitude: 77.5850,
      capacity: 200,
      occupancy: 190,
      resourcesAvailable: ["Water", "First Aid"],
      contactNumber: "+91-800-555-0200",
    }
  ];

  for (const s of shelters) {
    await prisma.shelter.create({ data: s });
  }

  // Seed Hospitals
  const hospitals = [
    {
      name: "Mercy General Hospital",
      latitude: 12.9700,
      longitude: 77.5980,
      contact: "+91-800-555-0911",
      emergencyAvailability: true,
      bedsAvailable: 45,
    },
    {
      name: "City Health Medical Center",
      latitude: 12.9850,
      longitude: 77.5700,
      contact: "+91-800-555-0912",
      emergencyAvailability: true,
      bedsAvailable: 12,
    }
  ];

  for (const h of hospitals) {
    await prisma.hospital.create({ data: h });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
