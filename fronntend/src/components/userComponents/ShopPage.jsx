import React, { useState, useEffect } from "react";
import { Filter, Loader, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../../authentication/user/ProductCard";
import { fetchProducts, fetchCategories } from "../../api/product";

const PaginationButton = ({ children, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-1 rounded-md text-sm font-medium
      ${active
        ? 'bg-black text-white'
        : 'bg-white text-gray-700 hover:bg-gray-50'
      }
      ${disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-gray-100'
      }
      border border-gray-300 mx-1
      transition-colors duration-200
    `}
  >
    {children}
  </button>
);

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    productsPerPage: 12
  });

  const location = useLocation();
  const navigate = useNavigate();

  const calculateTotalPages = (totalProducts, productsPerPage) => {
    return Math.max(1, Math.ceil(totalProducts / productsPerPage));
  };
  // Parse URL parameters on mount and when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const pageParam = parseInt(params.get('page')) || 1;
    const categoriesParam = params.get('categories');

    if (searchParam) setSearchQuery(searchParam);
    if (pageParam) {
      // Ensure page param is valid
      const validPage = Math.max(1, pageParam);
      setPagination(prev => ({ ...prev, currentPage: validPage }));
    }
    if (categoriesParam) {
      setSelectedCategories(new Set(categoriesParam.split(',')));
    }
  }, [location.search]);

  // Load products and categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        let backendSortOrder = "";
        switch (sortOrder) {
          case "Price: Low to High":
            backendSortOrder = "Low-High";
            break;
          case "Price: High to Low":
            backendSortOrder = "High-Low";
            break;
          case "Name: A to Z":
            backendSortOrder = "A-Z";
            break;
          case "Name: Z to A":
            backendSortOrder = "Z-A";
            break;
          default:
            backendSortOrder = "";
        }

        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(
            backendSortOrder,
            searchQuery,
            pagination.currentPage,
            pagination.productsPerPage
          ),
          fetchCategories(),
        ]);

        const activeProducts = Array.isArray(productsData.activeProducts)
          ? productsData.activeProducts
          : [];

        // Calculate actual total pages based on active products
        const actualTotalProducts = productsData.pagination.totalProducts;
        const actualTotalPages = calculateTotalPages(actualTotalProducts, pagination.productsPerPage);

        // If current page is greater than actual total pages, redirect to last valid page
        if (pagination.currentPage > actualTotalPages && actualTotalPages > 0) {
          const params = new URLSearchParams(location.search);
          params.set('page', actualTotalPages.toString());
          navigate(`${location.pathname}?${params.toString()}`);
          return; // Return early as we're going to reload with new page
        }

        setProducts(activeProducts);
        setPagination(prev => ({
          ...prev,
          totalPages: actualTotalPages,
          totalProducts: actualTotalProducts
        }));
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        console.error('Complete Load Error:', err);
        setError(err.message || 'Failed to load data. Please try again later.');
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sortOrder, searchQuery, pagination.currentPage, location.pathname]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }

      // Update URL with selected categories
      const params = new URLSearchParams(location.search);
      const categoryArray = Array.from(newSet);
      if (categoryArray.length > 0) {
        params.set('categories', categoryArray.join(','));
      } else {
        params.delete('categories');
      }
      params.set('page', '1'); // Reset to first page when changing categories
      navigate(`${location.pathname}?${params.toString()}`);

      return newSet;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    const params = new URLSearchParams();

    if (trimmedQuery) {
      params.set('search', trimmedQuery);
    }

    // Reset to first page on new search
    params.set('page', '1');
    navigate(`/user/shop?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/user/shop');
  };

  const handlePageChange = (newPage) => {
    // Validate the new page number
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.currentPage) {
      return;
    }

    const params = new URLSearchParams(location.search);
    params.set('page', newPage.toString());
    navigate(`${location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWishlistUpdate = async (productId, isWishlisted) => {
    if (isWishlisted) {
      setWishlistItems(prev => [...prev, productId]);
    } else {
      setWishlistItems(prev => prev.filter(id => id !== productId));
    }
  };

  const renderPagination = () => {
    const { currentPage, totalPages, totalProducts } = pagination;

    // Don't show pagination if there are no products or only one page
    if (totalProducts === 0 || totalPages <= 1) {
      return null;
    }

    const pages = [];
    const maxPagesVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesVisible - 1);

    if (endPage - startPage + 1 < maxPagesVisible) {
      startPage = Math.max(1, endPage - maxPagesVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center mt-8 space-x-1">
        <PaginationButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </PaginationButton>

        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-1">...</span>
            ) : (
              <PaginationButton
                onClick={() => handlePageChange(page)}
                active={page === currentPage}
              >
                {page}
              </PaginationButton>
            )}
          </React.Fragment>
        ))}

        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </PaginationButton>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(
    (product) =>
      selectedCategories.size === 0 || selectedCategories.has(product.category._id)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Filters</h2>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="mb-3 font-medium">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category._id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedCategories.has(category._id)}
                        onChange={() => handleCategoryChange(category._id)}
                      />
                      <span className="ml-2 text-sm">
                        {category.CategoryName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span className="text-sm font-medium">Sort by:</span>
                <select
                  className="rounded-lg border border-gray-300 py-1 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="">Newest</option>
                  <option value="Name: A to Z">Name: A to Z</option>
                  <option value="Name: Z to A">Name: Z to A</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                </select>
              </div>
              <span className="text-sm text-gray-600">
                Showing {filteredProducts.length} products
              </span>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.productName || "Unnamed Product"}
                  price={product.regularPrice || 0}
                  images={product.images || []}
                  discountPercent={product.discountPercent || 0}
                  availableSizes={product.availableSizes}
                  isInWishlist={wishlistItems.includes(product._id)}
                  onWishlistUpdate={handleWishlistUpdate}
                />
              ))}
            </div>

            {!loading && products.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found</p>
              </div>
            )}

            {/* Pagination */}
            {products.length > 0 && renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
}