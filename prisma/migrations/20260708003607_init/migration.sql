-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "role" TEXT,
    "city" TEXT,
    "region" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "responsible" TEXT,
    "next_action" TEXT,
    "next_action_date" TIMESTAMP(3),
    "technical_notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "next_step" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_status_order_idx" ON "Lead"("status", "order");

-- CreateIndex
CREATE INDEX "Interaction_lead_id_idx" ON "Interaction"("lead_id");

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
