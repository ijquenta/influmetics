-- Create Company table
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rubro" TEXT,
    "culture" TEXT,
    "description" TEXT,
    "country" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Add companyId to User
ALTER TABLE "User" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add companyId to Campaign
ALTER TABLE "Campaign" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add companyId to Influencer
ALTER TABLE "Influencer" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE SET NULL ON UPDATE CASCADE;
