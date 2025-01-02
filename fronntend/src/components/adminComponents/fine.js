{(isAddPage || location.pathname.includes("/edit")) && (
    <div className="w-1/2 pl-4">
      <Outlet />
    </div>
  )}
  <DeleteModal
    isOpen={isDeleteModalOpen}
    onClose={() => setIsDeleteModalOpen(false)}
    onConfirm={handleDeleteCategory}
    categoryName={categoryToDelete?.CategoryName}
  />