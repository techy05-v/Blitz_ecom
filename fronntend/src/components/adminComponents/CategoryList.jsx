import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaChevronLeft, 
  FaChevronRight 
} from "react-icons/fa";
import { toast } from 'sonner';
import CategoryService from '../../api/categoryServices/categoryService';
import offerApi from "../../api/offer/offerApi";
import ConfirmationModal from '../../confirmationModal/ConfirmationMadal';
import AddEditOfferModal from "../../confirmationModal/CategoryOfferModal";

function CategoryList() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAddPage = location.pathname.includes("/add");

  // State variables
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState({ type: '', id: null });

  // Offer modal state
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load categories with pagination
  const loadCategories = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const { 
        categories, 
        currentPage, 
        totalPages, 
        totalCategories 
      } = await CategoryService.fetchCategories(page, limit);
      console.log(categories)
      setCategories(categories);
      setCurrentPage(currentPage);
      setTotalPages(totalPages);
      setTotalCategories(totalCategories);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load categories");
      setLoading(false);
      toast.error("Failed to load categories");
    }
  };

  // Initial load of categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      loadCategories(newPage);
    }
  };

  // Toggle category status
  const handleToggleStatus = async (categoryId) => {
    try {
      setProcessingIds(prev => [...prev, categoryId]);
      await CategoryService.toggleCategoryStatus(categoryId);
      
      // Reload current page to ensure consistent state
      loadCategories(currentPage);

      toast.success("Category status updated successfully");
    } catch (error) {
      console.error("Failed to toggle category status", error);
      toast.error("Failed to update category status");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== categoryId));
    }
  };

  const openModal = (actionType, categoryId) => {
    setModalAction({ type: actionType, id: categoryId });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction({ type: '', id: null });
  };

  const handleConfirm = async () => {
    if (modalAction.type === 'edit') {
      navigate(`/admin/category/edit/${modalAction.id}`);
      toast.info("Editing category");
    } else if (modalAction.type === 'toggleStatus' && modalAction.id) {
      await handleToggleStatus(modalAction.id);
    }
  };

  const openOfferModal = (category) => {
    setSelectedCategory(category);
    setOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    setSelectedCategory(null);
    setOfferModalOpen(false);
  };

  const handleOfferSubmit = async (offerData) => {
    try {
      if (offerData._id) {
        // Edit existing offer
        await offerApi.editOffer(offerData._id, offerData);
        toast.success("Offer updated successfully");
      } else {
        // Add new offer
        await offerApi.createOffer({
          ...offerData,
          targetId: selectedCategory._id,
          targetType: 'category'
        });
        toast.success("Offer added successfully");
      }
      closeOfferModal();
      loadCategories(currentPage); // Reload the current page to show updated data
    } catch (error) {
      toast.error("Failed to save offer");
      console.error("Failed to save offer:", error);
    }
  };


  // Render loading spinner
  const renderLoadingSpinner = () => (
    <div className="text-center py-10">
      <div role="status">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );

  // Render error message
  const renderErrorMessage = () => (
    error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )
  );

  // Render pagination
  const renderPagination = () => (
    <div className="flex justify-between items-center mt-4">
      <div className="text-gray-600">
        Showing {(currentPage - 1) * 10 + 1} to{' '}
        {Math.min(currentPage * 10, totalCategories)} of {totalCategories} categories
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 border rounded flex items-center ${
            currentPage === 1 
              ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
              : "bg-white hover:bg-gray-100"
          }`}
        >
          <FaChevronLeft className="mr-2" /> Previous
        </button>
        <div className="flex items-center space-x-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`w-10 h-10 rounded ${
                currentPage === index + 1 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 border rounded flex items-center ${
            currentPage === totalPages 
              ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
              : "bg-white hover:bg-gray-100"
          }`}
        >
          Next <FaChevronRight className="ml-2" />
        </button>
      </div>
    </div>
  );

  // Render category table
  const renderCategoryTable = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {categories.length === 0 ? (
        <div className="text-center py-5 text-gray-500">
          No categories found
        </div>
      ) : (
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Description
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
            {categories.map((category) => (
              <tr
                key={category._id}
                className={processingIds.includes(category._id) ? "opacity-50" : ""}
              >
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {category.CategoryName}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap truncate max-w-xs">
                    {category.description}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span
                    className={`px-2 py-1 rounded ${
                      category.isactive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {category.isactive ? "Active" : "Blocked"}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openModal('edit', category._id)}
                      className="text-indigo-600 hover:text-indigo-900 transition duration-150 flex items-center"
                      disabled={processingIds.includes(category._id)}
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => openOfferModal(category)}
                      className="text-green-600 hover:text-green-800 transition duration-150 flex items-center"
                      disabled={processingIds.includes(category._id)}
                    >
                      <FaPlus className="mr-1" /> {category.offer ? "Edit Offer" : "Add Offer"}
                    </button>
                    <button
                      onClick={() => openModal('toggleStatus', category._id)}
                      className={`${
                        category.isactive
                          ? "text-red-600 hover:text-red-800"
                          : "text-green-600 hover:text-green-800"
                      } transition duration-150 flex items-center`}
                      disabled={processingIds.includes(category._id)}
                    >
                      {category.isactive ? 
                        (<><FaTrash className="mr-1" /> Block</>) : 
                        (<><FaPlus className="mr-1" /> Unblock</>)
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // If loading and no categories, show spinner
  if (loading && categories.length === 0) {
    return renderLoadingSpinner();
  }

  // Main render
  return (
    <div className="flex flex-col p-6">
      <div className={`${isAddPage ? "w-1/2" : "w-full"} pr-4`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <Link
            to="/admin/category/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Category
          </Link>
        </div>

        {renderErrorMessage()}
        {renderCategoryTable()}
        {renderPagination()}
      </div>
      {(isAddPage || location.pathname.includes("/edit")) && (
        <div className="w-1/2 pl-4">
          <Outlet />
        </div>
      )}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={`Confirm ${modalAction.type === 'edit' ? 'Edit' : 'Status Change'}`}
        message={`Are you sure you want to ${modalAction.type === 'edit' ? 'edit' : 'change the status of'} this category?`}
      />
      <AddEditOfferModal
        isOpen={offerModalOpen}
        onClose={closeOfferModal}
        onSubmit={handleOfferSubmit}
        category={selectedCategory}
      />
    </div>
  );
}

export default CategoryList;
