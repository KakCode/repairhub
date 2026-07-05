-- CreateEnum
CREATE TYPE "ShopApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "status" SET DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "approvalDeadline" TIMESTAMP(3),
ADD COLUMN     "approvalStatus" "ShopApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "moderationNote" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;
