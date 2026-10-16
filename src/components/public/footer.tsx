import Link from "next/link";
import { Coffee, MapPin, Phone } from "lucide-react";

export function Footer({ cafeName = "Café", address, phone }: { cafeName?: string, address?: string | null, phone?: string | null }) {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Coffee className="h-6 w-6" />
              <span className="text-xl font-serif font-bold tracking-tight">
                {cafeName}
              </span>
            </Link>
            <p className="text-sm opacity-80 max-w-xs">
              Quality coffee, delicious food, and a warm atmosphere. Visit us today.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/menu" className="hover:underline">Digital Menu</Link></li>
              <li><Link href="/about" className="hover:underline">About Us</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
              <li><Link href="/location" className="hover:underline">Location</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm opacity-80">
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{phone}</span>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <Link href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                <span>Instagram</span>
              </Link>
              <Link href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                <span>Facebook</span>
              </Link>
              <Link href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                <span>Twitter</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm opacity-60">
          <p>© {new Date().getFullYear()} {cafeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
