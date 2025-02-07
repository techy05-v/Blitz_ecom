import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../../api/axiosConfig";
import cartService from "../../api/cartService/cartService";
import AnimatedCartModal from "../../confirmationModal/AnimatedCartModal";
import QuantityLimitModal from "../../confirmationModal/QuantityLimitModal";
import ProductCard from "../../authentication/user/ProductCard";
import { fetchProducts } from "../../api/product";
import { toast } from 'react-toastify';
import SelectSizeModal from "../../confirmationModal/Selectedsizemodal";
export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState({
    productName: "",
    category: { CategoryName: "" },
    images: [],
    description: "",
    regularPrice: 0,
    discountPercent: 0,
    availableSizes: [],
    color: "",
    tags: [],
    isactive: true,
  });
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuantityLimitModal, setShowQuantityLimitModal] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showSelectSizeModal, setShowSelectSizeModal] = useState(false);
  const imageRef = useRef(null);

  const MAX_QUANTITY = 5;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axiosInstance.get(`/user/product/${id}`);
        console.log("Product data:", response.data.data);
        setProduct(response.data.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again later.");
      }
    };

    fetchProduct();
  }, [id]);

  const checkCartQuantity = async (productId, size) => {
    try {
      const response = await cartService.getCartItems();
      if (!response.success) {
        throw new Error(response.message);
      }
      const cartItems = response.cart?.items || [];
      const existingItem = cartItems.find(
        (item) => item.product._id === productId && item.size === size
      );
      return existingItem ? existingItem.quantity : 0;
    } catch (err) {
      console.error("Error checking cart quantity:", err);
      return 0;
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      console.log("Fetching related products...");
      console.log("Current product category:", product.category);

      const response = await fetchProducts();
      console.log("API Response:", response);

      // Extract the products array from the response
      const products = response?.activeProducts;

      if (!products || !Array.isArray(products)) {
        console.error("No products array found in response:", response);
        return;
      }

      console.log("Processing products:", products);
      console.log("Current product ID:", id);
      console.log("Current product category ID:", product.category?._id);

      const filteredProducts = products.filter(p => {
        const isValid = p._id !== id &&
          p.category &&
          p.category._id === product.category._id;

        console.log(`Checking product ${p.productName}:`, {
          productId: p._id,
          categoryId: p.category?._id,
          currentCategoryId: product.category?._id,
          isValid
        });

        return isValid;
      });

      console.log("Filtered products:", filteredProducts);
      const slicedProducts = filteredProducts.slice(0, 4);
      console.log("Final related products:", slicedProducts);

      setRelatedProducts(slicedProducts);
    } catch (err) {
      console.error("Error fetching related products:", err);
    }
  };

  // Update the useEffect to have proper dependencies and cleanup
  useEffect(() => {
    let mounted = true;

    if (product?.category?._id) {
      console.log("Category ID available, fetching related products...");
      fetchRelatedProducts().then(() => {
        if (!mounted) return;
      });
    } else {
      console.log("Waiting for category ID...", product);
    }

    return () => {
      mounted = false;
    };
  }, [product.category?._id, id]);
  useEffect(() => {
    console.log("Related Products:", relatedProducts);
  }, [relatedProducts]);

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!product) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const handleSizeSelect = (size) => {
    const availableSize = product.availableSizes.find(s => s.size === size);
    if (availableSize && availableSize.quantity > 0) {
      setSelectedSize(size);
      setError("");
    }
  };

  const handleAddToBag = async () => {
    if (!selectedSize) {
      setShowSelectSizeModal(true); // Show the modal if no size is selected
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const currentQuantity = await checkCartQuantity(id, selectedSize);

      if (currentQuantity >= MAX_QUANTITY) {
        setShowQuantityLimitModal(true);
        return;
      }

      const result = await cartService.addToCart({
        productId: id,
        quantity: 1,
        size: selectedSize,
      });

      if (result.success) {
        setModalMessage("Item added to cart successfully!");
        setIsSuccessModalOpen(true);
      } else if (result.message.includes("Total quantity cannot exceed 5")) {
        setShowQuantityLimitModal(true);
      } else {
        setModalMessage(result.message || "Failed to add item to cart.");
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      if (err.message?.includes("Total quantity cannot exceed 5")) {
        setShowQuantityLimitModal(true);
      } else {
        setModalMessage(
          err.message || "Failed to add item to cart. Please try again."
        );
        setIsErrorModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleBuyNow = async () => {
    if (!selectedSize) {
      toast.error("Please select a size before proceeding to buy.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const currentQuantity = await checkCartQuantity(id, selectedSize);

      if (currentQuantity >= MAX_QUANTITY) {
        setShowQuantityLimitModal(true);
        return;
      }

      const result = await cartService.addToCart({
        productId: id,
        quantity: 1,
        size: selectedSize,
      });

      if (result.success) {
        window.location.href = "/user/checkout";
      } else if (result.message.includes("Total quantity cannot exceed 5")) {
        setShowQuantityLimitModal(true);
      } else {
        setModalMessage(result.message || "Failed to process order.");
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      if (err.message?.includes("Total quantity cannot exceed 5")) {
        setShowQuantityLimitModal(true);
      } else {
        setModalMessage(err.message || "Failed to process. Please try again.");
        setIsErrorModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setShowZoom(true);
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
  };

  const handleMouseMove = (e) => {
    if (imageRef.current) {
      const { left, top, width, height } =
        imageRef.current.getBoundingClientRect();
      const x = ((e.pageX - left) / width) * 100;
      const y = ((e.pageY - top) / height) * 100;
      setPosition({ x, y });
    }
  };

  const isOutOfStock = !product.availableSizes.some(
    (size) => size.quantity > 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <div
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            ref={imageRef}
          >
            <img
              src={product.images[selectedImage]}
              alt={product.productName}
              className="w-full h-full object-cover"
            />
            {showZoom && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${product.images[selectedImage]})`,
                  backgroundPosition: `${position.x}% ${position.y}%`,
                  backgroundSize: "250%",
                  backgroundRepeat: "no-repeat",
                }}
              />
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`border-2 rounded-md overflow-hidden ${selectedImage === index ? "border-black" : "border-gray-200"
                  }`}
              >
                <img
                  src={image}
                  alt={`${product.productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details Section */}
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.productName}</h1>
            <p className="text-lg text-gray-600">
              {product.category.CategoryName}
            </p>
          </div>

          <div>
            <p className="text-xl">
              MRP: ₹ {product.regularPrice}
              {product.discountPercent > 0 && (
                <span className="text-sm text-green-600 ml-2">
                  ({product.discountPercent}% OFF)
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500">incl. of taxes</p>
            <p className="text-sm text-gray-500">
              (Also includes all applicable duties)
            </p>
          </div>

          {/* Size Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Select Size</h2>
            <div className="flex flex-wrap gap-2">
              {product.availableSizes.map((sizeObj) => {
                const isAvailable = sizeObj.quantity > 0;
                return (
                  <button
                    key={sizeObj.size}
                    onClick={() => handleSizeSelect(sizeObj.size)}
                    disabled={!isAvailable}
                    className={`
                      relative px-4 py-2 border rounded-md
                      ${selectedSize === sizeObj.size
                        ? "border-black bg-black text-white"
                        : !isAvailable
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 hover:border-black"
                      }
                    `}
                  >
                    <span>{sizeObj.size}</span>
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-t border-gray-300 w-full absolute rotate-45"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedSize && (
              <p className="mt-2 text-sm text-green-600">
                Selected size:{" "}
                <span className="font-semibold">{selectedSize}</span>
                {" - "}
                {product.availableSizes.find(size => size.size === selectedSize)?.quantity || 0} units left
              </p>
            )}
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>

          {/* Color */}
          {product.color && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Color</h2>
              <p className="text-gray-700">{product.color}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Status */}
          {!product.isactive && (
            <p className="text-sm text-red-500 mt-2">
              This product is currently inactive.
            </p>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`w-full py-4 border border-black rounded-md ${!isOutOfStock
                  ? "bg-black text-white hover:bg-gray-900"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isOutOfStock || isLoading}
              onClick={handleAddToBag}
            >
              {isLoading
                ? "ADDING..."
                : isOutOfStock
                  ? "OUT OF STOCK"
                  : "ADD TO CART"}
            </button>
            <button
              className={`w-full py-4 bg-black text-white rounded-md ${!isOutOfStock
                  ? "hover:bg-gray-900"
                  : "bg-gray-200 cursor-not-allowed"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isOutOfStock || isLoading}
            // onClick={handleBuyNow}
            >
              {isLoading
                ? "PROCESSING..."
                : isOutOfStock
                  ? "OUT OF STOCK"
                  : "BUY NOW"}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatedCartModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        type="success"
        message={modalMessage}
      />

      <AnimatedCartModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        type="error"
        message={modalMessage}
      />
      <SelectSizeModal
        isOpen={showSelectSizeModal}
        onClose={() => setShowSelectSizeModal(false)}
      />

      <QuantityLimitModal
        isOpen
        ={showQuantityLimitModal}
        onClose={() => setShowQuantityLimitModal(false)}
        maxQuantity={MAX_QUANTITY}
      />

      {/* Related Products */}
      {relatedProducts.length > 0 ? (
        <div className="mt-16 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rounded-lg shadow-inner">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105"
                >
                  <ProductCard
                    id={relatedProduct._id}
                    name={relatedProduct.productName}
                    price={relatedProduct.regularPrice}
                    images={relatedProduct.images}
                    discountPercent={relatedProduct.discountPercent}
                    rating={relatedProduct.rating || 0}
                    reviewCount={relatedProduct.reviewCount || 0}
                    availableSizes={relatedProduct.availableSizes || []}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-16 text-center text-gray-500">
          No related products found in the same category
        </div>
      )}
    </div>
  );
}

