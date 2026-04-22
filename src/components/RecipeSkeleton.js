export const RecipeSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {/* Title placeholder */}
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    
    {/* Metadata placeholders */}
    <div className="flex gap-2">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>

    {/* Ingredients list placeholder */}
    <div className="space-y-2 pt-4">
      <div className="h-4 bg-gray-100 rounded w-full"></div>
      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
      <div className="h-4 bg-gray-100 rounded w-full"></div>
      <div className="h-4 bg-gray-100 rounded w-4/6"></div>
    </div>
  </div>
);