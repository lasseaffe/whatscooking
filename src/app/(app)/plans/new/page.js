'use client';

import { useState } from 'react';

// --- Sub-Component: Skeleton Loader ---
const RecipeSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    <div className="flex gap-2">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="space-y-2 pt-4">
      <div className="h-4 bg-gray-100 rounded w-full"></div>
      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
      <div className="h-4 bg-gray-100 rounded w-full"></div>
    </div>
  </div>
);

// --- Main Page Component ---
export default function NewRecipePage() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  
  // Form State
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState([]);

 const handleImport = async () => {
  if (!importUrl) return;
  setIsLoading(true);
  
  try {
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: importUrl }),
    });

    const data = await res.json();

    // SUCCESS CASE: We got at least a title
    if (data.title && data.title !== "Import Error") {
      setRecipeName(data.title);
      setIngredients(data.ingredients || []);
      
      // If ingredients are empty, we just show a small notification 
      // instead of a giant error box that blocks the UI.
      if (!data.ingredients || data.ingredients.length === 0) {
        console.log("Bouncer blocked ingredients, but we got the title!");
      }
    } else {
      // ACTUAL FAIL CASE: No title and no ingredients
      alert("Chef couldn't even find the recipe name. Is the URL correct?");
    }
  } catch (err) {
    console.error("Import failed:", err);
    alert("Connection error. Check your terminal!");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="p-6 max-w-3xl mx-auto min-h-screen pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Plan</h1>
        <p className="text-gray-500">Import from the web or start from scratch.</p>
      </header>
      
      {/* URL Input Section */}
      <div className="flex gap-2 mb-10 p-4 bg-orange-50 rounded-2xl border border-orange-100 shadow-sm">
        <input 
          type="text" 
          placeholder="Paste recipe URL (AllRecipes, FoodNetwork, etc.)"
          className="flex-1 p-3 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none shadow-inner"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button 
          onClick={handleImport}
          disabled={loading || !url}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 disabled:bg-gray-300 transition-all shadow-md"
        >
          {loading ? 'Analyzing...' : 'Magic Import ✨'}
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
        {loading ? (
          <div className="py-10">
            <p className="text-sm text-orange-400 mb-6 animate-bounce font-medium text-center">
              Chef is reading the secret ingredients...
            </p>
            <RecipeSkeleton />
          </div>
        ) : recipeName ? (
          <div className="space-y-8 fade-in">
            {/* Title Field */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Recipe Name</label>
              <input 
                type="text" 
                value={recipeName} 
                onChange={(e) => setRecipeName(e.target.value)}
                className="text-3xl font-bold w-full border-b border-gray-100 focus:border-orange-500 outline-none py-2 transition-all"
              />
            </div>

            {/* Ingredients Field */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Ingredients</label>
              <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
                    <span className="text-gray-700 text-sm">{ing}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-4 text-orange-500 text-sm font-semibold hover:underline">+ Add manual ingredient</button>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 flex justify-end gap-3">
               <button className="px-6 py-2 text-gray-500 font-medium">Cancel</button>
               <button className="px-8 py-2 bg-black text-white rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-all">
                 Save Recipe
               </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-300">🍳</span>
            </div>
            <h3 className="text-gray-900 font-semibold">Your pan is empty</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Paste a URL above to autofill your recipe, or click here to start typing manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}