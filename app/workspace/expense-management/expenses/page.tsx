"use client";
import{ useState } from "react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/pageHeader";
export default function Page() {
  return (
    <section className="w-full px-4 sm:px-6 py-4 space-y-6">
      <PageHeader
        title="Expenses"
        description="Manage your expenses"
        />
    </section>
  )
}
