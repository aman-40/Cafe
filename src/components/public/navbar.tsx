import Link from "next/link";
import { Menu, Coffee } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CartDrawer } from "./cart-drawer";

export function Navbar({ cafeName = "Café" }: { cafeName?: string }) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="text-xl font-serif font-bold tracking-tight text-primary">
            {cafeName}
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <Link href="/menu" className="transition-colors hover:text-primary">Menu</Link>
          <Link href="/reserve" className="transition-colors hover:text-primary">Reserve</Link>
          <Link href="/about" className="transition-colors hover:text-primary">About</Link>
          <Link href="/contact" className="transition-colors hover:text-primary">Contact</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/menu" className={buttonVariants({ className: "rounded-full" })}>
            View Menu
          </Link>
          <CartDrawer />
        </div>

        {/* Mobile menu - simplified for now */}
        <div className="md:hidden flex items-center gap-2">
          <CartDrawer />
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
