import React from "react";

interface VoucherWatermarkProps {
    text?: string;
    color?: "green" | "red" | "blue" | "slate";
    className?: string;
}

const colorMap = {
    green: "text-emerald-700/12 border-emerald-700/12 print:text-emerald-800/15 print:border-emerald-800/15",
    red: "text-red-700/12 border-red-700/12 print:text-red-800/15 print:border-red-800/15",
    blue: "text-blue-700/12 border-blue-700/12 print:text-blue-800/15 print:border-blue-800/15",
    slate: "text-slate-900/[0.08] border-slate-900/[0.08] print:text-black/[0.09] print:border-black/[0.09]",
};

export default function VoucherWatermark({
    text = "PAID",
    color = "green",
    className = "",
}: VoucherWatermarkProps) {
    const colorClasses = colorMap[color] || colorMap.green;

    return (
        <div
            className={`pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 ${className}`}
            aria-hidden="true"
        >
            <div
                className={`transform -rotate-[24deg] border-[5px] rounded-2xl px-10 py-3 sm:px-14 sm:py-4 text-center font-black uppercase tracking-[0.25em] select-none ${colorClasses}`}
                style={{
                    fontSize: "clamp(42px, 7vw, 76px)",
                    lineHeight: 1,
                    letterSpacing: "0.22em",
                }}
            >
                {text}
            </div>
        </div>
    );
}
