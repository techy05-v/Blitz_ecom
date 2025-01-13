import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductService from "../../api/productService/productService";
import offerApi from "../../api/offer/offerApi";
import { toast } from "react-toastify";
import ConfirmationModal from "../../confirmationModal/ConfirmationMadal";
import AddEditOfferModal from "../../confirmationModal/AddOffer";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState({ type: "", id: null });
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    setCurrentPage(page);
    setItemsPerPage(limit);
    fetchProducts(page, limit);
  }, [searchParams]);

  const fetchProducts = async (page, limit) => {
    try {
      setIsLoading(true);
      const response = await ProductService.getAllProducts(page, limit);
      console.log('Fetched products:', response.products); // Debug log
      setProducts(response.products);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
      setIsLoading(false);
    } catch (err) {
      console.error("Fetch Products Error:", err);
      setError(err.message || "Failed to fetch products");
      setIsLoading(false);
    }
  };
  

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({
        page: newPage.toString(),
        limit: itemsPerPage.toString(),
      });
    }
  };

  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setSearchParams({ page: "1", limit: newLimit.toString() });
  };

  const handleSoftDelete = async (productId) => {
    try {
      const updatedProduct = await ProductService.toggleProductStatus(
        productId
      );
      setProducts(
        products.map((product) =>
          product._id === productId
            ? { ...product, isactive: updatedProduct.isactive }
            : product
        )
      );
      toast.success(
        `Product ${
          updatedProduct.isactive ? "unblocked" : "blocked"
        } successfully`
      );
    } catch (error) {
      toast.error("Failed to update product status");
      console.error("Failed to toggle product status:", error);
    }
  };

  const openModal = (actionType, productId) => {
    setModalAction({ type: actionType, id: productId });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction({ type: "", id: null });
  };

  const handleConfirm = async () => {
    if (modalAction.type === "edit") {
      navigate(`/admin/products/edit/${modalAction.id}`);
    } else if (modalAction.type === "toggleStatus" && modalAction.id) {
      await handleSoftDelete(modalAction.id);
    }
  };

  const openOfferModal = (product) => {
    setSelectedProduct(product);
    setOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    setSelectedProduct(null);
    setOfferModalOpen(false);
  };

  const handleOfferSubmit = async (offerData) => {
    try {
      let response;
      if (offerData._id) {
        // Edit existing offer
        response = await offerApi.editOffer(offerData._id, offerData);
        toast.success("Offer updated successfully");
      } else {
        // Add new offer
        const completeOfferData = {
          ...offerData,
          targetId: selectedProduct._id,
          targetType: 'product'
        };
        response = await offerApi.createOffer(completeOfferData);
        toast.success("Offer added successfully");
      }
      closeOfferModal();
      
      // Ensure we're getting fresh data after offer changes
      await fetchProducts(currentPage, itemsPerPage);
    } catch (error) {
      toast.error("Failed to save offer");
      console.error("Failed to save offer:", error);
    }
  };

  const Pagination = () => (
    <div className="flex flex-col items-center space-y-4 mt-6">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          entries
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => handleLimitChange(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      <div className="flex justify-center items-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded flex items-center ${
            currentPage === 1
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          <FaChevronLeft className="mr-1" /> Previous
        </button>

        {[...Array(totalPages)].map((_, index) => {
          const pageNumber = index + 1;
          if (
            pageNumber === 1 ||
            pageNumber === totalPages ||
            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
          ) {
            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNumber
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {pageNumber}
              </button>
            );
          } else if (
            pageNumber === currentPage - 2 ||
            pageNumber === currentPage + 2
          ) {
            return <span key={pageNumber}>...</span>;
          }
          return null;
        })}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded flex items-center ${
            currentPage === totalPages
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          Next <FaChevronRight className="ml-1" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Products</h1>
        <Link
          to="/admin/products/add"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Product
        </Link>
      </div>
      {isLoading && <p>Loading products...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && products.length === 0 && <p>No products found.</p>}
      {!isLoading && products.length > 0 && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className={!product.isactive ? "bg-gray-100" : ""}
                  >
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          {product.images && product.images.length > 0 && (
                            <img
                              className="w-full h-full rounded-full"
                              src={product.images[0]}
                              alt={product.productName}
                            />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-900 whitespace-no-wrap">
                            {product.productName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {product.category?.CategoryName || "N/A"}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        ₹{product.salePrice}
                        {product.discountPercent > 0 && (
                          <span className="ml-2 text-xs text-green-500">
                            -{product.discountPercent}%
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {(() => {
                          const outOfStock = (
                            <span className="text-red-600">Out of Stock</span>
                          );
                          if (!product.availableSizes?.length)
                            return outOfStock;

                          const total = product.availableSizes.reduce(
                            (total, size) => total + (size.quantity || 0),
                            0
                          );
                          return total > 0 ? total : outOfStock;
                        })()}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          !product.isactive
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.isactive === false ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <button
                        onClick={() => openModal("edit", product._id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        disabled={!product.isactive}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openOfferModal(product)}
                        className="text-green-600 hover:text-green-800 mr-2"
                      >
                        {product.offer ? "Edit Offer" : "Add Offer"}
                      </button>
                      <button
                        onClick={() => openModal("toggleStatus", product._id)}
                        className={`${
                          !product.isactive
                            ? "text-green-600 hover:text-green-800"
                            : "text-red-600 hover:text-red-800"
                        }`}
                      >
                        {!product.isactive ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={`Confirm ${
          modalAction.type === "edit"
            ? "Edit"
            : modalAction.type === "toggleStatus"
            ? products.find((p) => p._id === modalAction.id)?.isactive
              ? "Block"
              : "Unblock"
            : ""
        }`}
        message={`Are you sure you want to ${
          modalAction.type === "edit"
            ? "edit"
            : modalAction.type === "toggleStatus"
            ? products.find((p) => p._id === modalAction.id)?.isactive
              ? "block"
              : "unblock"
            : ""
        } this product?`}
      />
      <AddEditOfferModal
        isOpen={offerModalOpen}
        onClose={closeOfferModal}
        onSubmit={handleOfferSubmit}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductList;

