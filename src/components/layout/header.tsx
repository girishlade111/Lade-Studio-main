"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { User, Menu, Feather, ChevronDown, ShoppingCart, Heart, LogIn } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { categories } from "@/lib/data";
import SearchDialog from "@/components/search-dialog";
import { useAuthContext } from "@/context/AuthContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { AuthModal } from "@/components/auth/AuthModal";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import type { Product } from '@/types';

type CartItem = Product & { quantity: number };

const Logo = () => (
  <Link href="/" className="flex items-center gap-2">
    <Feather className="h-7 w-7 text-primary" />
    <span className="text-2xl font-headline font-bold">Lade Studio</span>
  </Link>
);

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

const ShopDropdown = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost">
                Shop <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem asChild>
                <Link href="/products">All Products</Link>
            </DropdownMenuItem>
            {categories.map((category) => (
                <DropdownMenuItem key={category.name} asChild>
                    <Link href={`/products?category=${category.name.toLowerCase().replace(/ /g, '-')}`}>{category.name}</Link>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);

const NavLinks = ({ className }: { className?: string }) => (
  <nav className={className}>
    <ShopDropdown />
    <Button variant="ghost" asChild>
        <Link href="/custom-design">Custom Design</Link>
    </Button>
    {navLinks.map((link) => (
      <Button key={link.label} variant="ghost" asChild>
        <Link href={link.href}>{link.label}</Link>
      </Button>
    ))}
    <Button variant="ghost" onClick={() => window.open('https://form.jotform.com/252305862627459','blank','scrollbars=yes,toolbar=no,width=700,height=500')}>
      Contact
    </Button>
  </nav>
);

const HeaderActions = ({ className }: { className?: string }) => {
  const { isAuthenticated } = useAuthContext();
  const { wishlistCount } = useWishlist();
  const { cartItems } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Calculate cart item count
  const cartCount = cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  return (
    <>
      <div className={className}>
        <SearchDialog />
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowAuthModal(true)}
          >
            <LogIn className="h-5 w-5" />
            <span className="sr-only">Sign In</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/wishlist">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
            <span className="sr-only">Wishlist</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="sr-only">Shopping Cart</span>
          </Link>
        </Button>
      </div>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        <NavLinks className="hidden md:flex items-center gap-2" />
        <div className="flex items-center">
          {/* Show HeaderActions on both mobile and desktop */}
          <HeaderActions className="flex items-center" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
              <SheetHeader className="p-4 border-b">
                 <SheetTitle className="text-left"><Logo /></SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <nav className="flex flex-col items-start gap-2 p-4">
                  <ShopDropdown />
                  <Button variant="link" asChild className="text-lg">
                    <Link href="/custom-design">Custom Design</Link>
                  </Button>
                  {navLinks.map((link) => (
                    <Button key={link.label} variant="link" asChild className="text-lg">
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                   <Button variant="link" className="text-lg" onClick={() => window.open('https://form.jotform.com/252305862627459','blank','scrollbars=yes,toolbar=no,width=700,height=500')}>
                        Contact
                    </Button>
                </nav>
                <div className="mt-auto p-4 border-t">
                    {/* Remove the duplicate HeaderActions from the sheet since we're showing them above */}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}