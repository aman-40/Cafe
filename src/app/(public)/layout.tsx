import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { prisma } from "@/lib/prisma";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const cafeSettings = await prisma.cafeSettings.findFirst();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar cafeName={cafeSettings?.name || "The Premium Café"} />
      <main className="flex-1 bg-background">
        {children}
      </main>
      <Footer 
        cafeName={cafeSettings?.name || "The Premium Café"} 
        address={cafeSettings?.address}
        phone={cafeSettings?.phone}
      />
    </div>
  );
}
