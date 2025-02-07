import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../authentication/user/ProductCard";
import { axiosInstance } from "../../api/axiosConfig";
import banner from "../../assets/ujfhhhhhhhhhhhhhhhhhhhhhep.jpg";
import banner2 from "../../assets/b1.jpg";
import banner3 from "../../assets/b2.jpg";
import banner4 from "../../assets/b3.webp";
import banner5 from "../../assets/b4.jpg";
import banner6 from "../../assets/b5.webp";
import ImageCarousel from "../../authentication/user/Layout/ImageCarousel";
import axios from 'axios'; 
const INITIAL_PRODUCT_COUNT = 4;
import { fetchPublicProducts } from "../../api/product/"; // Update the path
const isAuthenticated = () => {
  const userToken = Cookies.get("user_access_token");
  return !!userToken;
};
const LandingPage= () => {
  const [products, setProducts] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState(INITIAL_PRODUCT_COUNT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const bannerImages = ["https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2019%2F10%2Fnew-balance-football-tekela-furon-newcolorway-tw.jpg?w=960&cbr=1&q=90&fit=max", banner2, "https://pbs.twimg.com/media/EHtzxsfWoAAmESM.jpg"];
  const productImages = ["https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2019%2F10%2Fnew-balance-football-tekela-furon-newcolorway-tw.jpg?w=960&cbr=1&q=90&fit=max", banner2, "https://pbs.twimg.com/media/EHtzxsfWoAAmESM.jpg"];
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const { activeProducts } = await fetchPublicProducts(INITIAL_PRODUCT_COUNT);
        setProducts(activeProducts);
        setError(null);
      } catch (err) {
        console.error('Error loading products:', err);
        setError("Failed to load products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const loadMoreProducts = () => {
    setVisibleProducts((prevCount) => prevCount + INITIAL_PRODUCT_COUNT);
  };

  const handleWishlistUpdate = async (productId, isWishlisted) => {
    if (isWishlisted) {
      setWishlistItems(prev => [...prev, productId]);
    } else {
      setWishlistItems(prev => prev.filter(id => id !== productId));
    }
  };
  const displayProducts = Array.isArray(products)
    ? products.slice(0, visibleProducts)
    : [];

  return (
    <main className="flex-grow overflow-auto main-content">
      {/* Hero Section */}
      <section className="relative">
        <div className="relative w-full h-screen  ">
          <ImageCarousel images={bannerImages} showOverlay={true} />
          <div className="absolute inset-0 container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative z-10 w-full md:w-1/2 p-6 bg-white bg-opacity-5 backdrop-blur-lg rounded-xl shadow-xl">
              <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4 leading-tight  text-transparent bg-clip-text bg-gradient-to-r from-white to-black-250 uppercase ">
                Introducing the UltraFlex Runner
              </h2>

              <p className="text-lg md:text-xl mb-6 text-white font-serif">
                Experience unparalleled comfort and performance with our latest
                innovation in running technology.
              </p>
              <button className="bg-black text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:from-black hover:to-cyan-600 transition duration-300 ease-in-out transform hover:scale-105">
                Shop Now
              </button>
            </div>
            {/* Hero Image Carousel */}
            <div className="relative z-10 w-full md:w-1/2 flex justify-center mt-8 md:mt-0">
              <div className="w-3/4 h-[300px] rounded-xl overflow-hidden">
                <ImageCarousel
                  images={productImages}
                  autoPlay={true}
                  interval={5000}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-50">
        <div className="container mx-auto px-6 lg:px-12">
          <h3 className="text-3xl font-bold mb-12 text-center text-gray-800 font-sans tracking-wide">
            FEATURES
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Card 1 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl">
              <img
                src={banner2}
                alt="Superior Comfort"
                className="w-full h-56 object-cover"
              />
              <div className="p-6 text-center">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  Superior Comfort
                </h4>
                <p className="text-gray-600 text-sm">
                  Our patented cushioning system provides all-day comfort for any activity.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl">
              <img
                src="https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2019%2F10%2Fnew-balance-football-tekela-furon-newcolorway-tw.jpg?w=960&cbr=1&q=90&fit=max"
                alt="Lightweight Design"
                className="w-full h-56 object-cover"
              />
              <div className="p-6 text-center">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  Lightweight Design
                </h4>
                <p className="text-gray-600 text-sm">
                  Engineered to be incredibly light without compromising on durability.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl">
              <img
                src="https://thumblr.uniid.it/images/1702625644-ec84c8dd772f.jpegquality-100.jpg?width=640&format=webp&q=75"
                alt="Eco-Friendly Materials"
                className="w-full h-56 object-cover"
              />
              <div className="p-6 text-center">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  Eco-Friendly Materials
                </h4>
                <p className="text-gray-600 text-sm">
                  Made with sustainable materials to reduce our environmental impact.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl">
              <img
                src="https://images.prodirectsport.com/ProductImages/Main/1020570_Main_1845520.jpg"
                alt="Durability"
                className="w-full h-56 object-cover"
              />
              <div className="p-6 text-center">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  Durability
                </h4>
                <p className="text-gray-600 text-sm">
                  Built to withstand wear and tear, ensuring longevity and performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-semibold mb-8 text-center text-gray-800 font-mono">
            PRODUCTS
          </h3>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
              {error}
            </div>
          ) : displayProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {displayProducts.map((product) => (
                  <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.productName || "Unnamed Product"}
                  price={product.regularPrice || 0}
                  images={product.images || []}
                  discountPercent={product.discountPercent || 0}
                  availableSizes={product.availableSizes} 
                  isInWishlist={false}
                  onWishlistUpdate={(id, isWishlisted) => {
                    if (isAuthenticated()) {
                      handleWishlistUpdate(id, isWishlisted);
                    }
                  }}
                />
                ))}
              </div>
              {displayProducts.length >= 4 && (
                <div className="mt-8 text-center">
                  <Link
                    to="/user/shop"
                    className="bg-black text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-brown-700 transition-transform inline-block"
                  >
                    Explore
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 p-4">
              No products available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-semibold mb-8 text-center text-gray-800 font-mono">
            Subscribe to Our Newsletter
          </h3>
          <div className="max-w-md mx-auto">
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
              <button
                type="submit"
                className="bg-black text-white py-2 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;

