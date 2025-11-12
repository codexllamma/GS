import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, User, Menu, X, Leaf } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const { cart } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 glass-effect bg-white border-b border-primary-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          
          <Link href="/dashboard" className="flex items-center space-x-2 py-5">
          <div className='  flex justify-center'>

            <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl mb-4 shadow-lg mx-auto"
          >
            <span className="text-white font-bold text-xl tracking-wider">GS</span>
          </motion.div>
          </div>

          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 font-poppins text-base">
          {[
            { href: "/dashboard", label: "Home" },
            { href: "/product/products", label: "Products" },
            { href: "/categories", label: "Categories" },
            { href: "/about", label: "About" },
            { href: "/orders/orders-page", label: "Your Orders" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative group font-medium transition-all duration-300 ease-in-out"
            >
              <span className="text-gray-400 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300">
                {label}
              </span>
              <span
                className="absolute left-0 -bottom-1 h-0.5 w-full scale-x-0 group-hover:scale-x-100 
                origin-left transition-transform bg-gradient-to-r from-orange-500 to-amber-400 duration-300"
              ></span>
            </Link>
          ))}
        </nav>


          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-primary-50"
            >
              <Search size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-primary-50"
            >
              <User size={20} />
            </motion.button>
            <Link href="/cart" className="relative p-2 text-gray-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-primary-50">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-primary-600 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-effect border-t border-primary-100/50"
          >
            <div className="px-4 py-4 space-y-4">
              <Link
                href="/"
                className="block text-dark-600 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/product/products"
                className="block text-dark-600 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/categories"
                className="block text-dark-600 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                href="/about"
                className="block text-dark-600 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="flex items-center space-x-4 pt-4 border-t border-primary-100/50">
                <button className="p-2 text-dark-600 hover:text-primary-600 transition-colors">
                  <Search size={20} />
                </button>
                <button className="p-2 text-dark-600 hover:text-primary-600 transition-colors">
                  <User size={20} />
                </button>
                <Link
                  href="/cart"
                  className="relative p-2 text-dark-600 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingBag size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;