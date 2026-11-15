export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

// Mock categories - these will eventually come from the database
export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Web Applications",
    icon: "Globe",
    count: 423,
  },
  {
    id: "cat-2",
    name: "Mobile Apps",
    icon: "Smartphone",
    count: 287,
  },
  {
    id: "cat-3",
    name: "SaaS",
    icon: "Cloud",
    count: 356,
  },
  {
    id: "cat-4",
    name: "E-commerce",
    icon: "ShoppingCart",
    count: 198,
  },
  {
    id: "cat-5",
    name: "Business Systems",
    icon: "Building2",
    count: 245,
  },
  {
    id: "cat-6",
    name: "Admin Dashboards",
    icon: "LayoutDashboard",
    count: 312,
  },
  {
    id: "cat-7",
    name: "APIs",
    icon: "Code2",
    count: 167,
  },
  {
    id: "cat-8",
    name: "UI Kits",
    icon: "Palette",
    count: 234,
  },
  {
    id: "cat-9",
    name: "Templates",
    icon: "FileText",
    count: 289,
  },
  {
    id: "cat-10",
    name: "Developer Tools",
    icon: "Wrench",
    count: 156,
  },
  {
    id: "cat-11",
    name: "Plugins",
    icon: "Plug",
    count: 98,
  },
  {
    id: "cat-12",
    name: "AI Tools",
    icon: "Sparkles",
    count: 134,
  },
];
