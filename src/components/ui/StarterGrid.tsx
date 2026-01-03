"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  Bot,
  FileSignature,
  LayoutTemplate,
  AppWindow,
  Mail,
  LayoutDashboard,
  MoreHorizontal
} from "lucide-react";
import AppLauncher from "@/components/navigation/topnavigation/AppLauncher";
import SearchInput from "@/components/ui/SearchInput";
import { useState } from "react";

const options = [
  {
    label: "Form",
    description: "Create forms with logic, payments, and automation.",
    icon: FileText,
    color: "bg-orange-100 text-orange-600",
    href: "/forms",
  },
  {
    label: "AI Agent",
    description: "Create trained agents to guide users and answer questions.",
    icon: Bot,
    color: "bg-purple-100 text-purple-600",
    href: "/ai-agent",
  },
  {
    label: "E-sign",
    description: "Create documents that can be signed on any device.",
    icon: FileSignature,
    color: "bg-green-100 text-green-600",
    href: "/esign",
  },
  {
    label: "Landing Page",
    description: "Design beautiful, responsive landing pages easily.",
    icon: LayoutTemplate,
    color: "bg-blue-100 text-blue-600",
    href: "/landing",
  },
  {
    label: "Shopping Page",
    description: "Sell products and collect orders online.",
    icon: AppWindow,
    color: "bg-pink-100 text-pink-600",
    href: "/shopping",
  },
  {
    label: "HTML Email",
    description: "Design and send branded transactional emails.",
    icon: Mail,
    color: "bg-yellow-100 text-yellow-600",
    href: "/email-builder",
  },
  {
    label: "Dashboard",
    description: "Build internal tools and data dashboards.",
    icon: LayoutDashboard,
    color: "bg-teal-100 text-teal-600",
    href: "/dashboard-builder",
  },
  {
    label: "More",
    description: "Explore more tools and templates.",
    icon: MoreHorizontal,
    color: "bg-gray-200 text-gray-600",
    href: "/more",
  },
];

export default function StarterGrid({
  onFormTileClick,
}: {
  onFormTileClick: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#CBDDD1] rounded-xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-4">
<AppLauncher selected={{ key: 'builder', label: 'Builder' }} />
        <SearchInput value={search} onChange={setSearch} />
      </div>
      <h2 className="text-2xl font-semibold text-center text-[#00332D] mb-2">
        How would you like to start, Saltify?
      </h2>
      <p className="text-center text-gray-500 dark:text-[#009966] mb-6 max-w-lg mx-auto">
        Create smarter forms, build landing pages, manage data, automate workflows — all in one place.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              if (opt.label === "Form") {
                onFormTileClick();
              } else {
                router.push(opt.href);
              }
            }}
            className="bg-white dark:bg-white hover:shadow-md rounded-lg aspect-square p-5 flex flex-col items-center justify-center text-center transition border border-gray-200 group"
          >
            <div className={`w-14 h-14 rounded-md flex items-center justify-center mb-4 ${opt.color}`}>
              <opt.icon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#111827] group-hover:underline">
              {opt.label}
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#009966] mt-1">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
