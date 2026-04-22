'use client';
import { useState } from 'react';

export default function ImportPage() {
  const [importUrl, setImportUrl] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

      if (data.title) {
        setRecipeName(data.title);
        // If we got ingredients, use them. Otherwise, provide one empty slot to start.
        setIngredients(data.ingredients?.length > 0 ? data.ingredients : ['']);
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Chef couldn't reach the site. The bouncer is too tough!");
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = () => setIngredients([...ingredients, '']);
  const updateIngredient = (index, value) => {
    const newIngs = [...ingredients];
    newIngs[index] = value;
    setIngredients(newIngs);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Plan</h1>
        <p className="text-slate-500 mb-6">Import from the web or start from scratch.</p>
        
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <input
            type="text"
            placeholder="Paste recipe URL (AllRecipes, etc.)..."
            className="flex-1 p-3 border-none rounded-xl focus:ring-0 outline-none"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
          />
          <button 
            onClick={handleImport}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Magic Import ✨'}
          </button>
        </div>
      </header>

      {/* Renders the form if we have a name, otherwise shows the "Empty Pan" state */}
      {recipeName ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipe Name</label>
            <input
              className="text-2xl font-bold w-full border-b border-slate-100 py-2 focus:border-orange-500 outline-none"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Ingredients</label>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <input
                  key={idx}
                  className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-1 focus:ring-orange-500"
                  value={ing}
                  onChange={(e) => updateIngredient(idx, e.target.value)}
                  placeholder="e.g. 2 Cups of Flour"
                />
              ))}
              <button 
                onClick={addIngredient}
                className="text-orange-500 font-medium text-sm hover:underline"
              >
                + Add manual ingredient
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 border-t pt-6">
            <button 
                onClick={() => { setRecipeName(''); setIngredients([]); }}
                className="px-6 py-3 text-slate-500 font-medium"
            >
                Cancel
            </button>
            <button className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors">
              Save Recipe
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-4xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-slate-900">Your pan is empty</h3>
          <p className="text-slate-500 text-center max-w-xs">
            Paste a URL above to autofill your recipe, or click the import button to start.
          </p>
        </div>
      )}
    </div>
  );
}
