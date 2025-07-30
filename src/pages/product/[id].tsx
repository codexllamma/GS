import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft,Heart, Star,Check } from "lucide-react";
import { Product } from "@/generated/prisma";
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const res = await fetch(`/api/product/${id}`);
      const data = await res.json();
      setProduct(data);
    };
    fetchProduct();
  }, [id]);

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to products
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/*
            {product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
             */}
            
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-600 font-medium">{product.category}</span>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Heart size={24} />
                </button>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-600">{product.rating}</span>
                </div>
                <span className="ml-4 text-gray-500">({product.reviews} reviews)</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-900">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center text-green-600">
                <Check size={20} className="mr-2" />
                <span>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>

            
          </motion.div>
        </div>
      </div>
    </div>
  );
    
    
}
{/*
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ArrowLeft, Check } from 'lucide-react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700">
            Back to products
          </Link>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to products
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-600 font-medium">{product.category}</span>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Heart size={24} />
                </button>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-600">{product.rating}</span>
                </div>
                <span className="ml-4 text-gray-500">({product.reviews} reviews)</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-900">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center text-green-600">
                <Check size={20} className="mr-2" />
                <span>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!product.inStock}
              className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all ${
                product.inStock
                  ? addedToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {addedToCart ? (
                <>
                  <Check size={20} />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
/*
/*
<div className="max-w-xl mx-auto p-4">
      {product.image && (
        <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded mb-4" />
      )}
      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      <p className="text-gray-600 mb-4">{product.description}</p>
      <p className="text-lg font-semibold mb-2">₹{product.price}</p>
      <p className="text-sm text-gray-500">Category: {product.category}</p>
      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
    </div>
  );
  */}