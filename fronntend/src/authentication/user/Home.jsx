import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { axiosInstance } from "../../api/axiosConfig";
import banner from "../../assets/ujfhhhhhhhhhhhhhhhhhhhhhep.jpg";
import banner2 from "../../assets/b1.jpg";
import banner3 from "../../assets/b2.jpg";
import banner4 from "../../assets/b3.webp";
import banner5 from "../../assets/b4.jpg";
import banner6 from "../../assets/b5.webp";
import ImageCarousel from "./Layout/ImageCarousel";

const INITIAL_PRODUCT_COUNT = 8;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState(INITIAL_PRODUCT_COUNT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const bannerImages = [banner, banner2, banner3, banner4, banner5, banner6];
  const productImages = [banner, banner2, banner3, banner4, banner5, banner6];

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get("/user/products");
        const productsData = Array.isArray(response.data)
          ? response.data
          : response.data?.activeProducts || [];
        setProducts(productsData);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to fetch products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const loadMoreProducts = () => {
    setVisibleProducts((prevCount) => prevCount + INITIAL_PRODUCT_COUNT);
  };

  const displayProducts = Array.isArray(products)
    ? products.slice(0, visibleProducts)
    : [];

  return (
    <main className="flex-grow overflow-auto main-content">
      {/* Hero Section */}
      <section className="relative">
        <div className="relative w-full h-screen">
          <ImageCarousel images={bannerImages} showOverlay={true} />
          <div className="absolute inset-0 container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative z-10 w-full md:w-1/2 p-6 bg-white bg-opacity-5 backdrop-blur-lg rounded-xl shadow-xl">
              <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4 leading-tight  text-transparent bg-clip-text bg-gradient-to-r from-cyan-900 to-black uppercase ">
                Introducing the UltraFlex Runner
              </h2>

              <p className="text-lg md:text-xl mb-6 text-white font-serif">
                Experience unparalleled comfort and performance with our latest
                innovation in running technology.
              </p>
              <button className="bg-gradient-to-r from-black to-cyan-500 text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:from-black hover:to-cyan-600 transition duration-300 ease-in-out transform hover:scale-105">
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-semibold mb-8 text-center text-gray-800 font-mono">
            Why Choose UltraFlex Runner?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
            {/* Card 1 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg border border-gray-700 overflow-hidden transition transform hover:scale-105 max-w-[300px] mx-auto">
              <img
                src={banner2}
                alt="Superior Comfort"
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="p-3">
                <h4 className="font-semibold mb-2 text-gray-800 text-lg text-center">
                  Superior Comfort
                </h4>
                <p className="text-gray-600 text-sm text-center">
                  Our patented cushioning system provides all-day comfort for
                  any activity.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg border border-gray-700 overflow-hidden transition transform hover:scale-105 max-w-[300px] mx-auto">
              <img
                src={banner3}
                alt="Lightweight Design"
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="p-3">
                <h4 className="font-semibold mb-2 text-gray-800 text-lg text-center">
                  Lightweight Design
                </h4>
                <p className="text-gray-600 text-sm text-center">
                  Engineered to be incredibly light without compromising on
                  durability.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg border border-gray-700 overflow-hidden transition transform hover:scale-105 max-w-[300px] mx-auto">
              <img
                src={banner4}
                alt="Eco-Friendly Materials"
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="p-3">
                <h4 className="font-semibold mb-2 text-gray-800 text-lg text-center">
                  Eco-Friendly Materials
                </h4>
                <p className="text-gray-600 text-sm text-center">
                  Made with sustainable materials to reduce our environmental
                  impact.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg border border-gray-700 overflow-hidden transition transform hover:scale-105 max-w-[300px] mx-auto">
              <img
                src={banner5}
                alt="Durability"
                className="w-full aspect-[3/4] object-cover "
              />
              <div className="p-3">
                <h4 className="font-semibold mb-2 text-gray-800 text-lg text-center">
                  Durability
                </h4>
                <p className="text-gray-600 text-sm text-center ">
                  Built to withstand wear and tear, ensuring longevity and
                  performance.
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
            Our Products
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
                    key={product?._id}
                    id={product?._id}
                    name={product?.productName}
                    price={product?.salePrice}
                    images={product?.images || []}
                  />
                ))}
              </div>
              {products.length > visibleProducts && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMoreProducts}
                    className="bg-indigo-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-transform"
                  >
                    Explore More
                  </button>
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
    </main>
  );
};

export default HomePage;
