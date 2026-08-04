"use client";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation"; 

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
interface PageHeaderProps {
    title: string;
    description: string;

    //search optional
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;


    // back button
    showBackButton?: boolean;
    actions?: React.ReactNode;

}
export default function pageHeader({
    title,
    description,
    showSearch = false,
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "Search...",
    showBackButton = true,
    actions,
}:PageHeaderProps) {
    const router = useRouter();
return (
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
        {showBackButton && (
          <Button
                        className="bg-background text-foreground hover:opacity-90 shadow-sm"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 text-foreground" />
                    </Button>
        )}

        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">
            {title}
          </h1>

          {description && (
            <p className="text-sm text-slate-500 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

          <Input
            className="pl-10"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      )}
      {actions}
    </div>   
)
}